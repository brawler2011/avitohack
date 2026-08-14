package config

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	RabbitMQURL       string
	CSVUsersPath      string
	CSVActivitiesPath string
	OpenRouterAPIKey  string
	OpenRouterModel   string
}

func loadEnvFile() {
	dir, err := os.Getwd()
	if err != nil {
		return
	}
	for i := 0; i < 5; i++ {
		envPath := filepath.Join(dir, ".env")
		if _, err := os.Stat(envPath); err == nil {
			_ = godotenv.Overload(envPath)
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
}

func Load() *Config {
	loadEnvFile()

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/avitohack?sslmode=disable"
	}

	rabbitURL := strings.TrimSpace(os.Getenv("RABBITMQ_URL"))
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	csvUsers := strings.TrimSpace(os.Getenv("CSV_USERS_PATH"))
	if csvUsers == "" {
		csvUsers = "../data/users.csv"
	}

	csvActivities := strings.TrimSpace(os.Getenv("CSV_ACTIVITIES_PATH"))
	if csvActivities == "" {
		csvActivities = "../data/user_activities.csv"
	}

	openRouterKey := strings.TrimSpace(os.Getenv("OPENROUTER_API_KEY"))
	openRouterModel := strings.TrimSpace(os.Getenv("OPENROUTER_MODEL"))
	if openRouterModel == "" {
		openRouterModel = "gemini-2.5-flash"
	}

	return &Config{
		Port:              port,
		DatabaseURL:       dbURL,
		RabbitMQURL:       rabbitURL,
		CSVUsersPath:      csvUsers,
		CSVActivitiesPath: csvActivities,
		OpenRouterAPIKey:  openRouterKey,
		OpenRouterModel:   openRouterModel,
	}
}


