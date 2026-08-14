package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const QueueName = "recap_generation_queue"

type GenerationTask struct {
	UserID int  `json:"user_id"`
	Force  bool `json:"force"`
}

type QueueService struct {
	url     string
	conn    *amqp.Connection
	ch      *amqp.Channel
	mu      sync.Mutex
	closed  bool
}

func NewQueueService(url string) (*QueueService, error) {
	qs := &QueueService{url: url}
	if err := qs.connect(); err != nil {
		return nil, fmt.Errorf("rabbitmq connection failed: %w", err)
	}
	return qs, nil
}

func (qs *QueueService) connect() error {
	qs.mu.Lock()
	defer qs.mu.Unlock()

	conn, err := amqp.Dial(qs.url)
	if err != nil {
		return fmt.Errorf("failed to dial rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	_, err = ch.QueueDeclare(
		QueueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	qs.conn = conn
	qs.ch = ch
	qs.closed = false
	slog.Info("Connected to RabbitMQ successfully", slog.String("queue", QueueName))
	return nil
}

func (qs *QueueService) EnqueueTask(userID int, force bool) error {
	qs.mu.Lock()
	defer qs.mu.Unlock()

	if qs.closed || qs.ch == nil {
		return fmt.Errorf("rabbitmq service is closed or disconnected")
	}

	task := GenerationTask{
		UserID: userID,
		Force:  force,
	}

	body, err := json.Marshal(task)
	if err != nil {
		return fmt.Errorf("failed to marshal task: %w", err)
	}

	err = qs.ch.PublishWithContext(
		context.Background(),
		"",        // exchange
		QueueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			DeliveryMode: amqp.Persistent,
			ContentType:  "application/json",
			Body:         body,
			Timestamp:    time.Now(),
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message to rabbitmq: %w", err)
	}

	slog.Info("Task published to RabbitMQ queue", slog.Int("user_id", userID), slog.Bool("force", force))
	return nil
}

func (qs *QueueService) StartWorkers(ctx context.Context, numWorkers int, handler func(ctx context.Context, task GenerationTask) error) error {
	qs.mu.Lock()
	ch := qs.ch
	qs.mu.Unlock()

	if ch == nil {
		return fmt.Errorf("rabbitmq channel is nil")
	}

	// Set QoS prefetch to 1 per worker
	err := ch.Qos(numWorkers, 0, false)
	if err != nil {
		return fmt.Errorf("failed to set rabbitmq qos: %w", err)
	}

	msgs, err := ch.Consume(
		QueueName, // queue
		"",        // consumer
		false,     // auto-ack = false (manual ack for reliable processing)
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)
	if err != nil {
		return fmt.Errorf("failed to consume queue: %w", err)
	}

	slog.Info("Starting RabbitMQ worker pool", slog.Int("worker_count", numWorkers))

	for i := 1; i <= numWorkers; i++ {
		workerID := i
		go func() {
			slog.Info("Worker started", slog.Int("worker_id", workerID))
			for {
				select {
				case <-ctx.Done():
					slog.Info("Worker shutting down", slog.Int("worker_id", workerID))
					return
				case msg, ok := <-msgs:
					if !ok {
						slog.Warn("Worker channel closed", slog.Int("worker_id", workerID))
						return
					}

					var task GenerationTask
					if err := json.Unmarshal(msg.Body, &task); err != nil {
						slog.Error("Failed to unmarshal task from queue", slog.Int("worker_id", workerID), slog.Any("error", err))
						_ = msg.Nack(false, false)
						continue
					}

					slog.Info("Worker processing task", slog.Int("worker_id", workerID), slog.Int("user_id", task.UserID))
					
					taskCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
					err := handler(taskCtx, task)
					cancel()

					if err != nil {
						slog.Error("Worker failed to process task", slog.Int("worker_id", workerID), slog.Int("user_id", task.UserID), slog.Any("error", err))
						_ = msg.Nack(false, true) // requeue on error
					} else {
						slog.Info("Worker completed task successfully", slog.Int("worker_id", workerID), slog.Int("user_id", task.UserID))
						_ = msg.Ack(false)
					}
				}
			}
		}()
	}

	return nil
}

func (qs *QueueService) Close() {
	qs.mu.Lock()
	defer qs.mu.Unlock()
	qs.closed = true
	if qs.ch != nil {
		_ = qs.ch.Close()
	}
	if qs.conn != nil {
		_ = qs.conn.Close()
	}
}
