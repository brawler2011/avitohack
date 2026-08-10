package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"github.com/avitohack/backend/internal/domain"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/avitohack/backend/pkg/api"
)

type RecapService struct {
	queries sqlc.Querier
	llmGen  *LLMGenerator
}

func NewRecapService(queries sqlc.Querier, llmGen *LLMGenerator) *RecapService {
	return &RecapService{
		queries: queries,
		llmGen:  llmGen,
	}
}

func (s *RecapService) PrewarmRecapCache(ctx context.Context) {
	if s.queries == nil || s.llmGen == nil || !s.llmGen.IsAvailable() {
		return
	}

	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		slog.Warn("Failed to list users for cache prewarming", slog.Any("error", err))
		return
	}

	slog.Info("Starting async LLM recap cache prewarming...", slog.Int("user_count", len(users)))

	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		defer cancel()

		for _, u := range users {
			cache, err := s.queries.GetRecapCacheByProfileID(bgCtx, u.ID)
			if err == nil && len(cache.CardsJson) > 0 && len(cache.AchievementsJson) > 0 {
				continue
			}

			reqObj := api.GetRecapRequestObject{ProfileId: int(u.ID)}
			_, err = s.GetRecap(bgCtx, reqObj)
			if err != nil {
				slog.Warn("Failed to prewarm recap for user", slog.Int("user_id", int(u.ID)), slog.Any("error", err))
			} else {
				slog.Info("Successfully prewarmed recap for user", slog.Int("user_id", int(u.ID)), slog.String("username", u.Username))
			}
		}
		slog.Info("Completed recap cache prewarming!")
	}()
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
			Title:           act.Title,
			Price:           price,
			SavedAmount:     saved,
			ResponseTimeSec: int(act.ResponseTimeSec),
			Timestamp:       act.Timestamp,
		})
	}

	metrics := CalculateUserMetrics(actRecords)
	shareToken := generateShareToken(user.ID)

	var cards []api.RecapCard
	var achievements []api.Achievement
	var aiResult *domain.AISummaryResult

	// Check cache
	cache, err := s.queries.GetRecapCacheByProfileID(ctx, user.ID)
	if err == nil && len(cache.CardsJson) > 0 && len(cache.AchievementsJson) > 0 {
		aiResult = &domain.AISummaryResult{
			Title:         cache.AiTitle,
			Story:         cache.AiStory,
			Archetype:     cache.Archetype,
			GeneratedByAI: cache.GeneratedByAi,
		}
		_ = json.Unmarshal(cache.CardsJson, &cards)
		_ = json.Unmarshal(cache.AchievementsJson, &achievements)
	}

	// If cache empty, try LLM generator
	if len(cards) == 0 && s.llmGen != nil && s.llmGen.IsAvailable() {
		slog.Info("Generating recap using OpenRouter LLM", slog.Int("user_id", int(user.ID)))
		llmRes, llmErr := s.llmGen.GenerateRecap(ctx, user.FullName, user.UserType, metrics)
		if llmErr == nil && llmRes != nil {
			cards = llmRes.Cards
			achievements = llmRes.Achievements
			aiResult = &llmRes.AISummary

			cardsJson, _ := json.Marshal(cards)
			achievementsJson, _ := json.Marshal(achievements)

			_, _ = s.queries.UpsertRecapCache(ctx, sqlc.UpsertRecapCacheParams{
				ProfileID:        user.ID,
				ShareToken:       shareToken,
				AiTitle:          aiResult.Title,
				AiStory:          aiResult.Story,
				Archetype:        aiResult.Archetype,
				GeneratedByAi:    true,
				CardsJson:        cardsJson,
				AchievementsJson: achievementsJson,
			})
		} else {
			slog.Warn("OpenRouter generation failed, falling back to static templates", slog.Any("error", llmErr))
		}
	}

	// Fallback if still empty
	if len(cards) == 0 {
		achievements = EvaluateAchievements(metrics)
		if aiResult == nil {
			aiResult = domain.GenerateSummary(
				user.UserType,
				metrics.TotalSold,
				metrics.TotalBought,
				metrics.TotalEarned,
				metrics.TotalSaved,
				metrics.TopCategory,
				metrics.ResponseSpeedSec,
			)
		}
		if aiResult == nil {
			aiResult = &domain.AISummaryResult{
				Title:         "Перспективный Исследователь",
				Story:         "Вы сделали первые уверенные шаги на платформе.",
				Archetype:     "Первопроходец",
				GeneratedByAI: false,
			}
		}
		cards = BuildRecapCards(user.FullName, metrics, aiResult.Title, aiResult.Story, aiResult.Archetype, achievements)

		cardsJson, _ := json.Marshal(cards)
		achievementsJson, _ := json.Marshal(achievements)

		_, _ = s.queries.UpsertRecapCache(ctx, sqlc.UpsertRecapCacheParams{
			ProfileID:        user.ID,
			ShareToken:       shareToken,
			AiTitle:          aiResult.Title,
			AiStory:          aiResult.Story,
			Archetype:        aiResult.Archetype,
			GeneratedByAi:    aiResult.GeneratedByAI,
			CardsJson:        cardsJson,
			AchievementsJson: achievementsJson,
		})
	}

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

	// Check cache first
	cache, err := s.queries.GetRecapCacheByProfileID(ctx, int32(request.ProfileId))
	if err == nil && len(cache.AchievementsJson) > 0 {
		var achievements []api.Achievement
		if err := json.Unmarshal(cache.AchievementsJson, &achievements); err == nil && len(achievements) > 0 {
			return api.GetAchievements200JSONResponse(achievements), nil
		}
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
			Title:           act.Title,
			Price:           price,
			SavedAmount:     saved,
			ResponseTimeSec: int(act.ResponseTimeSec),
			Timestamp:       act.Timestamp,
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

	topAchs := []string{}
	if len(cache.AchievementsJson) > 0 {
		var achievements []api.Achievement
		if err := json.Unmarshal(cache.AchievementsJson, &achievements); err == nil {
			for _, ach := range achievements {
				if ach.IsUnlocked {
					topAchs = append(topAchs, ach.Name)
				}
			}
		}
	}

	activities, _ := s.queries.GetUserActivities(ctx, cache.ProfileID)
	actRecords := make([]ActivityRecord, 0, len(activities))
	for _, act := range activities {
		actRecords = append(actRecords, ActivityRecord{
			ActivityType: act.ActivityType,
			Category:     act.Category,
			Title:        act.Title,
		})
	}
	metrics := CalculateUserMetrics(actRecords)

	if len(topAchs) == 0 {
		achievements := EvaluateAchievements(metrics)
		for _, ach := range achievements {
			if ach.IsUnlocked {
				topAchs = append(topAchs, ach.Name)
			}
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
