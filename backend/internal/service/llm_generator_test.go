package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLLMGenerator_IsAvailable(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		apiKey        string
		model         string
		expectedAvail bool
		expectedModel string
	}{
		{
			name:          "empty api key returns unavailable and default model",
			apiKey:        "",
			model:         "",
			expectedAvail: false,
			expectedModel: "gemini-2.5-flash",
		},
		{
			name:          "api key set with default model fallback",
			apiKey:        "test-api-key",
			model:         "",
			expectedAvail: true,
			expectedModel: "gemini-2.5-flash",
		},
		{
			name:          "api key set with gemini model strips vendor prefix",
			apiKey:        "sk-or-v1-12345",
			model:         "google/gemini-2.5-flash",
			expectedAvail: true,
			expectedModel: "gemini-2.5-flash",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			gen := NewLLMGenerator(tt.apiKey, tt.model)
			assert.Equal(t, tt.expectedAvail, gen.IsAvailable())
			assert.Equal(t, tt.expectedModel, gen.model)
		})
	}
}

func TestLLMGenerator_ParseProxyAPIResponseBody(t *testing.T) {
	t.Parallel()

	validContentJSON := `{"ai_summary":{"title":"Главный Торговец","story":"Отличный год на Авито!","archetype":"Профи-Продавец","generated_by_ai":true},"cards":[{"id":"card_1","card_type":"welcome","title":"Привет!","subtitle":"Итоги","highlight_stat":"Профи","description":"Отличная работа","bg_gradient":"from-emerald-600 to-teal-700","icon_name":"sparkles","explanation":"Тест"}],"achievements":[{"id":"ach_1","code":"SUPER_SELLER","name":"Супер Продавец","description":"Продали много товаров","badge_icon":"trophy","level":3,"current_progress":10,"max_progress":10,"is_unlocked":true,"cta_text":"Продолжить","cta_action":"/add-item","explanation":"Вы продали 10 товаров"}]}`

	tests := []struct {
		name          string
		rawResponse   string
		expectErr     bool
		expectedTitle string
		expectedCardN int
		expectedAchN  int
	}{
		{
			name: "successful proxyapi response parsing",
			rawResponse: fmt.Sprintf(`{
				"choices": [
					{
						"message": {
							"content": %q
						}
					}
				]
			}`, validContentJSON),
			expectErr:     false,
			expectedTitle: "Главный Торговец",
			expectedCardN: 1,
			expectedAchN:  1,
		},
		{
			name:        "invalid outer JSON payload",
			rawResponse: `{ invalid json `,
			expectErr:   true,
		},
		{
			name: "empty choices array",
			rawResponse: `{
				"choices": []
			}`,
			expectErr: true,
		},
		{
			name: "empty message content string",
			rawResponse: `{
				"choices": [
					{
						"message": {
							"content": ""
						}
					}
				]
			}`,
			expectErr: true,
		},
		{
			name: "invalid json string inside choice message content",
			rawResponse: `{
				"choices": [
					{
						"message": {
							"content": "not a json string"
						}
					}
				]
			}`,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			gen := NewLLMGenerator("test-key", "google/gemini-2.5-flash")

			res, err := gen.parseProxyAPIResponseBody([]byte(tt.rawResponse))
			if tt.expectErr {
				assert.Error(t, err)
				assert.Nil(t, res)
			} else {
				require.NoError(t, err)
				require.NotNil(t, res)
				assert.Equal(t, tt.expectedTitle, res.AISummary.Title)
				assert.True(t, res.AISummary.GeneratedByAI)
				assert.Len(t, res.Cards, tt.expectedCardN)
				assert.Len(t, res.Achievements, tt.expectedAchN)
			}
		})
	}
}

func (g *LLMGenerator) parseProxyAPIResponseBody(respBytes []byte) (*LLMRecapResult, error) {
	var parsedResp proxyAPIResponse
	if err := json.Unmarshal(respBytes, &parsedResp); err != nil {
		return nil, err
	}
	if len(parsedResp.Choices) == 0 || parsedResp.Choices[0].Message.Content == "" {
		return nil, errors.New("empty choice")
	}
	var result LLMRecapResult
	if err := json.Unmarshal([]byte(parsedResp.Choices[0].Message.Content), &result); err != nil {
		return nil, err
	}
	result.AISummary.GeneratedByAI = true
	return &result, nil
}
