package service

import (
	"fmt"
	"sort"
	"time"

	"github.com/avitohack/backend/pkg/api"
)

type UserActivityResult struct {
	TotalActivities  int
	TotalPosted      int
	TotalSold        int
	TotalBought      int
	TotalEarned      float64
	TotalSaved       float64
	TopCategory      string
	ResponseSpeedSec int
	CategoriesMap    map[string]int
	Searches         []string
	FavoritesCount   int
	DeliveriesCount  int
	ReviewsCount     int
	NightActivityCnt int
}

func CalculateUserMetrics(activities []ActivityRecord) UserActivityResult {
	res := UserActivityResult{
		TotalActivities: len(activities),
		CategoriesMap:   make(map[string]int),
		Searches:        make([]string, 0),
	}

	var minResponseSpeed int = 999999
	for _, act := range activities {
		if act.Category != "" {
			res.CategoriesMap[act.Category]++
		}

		if !act.Timestamp.IsZero() && (act.Timestamp.Hour() >= 22 || act.Timestamp.Hour() < 6) {
			res.NightActivityCnt++
		}

		switch act.ActivityType {
		case "item_posted":
			res.TotalPosted++
		case "item_sold":
			res.TotalSold++
			res.TotalEarned += act.Price
		case "item_bought":
			res.TotalBought++
			res.TotalSaved += act.SavedAmount
		case "search":
			if act.Title != "" {
				res.Searches = append(res.Searches, act.Title)
			}
		case "save_favorite":
			res.FavoritesCount++
		case "delivery_sent", "delivery_received":
			res.DeliveriesCount++
		case "review_left":
			res.ReviewsCount++
		case "chat_received", "chat_sent":
			if act.ResponseTimeSec > 0 && act.ResponseTimeSec < minResponseSpeed {
				minResponseSpeed = act.ResponseTimeSec
			}
		}
	}

	if minResponseSpeed != 999999 {
		res.ResponseSpeedSec = minResponseSpeed
	}

	// Find top category
	maxCount := 0
	topCat := "Разное"
	for cat, count := range res.CategoriesMap {
		if count > maxCount {
			maxCount = count
			topCat = cat
		}
	}
	res.TopCategory = topCat

	return res
}

type ActivityRecord struct {
	ActivityType    string
	Category        string
	Title           string
	Price           float64
	SavedAmount     float64
	ResponseTimeSec int
	Timestamp       time.Time
}


func EvaluateAchievements(metrics UserActivityResult) []api.Achievement {
	achievements := []api.Achievement{}

	// 1. TOP_SELLER Achievement
	sellerMax := 10
	sellerLevel := 1
	if metrics.TotalSold >= 5 {
		sellerLevel = 2
	}
	if metrics.TotalSold >= 10 {
		sellerLevel = 3
	}
	achievements = append(achievements, api.Achievement{
		Id:              "ach_seller",
		Code:            "TOP_SELLER",
		Name:            "Мастер продаж",
		Description:     "Продавайте товары на Авито и поднимайте свой уровень продавца",
		BadgeIcon:       "tag",
		Level:           sellerLevel,
		CurrentProgress: metrics.TotalSold,
		MaxProgress:     sellerMax,
		IsUnlocked:      metrics.TotalSold > 0,
		CtaText:         "Выложить объявление",
		CtaAction:       "/add-item",
		Explanation:     fmt.Sprintf("Вы продали %d товаров на площадке за этот год", metrics.TotalSold),
	})

	// 2. SMART_SAVER Achievement
	saverMax := 50000
	saverLevel := 1
	if int(metrics.TotalSaved) >= 15000 {
		saverLevel = 2
	}
	if int(metrics.TotalSaved) >= 30000 {
		saverLevel = 3
	}
	achievements = append(achievements, api.Achievement{
		Id:              "ach_saver",
		Code:            "SMART_SAVER",
		Name:            "Охотник за скидками",
		Description:     "Сэкономьте на покупках у проверенных продавцов",
		BadgeIcon:       "piggy-bank",
		Level:           saverLevel,
		CurrentProgress: int(metrics.TotalSaved),
		MaxProgress:     saverMax,
		IsUnlocked:      metrics.TotalSaved > 0,
		CtaText:         "Посмотреть снижение цен",
		CtaAction:       "/favorites",
		Explanation:     fmt.Sprintf("Вы сэкономили %.0f ₽ на выгодных сделках", metrics.TotalSaved),
	})

	// 3. FAST_RESPONDER Achievement
	fastLevel := 1
	if metrics.ResponseSpeedSec > 0 && metrics.ResponseSpeedSec <= 120 {
		fastLevel = 3
	} else if metrics.ResponseSpeedSec > 0 && metrics.ResponseSpeedSec <= 300 {
		fastLevel = 2
	}
	achievements = append(achievements, api.Achievement{
		Id:              "ach_fast",
		Code:            "FAST_RESPONDER",
		Name:            "Быстрый ответчик",
		Description:     "Отвечайте в чатах быстрее большинства пользователей",
		BadgeIcon:       "zap",
		Level:           fastLevel,
		CurrentProgress: metrics.ResponseSpeedSec,
		MaxProgress:     300,
		IsUnlocked:      metrics.ResponseSpeedSec > 0 && metrics.ResponseSpeedSec <= 300,
		CtaText:         "Получить продвижение",
		CtaAction:       "/promote",
		Explanation:     fmt.Sprintf("Ваш рекорд скорости ответа в чате: %d сек", metrics.ResponseSpeedSec),
	})

	// Sort achievements: unlocked first
	sort.Slice(achievements, func(i, j int) bool {
		if achievements[i].IsUnlocked == achievements[j].IsUnlocked {
			return achievements[i].Level > achievements[j].Level
		}
		return achievements[i].IsUnlocked
	})

	return achievements
}

