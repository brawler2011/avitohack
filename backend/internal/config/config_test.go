package config

import (
	"testing"
)

func TestLoad(t *testing.T) {
	t.Setenv("OPENROUTER_API_KEY", "test-key")
	cfg := Load()
	if cfg == nil {
		t.Fatal("expected config to be non-nil")
	}
	if cfg.OpenRouterAPIKey == "" {
		t.Errorf("expected OpenRouterAPIKey to be set from environment, got empty string")
	}
}
