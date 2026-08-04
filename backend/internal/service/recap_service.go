package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"

	"github.com/avitohack/backend/internal/domain"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/avitohack/backend/pkg/api"
)

type RecapService struct {
	queries sqlc.Querier
}

func NewRecapService(queries sqlc.Querier) *RecapService {
	return &RecapService{
		queries: queries,
	}
}

var _ api.StrictServerInterface = (*RecapService)(nil)

func (s *RecapService) GetProfiles(ctx context.Context, request api.GetProfilesRequestObject) (api.GetProfilesResponseObject, error) {
	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}
	dbUsers, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	profiles := make([]api.UserProfile, 0, len(dbUsers))
	for _, u := range dbUsers {
		profiles = append(profiles, api.UserProfile{
			Id:           int(u.ID),
			Username:     u.Username,
			FullName:     u.FullName,
			AvatarUrl:    u.AvatarUrl,
			UserType:     u.UserType,
			RegisteredAt: u.RegisteredAt,
		})
	}

	return api.GetProfiles200JSONResponse(profiles), nil
}

func (s *RecapService) GetRecap(ctx context.Context, request api.GetRecapRequestObject) (api.GetRecapResponseObject, error) {
	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}
	user, err := s.queries.GetUserByID(ctx, int32(request.ProfileId))
	if err != nil {
		return api.GetRecap404Response{}, nil
	}

	activities, err := s.queries.GetUserActivities(ctx, int32(request.ProfileId))
	if err != nil {
		return nil, fmt.Errorf("failed to get user activities: %w", err)
	}

	actRecords := make([]ActivityRecord, 0, len(activities))
	for _, act := range activities {
		var price float64
		if act.Price.Valid {
			f, _ := act.Price.Value()
			if strVal, ok := f.(string); ok {
				price, _ = strconv.ParseFloat(strVal, 64)
			}
		}
		var saved float64
		if act.SavedAmount.Valid {
			f, _ := act.SavedAmount.Value()
			if strVal, ok := f.(string); ok {
				saved, _ = strconv.ParseFloat(strVal, 64)
			}
		}
		actRecords = append(actRecords, ActivityRecord{
			ActivityType:    act.ActivityType,
			Category:        act.Category,
			Price:           price,
			SavedAmount:     saved,
			ResponseTimeSec: int(act.ResponseTimeSec),
		})
	}

	metrics := CalculateUserMetrics(actRecords)
	achievements := EvaluateAchievements(metrics)

	// Check recap cache for AI summary and share token
	shareToken := generateShareToken(user.ID)
	cache, err := s.queries.GetRecapCacheByProfileID(ctx, user.ID)

	var aiResult *domain.AISummaryResult
	if err == nil {
		aiResult = &domain.AISummaryResult{
			Title:         cache.AiTitle,
			Story:         cache.AiStory,
			Archetype:     cache.Archetype,
			GeneratedByAI: cache.GeneratedByAi,
		}
	} else {
		// Generate summary templates
		aiResult = domain.GenerateSummary(
			user.UserType,
			metrics.TotalSold,
			metrics.TotalBought,
			metrics.TotalEarned,
			metrics.TotalSaved,
			metrics.TopCategory,
			metrics.ResponseSpeedSec,
		)

		if aiResult == nil {
			aiResult = &domain.AISummaryResult{
				Title:         "Перспективный Исследователь",
				Story:         "Вы сделали первые уверенные шаги на платформе.",
				Archetype:     "Первопроходец",
				GeneratedByAI: false,
			}
		}

		// Save to cache
		_, _ = s.queries.UpsertRecapCache(ctx, sqlc.UpsertRecapCacheParams{
			ProfileID:     user.ID,
			ShareToken:    shareToken,
			AiTitle:       aiResult.Title,
			AiStory:       aiResult.Story,
			Archetype:     aiResult.Archetype,
			GeneratedByAi: aiResult.GeneratedByAI,
		})
	}

	cards := BuildRecapCards(user.FullName, metrics, aiResult.Title, aiResult.Story, aiResult.Archetype, achievements)

	return api.GetRecap200JSONResponse{
		Profile: api.UserProfile{
			Id:           int(user.ID),
			Username:     user.Username,
			FullName:     user.FullName,
			AvatarUrl:    user.AvatarUrl,
			UserType:     user.UserType,
			RegisteredAt: user.RegisteredAt,
		},
		Metrics: api.UserMetrics{
			TotalActivities:  metrics.TotalActivities,
			TotalPosted:      metrics.TotalPosted,
			TotalSold:        metrics.TotalSold,
			TotalBought:      metrics.TotalBought,
			TotalEarned:      float32(metrics.TotalEarned),
			TotalSaved:       float32(metrics.TotalSaved),
			TopCategory:      metrics.TopCategory,
			ResponseSpeedSec: metrics.ResponseSpeedSec,
		},
		Cards:        cards,
		Achievements: achievements,
		ShareToken:   shareToken,
	}, nil
}

