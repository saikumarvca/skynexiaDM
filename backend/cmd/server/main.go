package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/saikumarvca/skynexiaDM/backend/internal/config"
	"github.com/saikumarvca/skynexiaDM/backend/internal/database"
	"github.com/saikumarvca/skynexiaDM/backend/internal/handler"
	appmiddleware "github.com/saikumarvca/skynexiaDM/backend/internal/middleware"
	"github.com/saikumarvca/skynexiaDM/backend/internal/repository"
	"github.com/saikumarvca/skynexiaDM/backend/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	log.Println("Database connected successfully")

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(userRepo, authService)

	r := chi.NewRouter()

	r.Get("/health", handler.Health)

	r.Route("/api", func(r chi.Router) {

		r.Get("/health", handler.Health)

		r.Route("/auth", func(r chi.Router) {

			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)

			r.Group(func(r chi.Router) {
				r.Use(appmiddleware.Auth(cfg.JWTSecret))
				r.Get("/me", authHandler.Me)
			})
		})
	})

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins: []string{
			cfg.FrontendURL,
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
		},
		AllowCredentials: true,
	})

	log.Printf("SkynexiaDM API starting on http://localhost:%s", cfg.Port)

	if err := http.ListenAndServe(
		":"+cfg.Port,
		corsMiddleware.Handler(r),
	); err != nil {
		log.Fatal(err)
	}
}
