package pg_test

import (
	"context"
	"errors"
	"testing"

	"github.com/avitohack/backend/internal/repository/pg"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockTx struct {
	mock.Mock
	pgx.Tx
}

func (m *mockTx) Commit(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *mockTx) Rollback(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *mockTx) Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error) {
	args := m.Called(ctx, sql, arguments)
	return args.Get(0).(pgconn.CommandTag), args.Error(1)
}

func (m *mockTx) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	callArgs := m.Called(ctx, sql, args)
	return callArgs.Get(0).(pgx.Rows), callArgs.Error(1)
}

func (m *mockTx) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	callArgs := m.Called(ctx, sql, args)
	return callArgs.Get(0).(pgx.Row)
}

type mockTransactor struct {
	mock.Mock
}

func (m *mockTransactor) Begin(ctx context.Context) (pgx.Tx, error) {
	args := m.Called(ctx)
	if tx, ok := args.Get(0).(pgx.Tx); ok {
		return tx, args.Error(1)
	}
	return nil, args.Error(1)
}

func TestExecTx_Success(t *testing.T) {
	ctx := context.Background()
	tx := new(mockTx)
	transactor := new(mockTransactor)

	transactor.On("Begin", ctx).Return(tx, nil)
	tx.On("Rollback", ctx).Return(nil)
	tx.On("Commit", ctx).Return(nil)

	executed := false
	err := pg.ExecTx(ctx, transactor, func(q *sqlc.Queries) error {
		executed = true
		return nil
	})

	assert.NoError(t, err)
	assert.True(t, executed)
	transactor.AssertExpectations(t)
	tx.AssertExpectations(t)
}

func TestExecTx_CallbackError_Rollback(t *testing.T) {
	ctx := context.Background()
	tx := new(mockTx)
	transactor := new(mockTransactor)

	dummyErr := errors.New("something went wrong")

	transactor.On("Begin", ctx).Return(tx, nil)
	tx.On("Rollback", ctx).Return(nil)

	err := pg.ExecTx(ctx, transactor, func(q *sqlc.Queries) error {
		return dummyErr
	})

	assert.ErrorIs(t, err, dummyErr)
	transactor.AssertExpectations(t)
	tx.AssertExpectations(t)
}

func TestExecTx_NilTransactor(t *testing.T) {
	ctx := context.Background()
	err := pg.ExecTx(ctx, nil, func(q *sqlc.Queries) error {
		return nil
	})
	assert.ErrorContains(t, err, "transactor DB is nil")
}

func TestExecTxOrFallback_WithTransactor(t *testing.T) {
	ctx := context.Background()
	tx := new(mockTx)
	transactor := new(mockTransactor)

	transactor.On("Begin", ctx).Return(tx, nil)
	tx.On("Rollback", ctx).Return(nil)
	tx.On("Commit", ctx).Return(nil)

	executed := false
	err := pg.ExecTxOrFallback(ctx, transactor, nil, func(q sqlc.Querier) error {
		executed = true
		return nil
	})

	assert.NoError(t, err)
	assert.True(t, executed)
	transactor.AssertExpectations(t)
}

func TestExecTxOrFallback_WithFallback(t *testing.T) {
	ctx := context.Background()
	executed := false

	err := pg.ExecTxOrFallback(ctx, nil, nil, func(q sqlc.Querier) error {
		executed = true
		return nil
	})

	assert.ErrorContains(t, err, "neither transactor nor fallback querier is available")
	assert.False(t, executed)
}
