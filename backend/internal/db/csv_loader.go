package db

import (
	"context"
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/avitohack/backend/internal/repository/pg"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

func LoadCSVData(ctx context.Context, transactor pg.Transactor, fallback sqlc.Querier, usersPath, activitiesPath string) error {
	// 1. Read users CSV
	usersFile, err := os.Open(usersPath)
	if err != nil {
		return fmt.Errorf("failed to open users csv: %w", err)
	}
	defer usersFile.Close()

	uReader := csv.NewReader(usersFile)
	uRecords, err := uReader.ReadAll()
	if err != nil {
		return fmt.Errorf("failed to read users csv: %w", err)
	}

	// 2. Wrap user upserts in transaction
	err = pg.ExecTxOrFallback(ctx, transactor, fallback, func(q sqlc.Querier) error {
		for i, row := range uRecords {
			if i == 0 {
				continue
			}
			if len(row) < 6 {
				continue
			}

			id, _ := strconv.Atoi(row[0])
			regTime, _ := time.Parse(time.RFC3339, row[5])

			_, err := q.UpsertUser(ctx, sqlc.UpsertUserParams{
				ID:           int32(id),
				Username:     row[1],
				FullName:     row[2],
				AvatarUrl:    row[3],
				UserType:     row[4],
				RegisteredAt: regTime,
			})
			if err != nil {
				return fmt.Errorf("failed to upsert user %d: %w", id, err)
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("user seeding transaction failed: %w", err)
	}

	// 3. Read activities CSV
	actFile, err := os.Open(activitiesPath)
	if err != nil {
		return fmt.Errorf("failed to open activities csv: %w", err)
	}
	defer actFile.Close()

	aReader := csv.NewReader(actFile)
	aRecords, err := aReader.ReadAll()
	if err != nil {
		return fmt.Errorf("failed to read activities csv: %w", err)
	}

	// 4. Wrap activity deletion and insertions in a single atomic transaction
	err = pg.ExecTxOrFallback(ctx, transactor, fallback, func(q sqlc.Querier) error {
		if err := q.DeleteAllActivities(ctx); err != nil {
			return fmt.Errorf("failed to delete old activities: %w", err)
		}

		for i, row := range aRecords {
			if i == 0 {
				continue
			}
			if len(row) < 9 {
				continue
			}

			id, _ := strconv.Atoi(row[0])
			userID, _ := strconv.Atoi(row[1])
			t, _ := time.Parse(time.RFC3339, row[2])
			price, _ := strconv.ParseFloat(row[3], 64)
			if price == 0 && len(row) > 6 {
				price, _ = strconv.ParseFloat(row[6], 64)
			}
			saved, _ := strconv.ParseFloat(row[7], 64)
			respSec, _ := strconv.Atoi(row[8])

			var priceNumeric pgtype.Numeric
			_ = priceNumeric.Scan(fmt.Sprintf("%.2f", price))

			var savedNumeric pgtype.Numeric
			_ = savedNumeric.Scan(fmt.Sprintf("%.2f", saved))

			_, err := q.InsertActivity(ctx, sqlc.InsertActivityParams{
				ID:              int32(id),
				UserID:          int32(userID),
				Timestamp:       t,
				ActivityType:    row[3],
				Category:        row[4],
				Title:           row[5],
				Price:           priceNumeric,
				SavedAmount:     savedNumeric,
				ResponseTimeSec: int32(respSec),
			})
			if err != nil {
				return fmt.Errorf("failed to insert activity row %d: %w", id, err)
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("activity seeding transaction failed: %w", err)
	}

	return nil
}
