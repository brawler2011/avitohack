package db_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/avitohack/backend/internal/db"
	"github.com/avitohack/backend/internal/repository/pg/sqlc"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockQuerier struct {
	mock.Mock
	sqlc.Querier
}

func (m *mockQuerier) UpsertUser(ctx context.Context, arg sqlc.UpsertUserParams) (sqlc.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *mockQuerier) DeleteAllActivities(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *mockQuerier) InsertActivity(ctx context.Context, arg sqlc.InsertActivityParams) (sqlc.UserActivity, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.UserActivity), args.Error(1)
}

func (m *mockQuerier) GetRecapCacheByProfileID(ctx context.Context, profileID int32) (sqlc.RecapCache, error) {
	args := m.Called(ctx, profileID)
	return args.Get(0).(sqlc.RecapCache), args.Error(1)
}

func (m *mockQuerier) GetUserByID(ctx context.Context, id int32) (sqlc.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.User), args.Error(1)
}

func (m *mockQuerier) UpsertRecapCache(ctx context.Context, arg sqlc.UpsertRecapCacheParams) (sqlc.RecapCache, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.RecapCache), args.Error(1)
}

func createTempCSV(t *testing.T, filename, content string) string {
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, filename)
	err := os.WriteFile(filePath, []byte(content), 0644)
	assert.NoError(t, err)
	return filePath
}

func TestLoadCSVData_Success(t *testing.T) {
	usersContent := "id,username,full_name,avatar_url,user_type,registered_at\n1,testuser,Test User,avatar.png,seller,2024-01-01T00:00:00Z\n"
	activitiesContent := "id,user_id,timestamp,activity_type,category,title,price,saved_amount,response_time_sec\n1,1,2024-01-02T10:00:00Z,sale,electronics,Phone,100.00,0.00,30\n"

	usersPath := createTempCSV(t, "users.csv", usersContent)
	actPath := createTempCSV(t, "activities.csv", activitiesContent)

	q := new(mockQuerier)
	q.On("UpsertUser", mock.Anything, mock.Anything).Return(sqlc.User{}, nil)
	q.On("DeleteAllActivities", mock.Anything).Return(nil)
	q.On("InsertActivity", mock.Anything, mock.Anything).Return(sqlc.UserActivity{}, nil)
	q.On("GetRecapCacheByProfileID", mock.Anything, mock.Anything).Return(sqlc.RecapCache{}, errors.New("not found"))
	q.On("GetUserByID", mock.Anything, mock.Anything).Return(sqlc.User{}, nil)
	q.On("UpsertRecapCache", mock.Anything, mock.Anything).Return(sqlc.RecapCache{}, nil)

	err := db.LoadCSVData(context.Background(), nil, q, usersPath, actPath)

	assert.NoError(t, err)
	q.AssertExpectations(t)
}

func TestLoadCSVData_UserInsertError(t *testing.T) {
	usersContent := "id,username,full_name,avatar_url,user_type,registered_at\n1,testuser,Test User,avatar.png,seller,2024-01-01T00:00:00Z\n"
	activitiesContent := "id,user_id,timestamp,activity_type,category,title,price,saved_amount,response_time_sec\n"

	usersPath := createTempCSV(t, "users.csv", usersContent)
	actPath := createTempCSV(t, "activities.csv", activitiesContent)

	q := new(mockQuerier)
	q.On("UpsertUser", mock.Anything, mock.Anything).Return(sqlc.User{}, errors.New("db error"))

	err := db.LoadCSVData(context.Background(), nil, q, usersPath, actPath)

	assert.ErrorContains(t, err, "user seeding transaction failed")
	q.AssertExpectations(t)
}

func TestLoadCSVData_ActivityInsertError(t *testing.T) {
	usersContent := "id,username,full_name,avatar_url,user_type,registered_at\n1,testuser,Test User,avatar.png,seller,2024-01-01T00:00:00Z\n"
	activitiesContent := "id,user_id,timestamp,activity_type,category,title,price,saved_amount,response_time_sec\n1,1,2024-01-02T10:00:00Z,sale,electronics,Phone,100.00,0.00,30\n"

	usersPath := createTempCSV(t, "users.csv", usersContent)
	actPath := createTempCSV(t, "activities.csv", activitiesContent)

	q := new(mockQuerier)
	q.On("UpsertUser", mock.Anything, mock.Anything).Return(sqlc.User{}, nil)
	q.On("DeleteAllActivities", mock.Anything).Return(nil)
	q.On("InsertActivity", mock.Anything, mock.Anything).Return(sqlc.UserActivity{}, errors.New("fk constraint failed"))

	err := db.LoadCSVData(context.Background(), nil, q, usersPath, actPath)

	assert.ErrorContains(t, err, "activity seeding transaction failed")
	q.AssertExpectations(t)
}
