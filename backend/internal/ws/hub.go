package ws

import (
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type EventMessage struct {
	Type      string `json:"type"`
	UserID    int    `json:"user_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

type Hub struct {
	mu         sync.RWMutex
	clients    map[*websocket.Conn]bool
	upgrader   websocket.Upgrader
	broadcast  chan EventMessage
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan EventMessage, 256),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			slog.Info("WebSocket client connected", slog.String("remote_addr", client.RemoteAddr().String()))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				_ = client.Close()
				slog.Info("WebSocket client disconnected", slog.String("remote_addr", client.RemoteAddr().String()))
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				err := client.WriteJSON(msg)
				if err != nil {
					slog.Warn("WebSocket write failed, closing connection", slog.Any("error", err))
					_ = client.Close()
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastEvent(userID int, status, message string) {
	evt := EventMessage{
		Type:      "TASK_STATUS",
		UserID:    userID,
		Status:    status,
		Message:   message,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	select {
	case h.broadcast <- evt:
	default:
		slog.Warn("Broadcast queue full, message dropped", slog.Int("user_id", userID))
	}
}

func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade WebSocket connection", slog.Any("error", err))
		return
	}
	h.register <- conn

	go func() {
		defer func() {
			h.unregister <- conn
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}
