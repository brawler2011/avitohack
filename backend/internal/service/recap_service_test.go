package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateShareToken(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		userID     int32
		expectedLen int
	}{
		{
			name:        "token for user ID 1",
			userID:      1,
			expectedLen: 16,
		},
		{
			name:        "token for user ID 100",
			userID:      100,
			expectedLen: 16,
		},
		{
			name:        "token for user ID 9999",
			userID:      9999,
			expectedLen: 16,
		},
		{
			name:        "token for zero user ID",
			userID:      0,
			expectedLen: 16,
		},
		{
			name:        "token for negative user ID",
			userID:      -5,
			expectedLen: 16,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			token := generateShareToken(tt.userID)

			assert.Len(t, token, tt.expectedLen, "token length should be exactly 16 chars")

			// Check determinism: running again yields exact same token
			repeatToken := generateShareToken(tt.userID)
			assert.Equal(t, token, repeatToken, "token generation must be deterministic")
		})
	}
}

func TestGenerateShareToken_Uniqueness(t *testing.T) {
	t.Parallel()

	userIDs := []int32{1, 2, 3, 42, 100, 2024}
	seenTokens := make(map[string]int32)

	for _, id := range userIDs {
		token := generateShareToken(id)
		if existingID, exists := seenTokens[token]; exists {
			t.Fatalf("Collision detected for userID %d and %d with token %s", id, existingID, token)
		}
		seenTokens[token] = id
	}
}

func TestNewRecapService_NilCache(t *testing.T) {
	t.Parallel()
	svc := NewRecapService(nil, nil, nil, nil, nil)
	assert.NotNil(t, svc)
}
