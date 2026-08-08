package config

import "os"

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string
	FrontendURL string
	JWTSecret   string
}

func Load() Config {
	return Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		Port:        getEnv("PORT", "8001"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3152"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
