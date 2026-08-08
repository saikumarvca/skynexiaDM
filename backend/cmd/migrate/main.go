// Command migrate applies SQL files in backend/migrations in filename order.
//
// Each file is run once inside a transaction and recorded in the
// schema_migrations table, so re-running is safe. Migration SQL should still be
// written idempotently (IF NOT EXISTS / guarded constraints) so a file that was
// applied manually before this runner existed can be recorded without error.
//
// Usage (from the backend directory):
//
//	go run ./cmd/migrate
package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/saikumarvca/skynexiaDM/backend/internal/config"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`); err != nil {
		log.Fatalf("ensure schema_migrations: %v", err)
	}

	const dir = "migrations"
	entries, err := os.ReadDir(dir)
	if err != nil {
		log.Fatalf("read %s: %v", dir, err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied := 0
	for _, name := range files {
		var exists bool
		if err := pool.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)`,
			name,
		).Scan(&exists); err != nil {
			log.Fatalf("check %s: %v", name, err)
		}
		if exists {
			log.Printf("skip   %s (already applied)", name)
			continue
		}

		sqlBytes, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			log.Fatalf("read %s: %v", name, err)
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			log.Fatalf("begin %s: %v", name, err)
		}
		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			_ = tx.Rollback(ctx)
			log.Fatalf("apply %s: %v", name, err)
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO schema_migrations (version) VALUES ($1)`, name,
		); err != nil {
			_ = tx.Rollback(ctx)
			log.Fatalf("record %s: %v", name, err)
		}
		if err := tx.Commit(ctx); err != nil {
			log.Fatalf("commit %s: %v", name, err)
		}

		log.Printf("apply  %s (ok)", name)
		applied++
	}

	log.Printf("migrations complete (%d applied, %d total)", applied, len(files))
}