func BuildRecapCards(username string, metrics UserActivityResult, aiTitle, aiStory, archetype string, achievements []api.Achievement) []api.RecapCard {
	cards := []api.RecapCard{
		{
			Id:            "card_1_welcome",
			CardType:      "welcome",
			Title:         fmt.Sprintf("Привет, %s!", username),
			Subtitle:      "Твой 2024 год на Авито",
			HighlightStat: archetype,
			Description:   aiStory,
			BgGradient:    "from-emerald-600 via-teal-600 to-cyan-700",
			IconName:      "sparkles",
			Explanation:   "Карточка сформирована на основе общего анализа вашей активности за год",
			CtaText:       strPtr("Смотреть дальше"),
			CtaAction:     strPtr("next"),
		},
		{
			Id:            "card_2_category",
			CardType:      "category",
			Title:         "Главное увлечение",
			Subtitle:      "Категория №1 в вашем профиле",
			HighlightStat: metrics.TopCategory,
			Description:   fmt.Sprintf("Вы проявили наибольший интерес к категории %s. Здесь вы провели больше всего времени!", metrics.TopCategory),
			BgGradient:    "from-blue-600 via-indigo-600 to-purple-700",
			IconName:      "compass",
			Explanation:   fmt.Sprintf("Рассчитано по количеству просмотров и сделок в категории %s", metrics.TopCategory),
			CtaText:       strPtr("Найти новые объявления"),
			CtaAction:     strPtr("/search?category=" + metrics.TopCategory),
		},
		{
			Id:            "card_3_finance",
			CardType:      "finance",
			Title:         "Финансовые итоги",
			Subtitle:      "Результат ваших разумных решений",
			HighlightStat: fmt.Sprintf("%.0f ₽", metrics.TotalEarned+metrics.TotalSaved),
			Description:   fmt.Sprintf("Заработали на продажах: %.0f ₽\nСэкономили на покупках: %.0f ₽", metrics.TotalEarned, metrics.TotalSaved),
			BgGradient:    "from-purple-600 via-pink-600 to-rose-600",
			IconName:      "coins",
			Explanation:   "Рассчитано как сумма фактических доходов от выложенных объявлений и разницы розничной цены со скидкой",
			CtaText:       strPtr("Выложить новый предмет"),
			CtaAction:     strPtr("/add-item"),
		},
	}

	if len(achievements) > 0 {
		topAch := achievements[0]
		cards = append(cards, api.RecapCard{
			Id:            "card_4_achievement",
			CardType:      "achievement",
			Title:         "Главная Ачивка Года",
			Subtitle:      fmt.Sprintf("Уровень %d unlocked!", topAch.Level),
			HighlightStat: topAch.Name,
			Description:   topAch.Explanation,
			BgGradient:    "from-amber-500 via-orange-600 to-red-600",
			IconName:      "award",
			Explanation:   topAch.Explanation,
			CtaText:       &topAch.CtaText,
			CtaAction:     &topAch.CtaAction,
		})
	}

	cards = append(cards, api.RecapCard{
		Id:            "card_5_cta",
		CardType:      "cta",
		Title:         "Ваш следующий шаг",
		Subtitle:      "Готовы поставить новый рекорд в 2025?",
		HighlightStat: aiTitle,
		Description:   "Поделитесь своими достижениями с друзьями или продолжите открывать новые возможности на Авито!",
		BgGradient:    "from-teal-500 via-emerald-600 to-green-700",
		IconName:      "rocket",
		Explanation:   "Персональная рекомендация по улучшению позиций в профиле",
		CtaText:       strPtr("Поделиться карточкой"),
		CtaAction:     strPtr("share"),
	})

	return cards
}

func strPtr(s string) *string {
	return &s
}
