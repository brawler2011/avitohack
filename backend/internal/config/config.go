package config

import (
	"os"

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
	_ = godotenv.Load(".env", "../.env", "../../.env")
}

func Load() *Config {
	loadEnvFile()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/avitohack?sslmode=disable"
	}

	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	csvUsers := os.Getenv("CSV_USERS_PATH")
	if csvUsers == "" {
		csvUsers = "../data/users.csv"
	}

	csvActivities := os.Getenv("CSV_ACTIVITIES_PATH")
	if csvActivities == "" {
		csvActivities = "../data/user_activities.csv"
	}

	openRouterKey := os.Getenv("OPENROUTER_API_KEY")
	openRouterModel := os.Getenv("OPENROUTER_MODEL")
	if openRouterModel == "" {
		openRouterModel = "google/gemini-2.0-flash-001"
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


