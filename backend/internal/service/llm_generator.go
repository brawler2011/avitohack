package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/avitohack/backend/internal/domain"
	"github.com/avitohack/backend/pkg/api"
)

type LLMGenerator struct {
	apiKey string
	model  string
	client *http.Client
}

func NewLLMGenerator(apiKey, model string) *LLMGenerator {
	if model == "" {
		model = "google/gemini-2.0-flash-001"
	}
	return &LLMGenerator{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (g *LLMGenerator) IsAvailable() bool {
	return g.apiKey != ""
}

type LLMRecapResult struct {
	AISummary    domain.AISummaryResult `json:"ai_summary"`
	Cards        []api.RecapCard        `json:"cards"`
	Achievements []api.Achievement      `json:"achievements"`
}

type openRouterRequest struct {
	Model          string              `json:"model"`
	Messages       []openRouterMessage `json:"messages"`
	ResponseFormat *responseFormat     `json:"response_format,omitempty"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type openRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (g *LLMGenerator) GenerateRecap(ctx context.Context, fullName, userType string, metrics UserActivityResult) (*LLMRecapResult, error) {
	if !g.IsAvailable() {
		return nil, fmt.Errorf("openrouter api key is not set")
	}

	systemPrompt := `Ты — креативный ИИ-копирайтер и аналитик Итогов Года на Авито (Avito Year in Review).
Твоя задача — сгенерировать персонализированный набор результатов итогов года на основе аналитики пользователя.

ВЫВОД ДОЛЖЕН БЫТЬ СТРОГО В ФОРМАТЕ JSON следующего вида:
{
  "ai_summary": {
    "title": "Звание пользователя (например: Главный Техно-Маг, Королева Стиля, Авто-Гуру)",
    "story": "Увлекательный и ироничный рассказ в 2-3 предложениях о победах пользователя на Авито за год",
    "archetype": "Короткий класс (например: Профи-Продавец, Охотник за Скидками, Мастер Интерьера)",
    "generated_by_ai": true
  },
  "cards": [
    {
      "id": "card_1_welcome",
      "card_type": "welcome",
      "title": "Привет, [Имя]!",
      "subtitle": "Твой 2024 год на Авито",
      "highlight_stat": "[Архетип]",
      "description": "[Короткое вступление]",
      "bg_gradient": "from-emerald-600 via-teal-600 to-cyan-700",
      "icon_name": "sparkles",
      "explanation": "Персональное приветствие на основе анализа профиля"
    },
    {
      "id": "card_2_category",
      "card_type": "category",
      "title": "Главное увлечение",
      "subtitle": "Категория №1 в вашем профиле",
      "highlight_stat": "[Топ Категория]",
      "description": "[Интересный факт о поведении в этой категории]",
      "bg_gradient": "from-blue-600 via-indigo-600 to-purple-700",
      "icon_name": "compass",
      "explanation": "Рассчитано по количеству просмотров и сделок",
      "cta_text": "Искать дальше",
      "cta_action": "/search"
    },
    {
      "id": "card_3_finance",
      "card_type": "finance",
      "title": "Финансовые итоги",
      "subtitle": "Результат ваших решений",
      "highlight_stat": "[Выгода в ₽]",
      "description": "[Сколько заработано и/или сэкономили]",
      "bg_gradient": "from-purple-600 via-pink-600 to-rose-600",
      "icon_name": "coins",
      "explanation": "Сумма продаж и выгоды от покупок",
      "cta_text": "Выложить объявление",
      "cta_action": "/add-item"
    },
    {
      "id": "card_4_custom",
      "card_type": "custom",
      "title": "[Уникальный заголовок на основе привычек, например: Ночные Покупки]",
      "subtitle": "[Подзаголовок]",
      "highlight_stat": "[Интересный факт или число]",
      "description": "[Подробное описание привычки юзера]",
      "bg_gradient": "from-amber-500 via-orange-600 to-red-600",
      "icon_name": "zap",
      "explanation": "Индивидуальный тренд вашей активности",
      "cta_text": "Узнать больше",
      "cta_action": "/trends"
    },
    {
      "id": "card_5_cta",
      "card_type": "cta",
      "title": "Ваш следующий шаг",
      "subtitle": "Готовы к рекордам?",
      "highlight_stat": "[Титул]",
      "description": "Поделитесь итогами с друзьями!",
      "bg_gradient": "from-teal-500 via-emerald-600 to-green-700",
      "icon_name": "rocket",
      "explanation": "Рекомендация по профилю",
      "cta_text": "Поделиться карточкой",
      "cta_action": "share"
    }
  ],
  "achievements": [
    {
      "id": "ach_1",
      "code": "UNIQUE_CODE",
      "name": "Название ачивки",
      "description": "Как получить или описание успеха",
      "badge_icon": "trophy",
      "level": 1,
      "current_progress": 5,
      "max_progress": 10,
      "is_unlocked": true,
      "cta_text": "Кнопка",
      "cta_action": "/action",
      "explanation": "Почему ачивка получена"
    }
  ]
}

Важные правила:
1. Выдавай ровно 4-5 ачивок, идеально подходящих под статистику пользователя!
2. Для иконок (icon_name и badge_icon) используй только известные имена иконок Lucide: sparkles, compass, coins, zap, award, rocket, tag, piggy-bank, moon, heart, package, search, star, shield, flame.
3. Цвета bg_gradient должны быть красивыми градиентами Tailwind CSS (например, "from-emerald-600 via-teal-600 to-cyan-700", "from-amber-500 via-orange-600 to-red-600", "from-violet-600 via-purple-600 to-indigo-700").
4. Текст должен быть драйвовым, оптимистичным и дружелюбным.`

	userPromptData := map[string]any{
		"full_name":              fullName,
		"user_type":              userType,
		"total_activities":       metrics.TotalActivities,
		"total_posted":           metrics.TotalPosted,
		"total_sold":             metrics.TotalSold,
		"total_bought":           metrics.TotalBought,
		"total_earned_rub":       metrics.TotalEarned,
		"total_saved_rub":        metrics.TotalSaved,
		"top_category":           metrics.TopCategory,
		"response_speed_sec":     metrics.ResponseSpeedSec,
		"categories_breakdown":   metrics.CategoriesMap,
		"searches":               metrics.Searches,
		"favorites_count":        metrics.FavoritesCount,
		"deliveries_count":       metrics.DeliveriesCount,
		"reviews_count":          metrics.ReviewsCount,
		"night_activities_count": metrics.NightActivityCnt,
	}

	promptBytes, _ := json.Marshal(userPromptData)

	reqBody := openRouterRequest{
		Model: g.model,
		Messages: []openRouterMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: fmt.Sprintf("Вот статистика пользователя для генерации Итогов Года:\n%s", string(promptBytes))},
		},
		ResponseFormat: &responseFormat{Type: "json_object"},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal openrouter request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+g.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("HTTP-Referer", "https://avitohack.local")
	httpReq.Header.Set("X-Title", "Avito Year in Review")

	resp, err := g.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openrouter api call failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read openrouter response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openrouter returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var parsedResp openRouterResponse
	if err := json.Unmarshal(respBytes, &parsedResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal openrouter response: %w", err)
	}

	if parsedResp.Error != nil {
		return nil, fmt.Errorf("openrouter api error: %s", parsedResp.Error.Message)
	}

	if len(parsedResp.Choices) == 0 || parsedResp.Choices[0].Message.Content == "" {
		return nil, fmt.Errorf("openrouter returned empty response choice")
	}

	var result LLMRecapResult
	if err := json.Unmarshal([]byte(parsedResp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse generated json content: %w (content: %s)", err, parsedResp.Choices[0].Message.Content)
	}

	result.AISummary.GeneratedByAI = true

	return &result, nil
}