func (s *RecapService) GetAchievements(ctx context.Context, request api.GetAchievementsRequestObject) (api.GetAchievementsResponseObject, error) {
	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}
	activities, err := s.queries.GetUserActivities(ctx, int32(request.ProfileId))
	if err != nil {
		return nil, fmt.Errorf("failed to get activities: %w", err)
	}

	actRecords := make([]ActivityRecord, 0, len(activities))
	for _, act := range activities {
		var price float64
		if act.Price.Valid {
			f, _ := act.Price.Value()
			if strVal, ok := f.(string); ok {
				price, _ = strconv.ParseFloat(strVal, 64)
			}
		}
		var saved float64
		if act.SavedAmount.Valid {
			f, _ := act.SavedAmount.Value()
			if strVal, ok := f.(string); ok {
				saved, _ = strconv.ParseFloat(strVal, 64)
			}
		}
		actRecords = append(actRecords, ActivityRecord{
			ActivityType:    act.ActivityType,
			Category:        act.Category,
			Price:           price,
			SavedAmount:     saved,
			ResponseTimeSec: int(act.ResponseTimeSec),
		})
	}

	metrics := CalculateUserMetrics(actRecords)
	achievements := EvaluateAchievements(metrics)

	return api.GetAchievements200JSONResponse(achievements), nil
}

func (s *RecapService) GetShareCard(ctx context.Context, request api.GetShareCardRequestObject) (api.GetShareCardResponseObject, error) {
	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}
	cache, err := s.queries.GetRecapCacheByShareToken(ctx, request.ShareToken)
	if err != nil {
		return nil, fmt.Errorf("share card not found")
	}

	user, err := s.queries.GetUserByID(ctx, cache.ProfileID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	activities, _ := s.queries.GetUserActivities(ctx, cache.ProfileID)
	actRecords := make([]ActivityRecord, 0, len(activities))
	for _, act := range activities {
		actRecords = append(actRecords, ActivityRecord{
			ActivityType: act.ActivityType,
			Category:     act.Category,
		})
	}
	metrics := CalculateUserMetrics(actRecords)
	achievements := EvaluateAchievements(metrics)

	topAchs := []string{}
	for _, ach := range achievements {
		if ach.IsUnlocked {
			topAchs = append(topAchs, ach.Name)
		}
	}

	return api.GetShareCard200JSONResponse{
		FullName:        user.FullName,
		AvatarUrl:       user.AvatarUrl,
		Archetype:       cache.Archetype,
		AiTitle:         cache.AiTitle,
		TopCategory:     metrics.TopCategory,
		TopAchievements: topAchs,
	}, nil
}

func generateShareToken(userID int32) string {
	h := sha256.New()
	h.Write([]byte(fmt.Sprintf("avito_share_%d_salt_2024", userID)))
	return hex.EncodeToString(h.Sum(nil))[:16]
}
