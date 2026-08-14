package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/avitohack/backend/internal/config"
	"github.com/avitohack/backend/internal/db"
	"github.com/avitohack/backend/internal/queue"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/avitohack/backend/internal/service"
	"github.com/avitohack/backend/internal/ws"
	"github.com/avitohack/backend/pkg/api"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func slogMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			t1 := time.Now()
			defer func() {
				logger.Info("HTTP request",
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.Int("status", ww.Status()),
					slog.Int("bytes", ww.BytesWritten()),
					slog.Duration("duration", time.Since(t1)),
					slog.String("remote_addr", r.RemoteAddr),
				)
			}()
			next.ServeHTTP(ww, r)
		})
	}
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()

	var dbPool *pgxpool.Pool
	var queries sqlc.Querier

	connCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	dbPool, err := pgxpool.New(connCtx, cfg.DatabaseURL)
	if err == nil {
		err = dbPool.Ping(connCtx)
	}
	cancel()

	if err != nil {
		slog.Warn("Database connection failed, continuing without DB connection", slog.Any("error", err))
	} else {
		slog.Info("Connected to PostgreSQL successfully!")
		queries = sqlc.New(dbPool)

		// Load seed data from CSV inside database transactions
		if err := db.LoadCSVData(context.Background(), dbPool, queries, cfg.CSVUsersPath, cfg.CSVActivitiesPath); err != nil {
			slog.Warn("CSV loading error", slog.Any("error", err))
		} else {
			slog.Info("CSV seed data loaded into DB successfully via transactions!")
		}
	}

	llmGen := service.NewLLMGenerator(cfg.OpenRouterAPIKey, cfg.OpenRouterModel)
	if llmGen.IsAvailable() {
		slog.Info("OpenRouter LLM generator initialized", slog.String("model", cfg.OpenRouterModel))
	} else {
		slog.Warn("OpenRouter API key is not set. Service will use template fallback.")
	}

	// Initialize WebSocket Hub
	wsHub := ws.NewHub()
	go wsHub.Run()

	// Initialize RabbitMQ Queue Service
	queueSvc, err := queue.NewQueueService(cfg.RabbitMQURL)
	if err != nil {
		slog.Warn("RabbitMQ connection warning", slog.Any("error", err))
	} else {
		defer queueSvc.Close()
	}

	// Initialize RecapService
	recapSvc := service.NewRecapService(queries, llmGen, queueSvc, wsHub)

	// Start 3 worker goroutines for processing tasks from RabbitMQ
	if queueSvc != nil {
		err := queueSvc.StartWorkers(context.Background(), 3, func(ctx context.Context, task queue.GenerationTask) error {
			return recapSvc.GenerateAndStoreRecapForUser(ctx, task.UserID, task.Force)
		})
		if err != nil {
			slog.Error("Failed to start RabbitMQ workers", slog.Any("error", err))
		}
	}

	strictHandler := api.NewStrictHandler(recapSvc, nil)

	r := chi.NewRouter()
	r.Use(slogMiddleware(logger))
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"service":"Avito Year in Review API","status":"ok"}`))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// WebSocket endpoint for Admin Dashboard
	r.Get("/api/v1/admin/ws", wsHub.ServeHTTP)

	api.HandlerFromMux(strictHandler, r)

	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	slog.Info("Starting Avito Year in Review server", slog.String("addr", serverAddr))
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		slog.Error("Server stopped", slog.Any("error", err))
		os.Exit(1)
	}
}
