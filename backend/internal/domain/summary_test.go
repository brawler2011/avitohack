package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateSummary(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name             string
		userType         string
		totalSold        int
		totalBought      int
		totalEarned      float64
		totalSaved       float64
		topCategory      string
		responseSpeedSec int
		expectedTitle    string
		expectedArchetype string
		containsInStory  []string
	}{
		{
			name:             "seller user type",
			userType:         "seller",
			totalSold:        12,
			totalBought:      2,
			totalEarned:      150000,
			totalSaved:       3000,
			topCategory:      "Электроника",
			responseSpeedSec: 90,
			expectedTitle:    "Главный Торговец Города",
			expectedArchetype: "Профи-Селлер",
			containsInStory:  []string{"12 товаров", "Электроника", "150000 ₽"},
		},
		{
			name:             "buyer user type",
			userType:         "buyer",
			totalSold:        0,
			totalBought:      25,
			totalEarned:      0,
			totalSaved:       42000,
			topCategory:      "Одежда",
			responseSpeedSec: 300,
			expectedTitle:    "Король Выгодного Шопинга",
			expectedArchetype: "Экономный Охотник",
			containsInStory:  []string{"25 умных покупок", "42000 ₽"},
		},
		{
			name:             "auto_enthusiast user type",
			userType:         "auto_enthusiast",
			totalSold:        3,
			totalBought:      8,
			totalEarned:      20000,
			totalSaved:       10000,
			topCategory:      "Запчасти и аксессуары",
			responseSpeedSec: 180,
			expectedTitle:    "Повелитель Автомобильных Дорог",
			expectedArchetype: "Авто-Эксперт",
			containsInStory:  []string{"Запчасти и аксессуары"},
		},
		{
			name:             "home_renovator user type",
			userType:         "home_renovator",
			totalSold:        1,
			totalBought:      15,
			totalEarned:      5000,
			totalSaved:       25000,
			topCategory:      "Мебель и интерьер",
			responseSpeedSec: 120,
			expectedTitle:    "Создатель Домашнего Уюта",
			expectedArchetype: "Мастер Интерьера",
			containsInStory:  []string{"Мебель и интерьер"},
		},
		{
			name:             "default/unknown user type",
			userType:         "unknown_type",
			totalSold:        0,
			totalBought:      0,
			totalEarned:      0,
			totalSaved:       0,
			topCategory:      "Разное",
			responseSpeedSec: 0,
			expectedTitle:    "Перспективный Исследователь Авито",
			expectedArchetype: "Первопроходец",
			containsInStory:  []string{"первые уверенные шаги"},
		},
		{
			name:             "empty string user type fallback",
			userType:         "",
			totalSold:        0,
			totalBought:      0,
			totalEarned:      0,
			totalSaved:       0,
			topCategory:      "Разное",
			responseSpeedSec: 0,
			expectedTitle:    "Перспективный Исследователь Авито",
			expectedArchetype: "Первопроходец",
			containsInStory:  []string{"первые уверенные шаги"},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := GenerateSummary(
				tt.userType,
				tt.totalSold,
				tt.totalBought,
				tt.totalEarned,
				tt.totalSaved,
				tt.topCategory,
				tt.responseSpeedSec,
			)

			require.NotNil(t, got)
			assert.Equal(t, tt.expectedTitle, got.Title)
			assert.Equal(t, tt.expectedArchetype, got.Archetype)
			assert.False(t, got.GeneratedByAI)

			for _, sub := range tt.containsInStory {
				assert.Contains(t, got.Story, sub)
			}
		})
	}
}
