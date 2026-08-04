package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCalculateUserMetrics(t *testing.T) {
	activities := []ActivityRecord{
		{ActivityType: "item_posted", Category: "Электроника", Price: 50000},
		{ActivityType: "item_sold", Category: "Электроника", Price: 50000},
		{ActivityType: "item_bought", Category: "Одежда", Price: 3000, SavedAmount: 1500},
		{ActivityType: "chat_received", Category: "Электроника", ResponseTimeSec: 120},
	}

	metrics := CalculateUserMetrics(activities)

	assert.Equal(t, 4, metrics.TotalActivities)
	assert.Equal(t, 1, metrics.TotalPosted)
	assert.Equal(t, 1, metrics.TotalSold)
	assert.Equal(t, 1, metrics.TotalBought)
	assert.Equal(t, float64(50000), metrics.TotalEarned)
	assert.Equal(t, float64(1500), metrics.TotalSaved)
	assert.Equal(t, "Электроника", metrics.TopCategory)
	assert.Equal(t, 120, metrics.ResponseSpeedSec)
}

func TestEvaluateAchievements(t *testing.T) {
	metrics := UserActivityResult{
		TotalSold:        6,
		TotalSaved:       20000,
		ResponseSpeedSec: 90,
	}

	achievements := EvaluateAchievements(metrics)

	assert.GreaterOrEqual(t, len(achievements), 3)

	for _, ach := range achievements {
		switch ach.Code {
		case "TOP_SELLER":
			assert.True(t, ach.IsUnlocked)
			assert.Equal(t, 2, ach.Level)
		case "SMART_SAVER":
			assert.True(t, ach.IsUnlocked)
			assert.Equal(t, 2, ach.Level)
		case "FAST_RESPONDER":
			assert.True(t, ach.IsUnlocked)
			assert.Equal(t, 3, ach.Level)
		}
	}
}
