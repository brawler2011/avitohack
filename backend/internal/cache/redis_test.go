package cache

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNilCacheService(t *testing.T) {
	t.Parallel()

	var c *CacheService
	ctx := context.Background()

	assert.False(t, c.IsAvailable())

	var val string
	assert.False(t, c.Get(ctx, "test_key", &val))

	c.Set(ctx, "test_key", "value", time.Minute)
	c.Delete(ctx, "test_key")
	c.DeletePattern(ctx, "test_*")

	err := c.FlushAll(ctx)
	assert.Error(t, err)

	assert.NoError(t, c.Close())
}
