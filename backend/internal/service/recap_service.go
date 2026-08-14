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

	"github.com/avitohack/backend/internal/cache"
	"github.com/avitohack/backend/internal/domain"
	"github.com/avitohack/backend/internal/queue"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/avitohack/backend/internal/ws"
	"github.com/avitohack/backend/pkg/api"
)

type RecapService struct {
	queries  sqlc.Querier
	llmGen   *LLMGenerator
	queueSvc *queue.QueueService
	wsHub    *ws.Hub
	cacheSvc *cache.CacheService
}

func NewRecapService(queries sqlc.Querier, llmGen *LLMGenerator, queueSvc *queue.QueueService, wsHub *ws.Hub, cacheSvc *cache.CacheService) *RecapService {
	return &RecapService{
		queries:  queries,
		llmGen:   llmGen,
		queueSvc: queueSvc,
		wsHub:    wsHub,
		cacheSvc: cacheSvc,
	}
}

var _ api.StrictServerInterface = (*RecapService)(nil)

func AnonymizePII(userID int32, fullName, username string) (maskedFullName, maskedUsername string) {
	maskedFullName = fmt.Sprintf("Пользователь #%d", userID)
	maskedUsername = fmt.Sprintf("user_%d", userID)
	return maskedFullName, maskedUsername
}

func (s *RecapService) GetProfiles(ctx context.Context, request api.GetProfilesRequestObject) (api.GetProfilesResponseObject, error) {
	cacheKey := "avitohack:profiles:all"
	if s.cacheSvc != nil {
		var cachedProfiles []api.UserProfile
		if s.cacheSvc.Get(ctx, cacheKey, &cachedProfiles) {
			return api.GetProfiles200JSONResponse(cachedProfiles), nil
		}
	}

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

	if s.cacheSvc != nil {
		s.cacheSvc.Set(ctx, cacheKey, profiles, 15*time.Minute)
	}

	return api.GetProfiles200JSONResponse(profiles), nil
}

func (s *RecapService) GetRecap(ctx context.Context, request api.GetRecapRequestObject) (api.GetRecapResponseObject, error) {
	cacheKey := fmt.Sprintf("avitohack:recap:profile:%d", request.ProfileId)
	if s.cacheSvc != nil {
		var cachedResp api.GetRecap200JSONResponse
		if s.cacheSvc.Get(ctx, cacheKey, &cachedResp) {
			return cachedResp, nil
		}
	}

	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}
	user, err := s.queries.GetUserByID(ctx, int32(request.ProfileId))
	if err != nil {
		return api.GetRecap404Response{}, nil
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
	shareToken := generateShareToken(user.ID)

	var cards []api.RecapCard
	var achievements []api.Achievement
	var aiResult *domain.AISummaryResult

	cache, err := s.queries.GetRecapCacheByProfileID(ctx, user.ID)
	if err == nil && len(cache.CardsJson) > 0 {
		_ = json.Unmarshal(cache.CardsJson, &cards)
		_ = json.Unmarshal(cache.AchievementsJson, &achievements)
		aiResult = &domain.AISummaryResult{
			Title:         cache.AiTitle,
			Story:         cache.AiStory,
			Archetype:     cache.Archetype,
			GeneratedByAI: cache.GeneratedByAi,
		}
	}

	// Fallback if cache empty
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
	}

	resp := api.GetRecap200JSONResponse{
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
	}

	if s.cacheSvc != nil {
		s.cacheSvc.Set(ctx, cacheKey, resp, 30*time.Minute)
	}

	return resp, nil
}

