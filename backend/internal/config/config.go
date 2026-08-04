package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	CSVUsersPath      string
	CSVActivitiesPath string
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

	csvUsers := os.Getenv("CSV_USERS_PATH")
	if csvUsers == "" {
		csvUsers = "../data/users.csv"
	}

	csvActivities := os.Getenv("CSV_ACTIVITIES_PATH")
	if csvActivities == "" {
		csvActivities = "../data/user_activities.csv"
	}

	return &Config{
		Port:              port,
		DatabaseURL:       dbURL,
		CSVUsersPath:      csvUsers,
		CSVActivitiesPath: csvActivities,
	}
}

