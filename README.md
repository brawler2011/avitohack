# Билд

```bash
docker-compose up --build
```

После запуска приложение будет доступно:
- **Frontend App**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`

---

## Локальная разработка

### 1. Бд

```bash
docker compose up postgres -d
```

### 2. Бэкенд
```bash
cd backend
# Запуск тестов
go test ./...

# Запуск сервера
go run cmd/server/main.go
```

### 3. Фронтенд
```bash
cd frontend
bun install
bun run dev
```

