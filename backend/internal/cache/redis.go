package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type CacheService struct {
	client *redis.Client
}

func NewRedisCacheService(redisURL string) (*CacheService, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}

	return &CacheService{client: client}, nil
}

func (c *CacheService) IsAvailable() bool {
	return c != nil && c.client != nil
}

func (c *CacheService) Get(ctx context.Context, key string, dest interface{}) bool {
	if !c.IsAvailable() {
		return false
	}
	val, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			slog.Warn("Redis GET error", slog.String("key", key), slog.Any("error", err))
		}
		return false
	}
	if err := json.Unmarshal(val, dest); err != nil {
		slog.Warn("Redis JSON unmarshal error", slog.String("key", key), slog.Any("error", err))
		return false
	}
	slog.Info("Redis Cache HIT", slog.String("key", key))
	return true
}

func (c *CacheService) Set(ctx context.Context, key string, val interface{}, ttl time.Duration) {
	if !c.IsAvailable() {
		return
	}
	bytes, err := json.Marshal(val)
	if err != nil {
		slog.Warn("Redis JSON marshal error", slog.String("key", key), slog.Any("error", err))
		return
	}
	if err := c.client.Set(ctx, key, bytes, ttl).Err(); err != nil {
		slog.Warn("Redis SET error", slog.String("key", key), slog.Any("error", err))
	} else {
		slog.Debug("Redis Cache SET", slog.String("key", key), slog.Duration("ttl", ttl))
	}
}

func (c *CacheService) Delete(ctx context.Context, keys ...string) {
	if !c.IsAvailable() || len(keys) == 0 {
		return
	}
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		slog.Warn("Redis DEL error", slog.Any("keys", keys), slog.Any("error", err))
	} else {
		slog.Info("Redis Cache Evicted keys", slog.Any("keys", keys))
	}
}

func (c *CacheService) DeletePattern(ctx context.Context, pattern string) {
	if !c.IsAvailable() {
		return
	}
	var cursor uint64
	var keys []string
	for {
		var k []string
		var err error
		k, cursor, err = c.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			slog.Warn("Redis SCAN error", slog.String("pattern", pattern), slog.Any("error", err))
			break
		}
		keys = append(keys, k...)
		if cursor == 0 {
			break
		}
	}
	if len(keys) > 0 {
		c.Delete(ctx, keys...)
	}
}

func (c *CacheService) FlushAll(ctx context.Context) error {
	if !c.IsAvailable() {
		return errors.New("redis unavailable")
	}
	err := c.client.FlushAll(ctx).Err()
	if err != nil {
		slog.Warn("Redis FlushAll error", slog.Any("error", err))
		return err
	}
	slog.Info("Redis Cache FLUSHALL completed successfully")
	return nil
}

func (c *CacheService) Close() error {
	if c != nil && c.client != nil {
		return c.client.Close()
	}
	return nil
}
