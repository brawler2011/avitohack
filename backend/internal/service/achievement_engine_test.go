package service

import (
	"testing"
	"time"

	"github.com/avitohack/backend/pkg/api"
	"github.com/stretchr/testify/assert"
)

func TestCalculateUserMetrics(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		activities []ActivityRecord
		expected   UserActivityResult
	}{
		{
			name:       "empty activities list",
			activities: nil,
			expected: UserActivityResult{
				TotalActivities:  0,
				TotalPosted:      0,
				TotalSold:        0,
				TotalBought:      0,
				TotalEarned:      0,
				TotalSaved:       0,
				TopCategory:      "Разное",
				ResponseSpeedSec: 0,
				NightActivityCnt: 0,
				Searches:         []string{},
				CategoriesMap:    map[string]int{},
			},
		},
		{
			name: "standard activity mix with totals and top category",
			activities: []ActivityRecord{
				{ActivityType: "item_posted", Category: "Электроника", Price: 50000},
				{ActivityType: "item_sold", Category: "Электроника", Price: 50000},
				{ActivityType: "item_bought", Category: "Одежда", Price: 3000, SavedAmount: 1500},
				{ActivityType: "chat_received", Category: "Электроника", ResponseTimeSec: 120},
				{ActivityType: "search", Title: "iPhone 15"},
				{ActivityType: "save_favorite"},
				{ActivityType: "delivery_sent"},
				{ActivityType: "delivery_received"},
				{ActivityType: "review_left"},
			},
			expected: UserActivityResult{
				TotalActivities:  9,
				TotalPosted:      1,
				TotalSold:        1,
				TotalBought:      1,
				TotalEarned:      50000,
				TotalSaved:       1500,
				TopCategory:      "Электроника",
				ResponseSpeedSec: 120,
				FavoritesCount:   1,
				DeliveriesCount:  2,
				ReviewsCount:     1,
				Searches:         []string{"iPhone 15"},
			},
		},
		{
			name: "category resolution and frequency ties",
			activities: []ActivityRecord{
				{ActivityType: "item_posted", Category: "Книги"},
				{ActivityType: "item_posted", Category: "Книги"},
				{ActivityType: "item_posted", Category: "Авто"},
			},
			expected: UserActivityResult{
				TotalActivities: 3,
				TotalPosted:     3,
				TopCategory:     "Книги",
			},
		},
		{
			name: "night activity detection and day hour filtering",
			activities: []ActivityRecord{
				{ActivityType: "search", Timestamp: time.Date(2024, 5, 1, 23, 30, 0, 0, time.UTC)}, // Night
				{ActivityType: "search", Timestamp: time.Date(2024, 5, 2, 2, 15, 0, 0, time.UTC)},   // Night
				{ActivityType: "search", Timestamp: time.Date(2024, 5, 2, 5, 59, 0, 0, time.UTC)},   // Night
				{ActivityType: "search", Timestamp: time.Date(2024, 5, 2, 6, 0, 0, 0, time.UTC)},    // Day
				{ActivityType: "search", Timestamp: time.Date(2024, 5, 2, 14, 0, 0, 0, time.UTC)},   // Day
				{ActivityType: "search", Timestamp: time.Time{}},                                     // Zero time ignored
			},
			expected: UserActivityResult{
				TotalActivities:  6,
				NightActivityCnt: 3,
				TopCategory:      "Разное",
			},
		},
		{
			name: "chat response speed minimum calculation",
			activities: []ActivityRecord{
				{ActivityType: "chat_received", ResponseTimeSec: 300},
				{ActivityType: "chat_sent", ResponseTimeSec: 45},
				{ActivityType: "chat_received", ResponseTimeSec: 150},
				{ActivityType: "chat_received", ResponseTimeSec: 0},  // Ignored (<= 0)
				{ActivityType: "chat_sent", ResponseTimeSec: -10},    // Ignored (<= 0)
			},
			expected: UserActivityResult{
				TotalActivities:  5,
				ResponseSpeedSec: 45,
				TopCategory:      "Разное",
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := CalculateUserMetrics(tt.activities)

			assert.Equal(t, tt.expected.TotalActivities, got.TotalActivities)
			assert.Equal(t, tt.expected.TotalPosted, got.TotalPosted)
			assert.Equal(t, tt.expected.TotalSold, got.TotalSold)
			assert.Equal(t, tt.expected.TotalBought, got.TotalBought)
			assert.Equal(t, tt.expected.TotalEarned, got.TotalEarned)
			assert.Equal(t, tt.expected.TotalSaved, got.TotalSaved)
			assert.Equal(t, tt.expected.TopCategory, got.TopCategory)
			assert.Equal(t, tt.expected.ResponseSpeedSec, got.ResponseSpeedSec)
			assert.Equal(t, tt.expected.NightActivityCnt, got.NightActivityCnt)
			if tt.expected.FavoritesCount > 0 {
				assert.Equal(t, tt.expected.FavoritesCount, got.FavoritesCount)
			}
			if tt.expected.DeliveriesCount > 0 {
				assert.Equal(t, tt.expected.DeliveriesCount, got.DeliveriesCount)
			}
			if tt.expected.ReviewsCount > 0 {
				assert.Equal(t, tt.expected.ReviewsCount, got.ReviewsCount)
			}
			if len(tt.expected.Searches) > 0 {
				assert.Equal(t, tt.expected.Searches, got.Searches)
			}
		})
	}
}