func (s *RecapService) GetAchievements(ctx context.Context, request api.GetAchievementsRequestObject) (api.GetAchievementsResponseObject, error) {
	cacheKey := fmt.Sprintf("avitohack:achievements:profile:%d", request.ProfileId)
	if s.cacheSvc != nil {
		var cachedAchs []api.Achievement
		if s.cacheSvc.Get(ctx, cacheKey, &cachedAchs) {
			return api.GetAchievements200JSONResponse(cachedAchs), nil
		}
	}

	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	cache, err := s.queries.GetRecapCacheByProfileID(ctx, int32(request.ProfileId))
	if err == nil && len(cache.AchievementsJson) > 0 {
		var achievements []api.Achievement
		if err := json.Unmarshal(cache.AchievementsJson, &achievements); err == nil && len(achievements) > 0 {
			if s.cacheSvc != nil {
				s.cacheSvc.Set(ctx, cacheKey, achievements, 30*time.Minute)
			}
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

	if s.cacheSvc != nil {
		s.cacheSvc.Set(ctx, cacheKey, achievements, 30*time.Minute)
	}

	return api.GetAchievements200JSONResponse(achievements), nil
}

func (s *RecapService) GetShareCard(ctx context.Context, request api.GetShareCardRequestObject) (api.GetShareCardResponseObject, error) {
	cacheKey := fmt.Sprintf("avitohack:share:%s", request.ShareToken)
	if s.cacheSvc != nil {
		var cachedResp api.GetShareCard200JSONResponse
		if s.cacheSvc.Get(ctx, cacheKey, &cachedResp) {
			return cachedResp, nil
		}
	}

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

	resp := api.GetShareCard200JSONResponse{
		FullName:        user.FullName,
		AvatarUrl:       user.AvatarUrl,
		Archetype:       cache.Archetype,
		AiTitle:         cache.AiTitle,
		TopCategory:     metrics.TopCategory,
		TopAchievements: topAchs,
	}

	if s.cacheSvc != nil {
		s.cacheSvc.Set(ctx, cacheKey, resp, 1*time.Hour)
	}

	return resp, nil
}

// Admin Endpoints Implementation

func (s *RecapService) GetAdminUsers(ctx context.Context, request api.GetAdminUsersRequestObject) (api.GetAdminUsersResponseObject, error) {
	cacheKey := "avitohack:admin:users"
	if s.cacheSvc != nil {
		var cachedItems []api.AdminUserItem
		if s.cacheSvc.Get(ctx, cacheKey, &cachedItems) {
			return api.GetAdminUsers200JSONResponse(cachedItems), nil
		}
	}

	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	users, err := s.queries.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	items := make([]api.AdminUserItem, 0, len(users))
	for _, u := range users {
		cache, err := s.queries.GetRecapCacheByProfileID(ctx, u.ID)
		hasRecap := (err == nil && len(cache.CardsJson) > 0)
		generatedByAi := false
		var updatedAtStr *string

		if hasRecap {
			generatedByAi = cache.GeneratedByAi
			str := cache.UpdatedAt.Format(time.RFC3339)
			updatedAtStr = &str
		}

		items = append(items, api.AdminUserItem{
			Profile: api.UserProfile{
				Id:           int(u.ID),
				Username:     u.Username,
				FullName:     u.FullName,
				AvatarUrl:    u.AvatarUrl,
				UserType:     u.UserType,
				RegisteredAt: u.RegisteredAt,
			},
			HasRecap:       hasRecap,
			GeneratedByAi:  generatedByAi,
			RecapUpdatedAt: updatedAtStr,
		})
	}

	if s.cacheSvc != nil {
		s.cacheSvc.Set(ctx, cacheKey, items, 5*time.Minute)
	}

	return api.GetAdminUsers200JSONResponse(items), nil
}

func (s *RecapService) TriggerGenerate(ctx context.Context, request api.TriggerGenerateRequestObject) (api.TriggerGenerateResponseObject, error) {
	if s.queueSvc == nil {
		return nil, fmt.Errorf("rabbitmq service unavailable")
	}
	if request.Body == nil || len(request.Body.UserIds) == 0 {
		return nil, fmt.Errorf("user_ids array cannot be empty")
	}

	force := false
	if request.Body.ForceRegenerate != nil {
		force = *request.Body.ForceRegenerate
	}

	if s.cacheSvc != nil {
		s.cacheSvc.Delete(ctx, "avitohack:admin:users")
		for _, uID := range request.Body.UserIds {
			s.cacheSvc.Delete(ctx,
				fmt.Sprintf("avitohack:recap:profile:%d", uID),
				fmt.Sprintf("avitohack:achievements:profile:%d", uID),
			)
		}
	}

	queuedCount := 0
	for _, uID := range request.Body.UserIds {
		err := s.queueSvc.EnqueueTask(uID, force)
		if err != nil {
			slog.Error("Failed to enqueue task", slog.Int("user_id", uID), slog.Any("error", err))
		} else {
			queuedCount++
			if s.wsHub != nil {
				s.wsHub.BroadcastEvent(uID, "QUEUED", "Задачу отправлено в очередь RabbitMQ")
			}
		}
	}

	return api.TriggerGenerate202JSONResponse{
		QueuedCount: queuedCount,
		Status:      "queued",
	}, nil
}

func (s *RecapService) GetPIIPreview(ctx context.Context, request api.GetPIIPreviewRequestObject) (api.GetPIIPreviewResponseObject, error) {
	if s.queries == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	user, err := s.queries.GetUserByID(ctx, int32(request.ProfileId))
	if err != nil {
		return nil, fmt.Errorf("user not found")
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

	maskedFullName, maskedUsername := AnonymizePII(user.ID, user.FullName, user.Username)

	promptPayload := fmt.Sprintf(
		"=== ANONYMIZED LLM PROMPT PAYLOAD ===\n"+
			"User ID: %d\n"+
			"Masked Full Name: %s (Original: [REDACTED_PII])\n"+
			"Profile Category/Type: %s\n"+
			"Total Activities: %d\n"+
			"Items Posted: %d, Sold: %d, Bought: %d\n"+
			"Total Earned: %.2f RUB, Total Saved: %.2f RUB\n"+
			"Top Active Category: %s\n"+
			"Avg Response Speed: %d seconds\n"+
			"=====================================",
		user.ID, maskedFullName, user.UserType,
		metrics.TotalActivities, metrics.TotalPosted, metrics.TotalSold, metrics.TotalBought,
		metrics.TotalEarned, metrics.TotalSaved, metrics.TopCategory, metrics.ResponseSpeedSec,
	)

	return api.GetPIIPreview200JSONResponse{
		UserId:                  int(user.ID),
		OriginalFullName:        user.FullName,
		OriginalUsername:        user.Username,
		MaskedFullName:          maskedFullName,
		MaskedUsername:          maskedUsername,
		AnonymizedPromptPayload: promptPayload,
	}, nil
}

func (s *RecapService) GenerateAndStoreRecapForUser(ctx context.Context, userID int, force bool) error {
	if s.queries == nil {
		return fmt.Errorf("database connection unavailable")
	}

	user, err := s.queries.GetUserByID(ctx, int32(userID))
	if err != nil {
		if s.wsHub != nil {
			s.wsHub.BroadcastEvent(userID, "FAILED", "Пользователь не найден")
		}
		return fmt.Errorf("user %d not found: %w", userID, err)
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(userID, "PROCESSING", "Запущена генерация в ИИ (ProxyAPI)...")
	}

	activities, err := s.queries.GetUserActivities(ctx, int32(userID))
	if err != nil {
		if s.wsHub != nil {
			s.wsHub.BroadcastEvent(userID, "FAILED", "Ошибка чтения активностей из БД")
		}
		return fmt.Errorf("failed to get user activities: %w", err)
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
	maskedFullName, _ := AnonymizePII(user.ID, user.FullName, user.Username)

	var cards []api.RecapCard
	var achievements []api.Achievement
	var aiResult *domain.AISummaryResult

	if s.llmGen != nil && s.llmGen.IsAvailable() {
		slog.Info("Generating recap using ProxyAPI LLM", slog.Int("user_id", userID), slog.String("masked_name", maskedFullName))
		llmRes, llmErr := s.llmGen.GenerateRecap(ctx, maskedFullName, user.UserType, metrics)
		if llmErr == nil && llmRes != nil {
			cards = llmRes.Cards
			achievements = llmRes.Achievements
			aiResult = &llmRes.AISummary
		} else {
			slog.Warn("ProxyAPI generation error, using template fallback", slog.Int("user_id", userID), slog.Any("error", llmErr))
		}
	}

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
	}

	cardsJson, _ := json.Marshal(cards)
	achievementsJson, _ := json.Marshal(achievements)
	shareToken := generateShareToken(user.ID)

	_, err = s.queries.UpsertRecapCache(ctx, sqlc.UpsertRecapCacheParams{
		ProfileID:        user.ID,
		ShareToken:       shareToken,
		AiTitle:          aiResult.Title,
		AiStory:          aiResult.Story,
		Archetype:        aiResult.Archetype,
		GeneratedByAi:    aiResult.GeneratedByAI,
		CardsJson:        cardsJson,
		AchievementsJson: achievementsJson,
	})

	if err != nil {
		if s.wsHub != nil {
			s.wsHub.BroadcastEvent(userID, "FAILED", "Ошибка сохранения результатов в БД")
		}
		return fmt.Errorf("failed to save recap to DB: %w", err)
	}

	if s.cacheSvc != nil {
		s.cacheSvc.Delete(ctx,
			fmt.Sprintf("avitohack:recap:profile:%d", userID),
			fmt.Sprintf("avitohack:achievements:profile:%d", userID),
			fmt.Sprintf("avitohack:share:%s", shareToken),
			"avitohack:admin:users",
			"avitohack:profiles:all",
		)
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(userID, "COMPLETED", "Карточка и достижения успешно сохранены 🟢")
	}

	return nil
}

func (s *RecapService) FlushCache(ctx context.Context, request api.FlushCacheRequestObject) (api.FlushCacheResponseObject, error) {
	if s.cacheSvc == nil || !s.cacheSvc.IsAvailable() {
		msg := "Redis cache unavailable"
		status := "warning"
		return api.FlushCache200JSONResponse{
			Status:  &status,
			Message: &msg,
		}, nil
	}

	if err := s.cacheSvc.FlushAll(ctx); err != nil {
		return nil, fmt.Errorf("failed to flush cache: %w", err)
	}

	msg := "All Redis keys flushed successfully"
	status := "ok"
	return api.FlushCache200JSONResponse{
		Status:  &status,
		Message: &msg,
	}, nil
}

func generateShareToken(userID int32) string {
	h := sha256.New()
	_, _ = fmt.Fprintf(h, "avito_share_%d_salt_2024", userID)
	return hex.EncodeToString(h.Sum(nil))[:16]
}
