package pg

import (
	"context"
	"fmt"

	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/jackc/pgx/v5"
)

// Transactor defines an interface for initiating database transactions.
type Transactor interface {
	Begin(ctx context.Context) (pgx.Tx, error)
}

// ExecTx executes a callback function within a database transaction.
// If fn returns an error or panics, the transaction is rolled back.
// If fn succeeds, the transaction is committed.
func ExecTx(ctx context.Context, db Transactor, fn func(q *sqlc.Queries) error) error {
	if db == nil {
		return fmt.Errorf("transactor DB is nil")
	}

	tx, err := db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	q := sqlc.New(tx)
	if err := fn(q); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ExecTxOrFallback runs fn within a transaction if transactor is non-nil,
// or falls back to executing fn directly with defaultQueries if transactor is nil.
func ExecTxOrFallback(ctx context.Context, db Transactor, fallback sqlc.Querier, fn func(q sqlc.Querier) error) error {
	if db != nil {
		return ExecTx(ctx, db, func(q *sqlc.Queries) error {
			return fn(q)
		})
	}
	if fallback != nil {
		return fn(fallback)
	}
	return fmt.Errorf("neither transactor nor fallback querier is available")
}
