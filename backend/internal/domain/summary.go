package domain

import "fmt"

type AISummaryResult struct {
	Title         string `json:"title"`
	Story         string `json:"story"`
	Archetype     string `json:"archetype"`
	GeneratedByAI bool   `json:"generated_by_ai"`
}

func GenerateSummary(userType string, totalSold, totalBought int, totalEarned, totalSaved float64, topCategory string, responseSpeedSec int) *AISummaryResult {
	switch userType {
	case "seller":
		return &AISummaryResult{
			Title:         "Главный Торговец Города",
			Story:         fmt.Sprintf("За этот год вы успешно продали %d товаров в категории %s и заработали %.0f ₽! Продавцы со всей страны берут с вас пример.", totalSold, topCategory, totalEarned),
			Archetype:     "Профи-Селлер",
			GeneratedByAI: false,
		}
	case "buyer":
		return &AISummaryResult{
			Title:         "Король Выгодного Шопинга",
			Story:         fmt.Sprintf("Вы совершили %d умных покупок и сэкономили семейному бюджету %.0f ₽. Умение находить лучшее — ваш главный супернавык!", totalBought, totalSaved),
			Archetype:     "Экономный Охотник",
			GeneratedByAI: false,
		}
	case "auto_enthusiast":
		return &AISummaryResult{
			Title:         "Повелитель Автомобильных Дорог",
			Story:         fmt.Sprintf("Категория %s стала вашим вторым домом. Вы изучили десятки запчастей и совершили идеальные апгрейды своего авто!", topCategory),
			Archetype:     "Авто-Эксперт",
			GeneratedByAI: false,
		}
	case "home_renovator":
		return &AISummaryResult{
			Title:         "Создатель Домашнего Уюта",
			Story:         fmt.Sprintf("Ваши покупки преобразили дом: от мебели до декора в категории %s. Вы доказали, что стильный интерьер не требует миллионного бюджета!", topCategory),
			Archetype:     "Мастер Интерьера",
			GeneratedByAI: false,
		}
	default:
		return &AISummaryResult{
			Title:         "Перспективный Исследователь Авито",
			Story:         "Вы сделали первые уверенные шаги на платформе. Впереди вас ждут сотни выгодных сделок и интересных открытий!",
			Archetype:     "Первопроходец",
			GeneratedByAI: false,
		}
	}
}
