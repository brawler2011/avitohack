package config

import (
	"testing"
)

func TestLoad(t *testing.T) {
	cfg := Load()
	if cfg == nil {
		t.Fatal("expected config to be non-nil")
	}
	if cfg.OpenRouterAPIKey == "" {
		t.Errorf("expected OpenRouterAPIKey to be set from .env, got empty string")
	}
}