func TestEvaluateAchievements(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name                 string
		metrics              UserActivityResult
		expectedAchCount     int
		expectedAchievements map[string]struct {
			isUnlocked bool
			level      int
		}
	}{
		{
			name:             "zero metrics - all achievements locked",
			metrics:          UserActivityResult{},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: false, level: 1},
				"SMART_SAVER":    {isUnlocked: false, level: 1},
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "top seller level 1 unlocked",
			metrics: UserActivityResult{
				TotalSold: 1,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: true, level: 1},
				"SMART_SAVER":    {isUnlocked: false, level: 1},
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "top seller level 2 unlocked",
			metrics: UserActivityResult{
				TotalSold: 5,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: true, level: 2},
				"SMART_SAVER":    {isUnlocked: false, level: 1},
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "top seller level 3 unlocked",
			metrics: UserActivityResult{
				TotalSold: 10,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: true, level: 3},
				"SMART_SAVER":    {isUnlocked: false, level: 1},
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "smart saver levels - level 1, 2, 3 threshold checks",
			metrics: UserActivityResult{
				TotalSaved: 35000,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: false, level: 1},
				"SMART_SAVER":    {isUnlocked: true, level: 3},
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "fast responder levels - level 2 (up to 300s) and level 3 (up to 120s)",
			metrics: UserActivityResult{
				TotalSold:        6,
				TotalSaved:       20000,
				ResponseSpeedSec: 90,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"TOP_SELLER":     {isUnlocked: true, level: 2},
				"SMART_SAVER":    {isUnlocked: true, level: 2},
				"FAST_RESPONDER": {isUnlocked: true, level: 3},
			},
		},
		{
			name: "fast responder response speed > 300s remains locked level 1",
			metrics: UserActivityResult{
				ResponseSpeedSec: 400,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"FAST_RESPONDER": {isUnlocked: false, level: 1},
			},
		},
		{
			name: "fast responder level 2 boundary (250s)",
			metrics: UserActivityResult{
				ResponseSpeedSec: 250,
			},
			expectedAchCount: 3,
			expectedAchievements: map[string]struct {
				isUnlocked bool
				level      int
			}{
				"FAST_RESPONDER": {isUnlocked: true, level: 2},
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			achievements := EvaluateAchievements(tt.metrics)

			assert.Len(t, achievements, tt.expectedAchCount)

			// Verify sorting: unlocked items come first
			for i := 0; i < len(achievements)-1; i++ {
				if achievements[i].IsUnlocked == achievements[i+1].IsUnlocked {
					assert.GreaterOrEqual(t, achievements[i].Level, achievements[i+1].Level,
						"achievements with same status should be sorted by level desc")
				} else {
					assert.True(t, achievements[i].IsUnlocked && !achievements[i+1].IsUnlocked,
						"unlocked achievements must precede locked achievements")
				}
			}

			achMap := make(map[string]api.Achievement)
			for _, a := range achievements {
				achMap[a.Code] = a
			}

			for code, expected := range tt.expectedAchievements {
				got, exists := achMap[code]
				assert.True(t, exists, "achievement code %s should exist", code)
				assert.Equal(t, expected.isUnlocked, got.IsUnlocked, "code %s unlocked state mismatch", code)
				assert.Equal(t, expected.level, got.Level, "code %s level mismatch", code)
			}
		})
	}
}

func TestBuildRecapCards(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name              string
		username          string
		metrics           UserActivityResult
		aiTitle           string
		aiStory           string
		archetype         string
		achievements      []api.Achievement
		expectedCardCount int
		hasAchCard        bool
	}{
		{
			name:      "build cards without achievements",
			username:  "Анна",
			metrics:   UserActivityResult{TopCategory: "Одежда", TotalEarned: 1000, TotalSaved: 500},
			aiTitle:   "Шопоголик",
			aiStory:   "Отличный год!",
			archetype: "Стильная",
			achievements: []api.Achievement{},
			expectedCardCount: 4,
			hasAchCard:        false,
		},
		{
			name:      "build cards with achievements",
			username:  "Иван",
			metrics:   UserActivityResult{TopCategory: "Электроника", TotalEarned: 50000, TotalSaved: 20000},
			aiTitle:   "Мастер",
			aiStory:   "Замечательный результат!",
			archetype: "Профи",
			achievements: []api.Achievement{
				{
					Id:          "ach_seller",
					Code:        "TOP_SELLER",
					Name:        "Мастер продаж",
					Level:       2,
					Explanation: "Вы продали 6 товаров",
					CtaText:     "Выложить объявление",
					CtaAction:   "/add-item",
				},
			},
			expectedCardCount: 5,
			hasAchCard:        true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			cards := BuildRecapCards(tt.username, tt.metrics, tt.aiTitle, tt.aiStory, tt.archetype, tt.achievements)

			assert.Len(t, cards, tt.expectedCardCount)
			assert.Equal(t, "welcome", cards[0].CardType)
			assert.Equal(t, "category", cards[1].CardType)
			assert.Equal(t, "finance", cards[2].CardType)

			if tt.hasAchCard {
				assert.Equal(t, "achievement", cards[3].CardType)
				assert.Equal(t, "cta", cards[4].CardType)
				assert.Equal(t, "Мастер продаж", cards[3].HighlightStat)
			} else {
				assert.Equal(t, "cta", cards[3].CardType)
			}
		})
	}
}
