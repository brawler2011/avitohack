FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .
COPY data /data

EXPOSE 8080

CMD ["/app/server"]
