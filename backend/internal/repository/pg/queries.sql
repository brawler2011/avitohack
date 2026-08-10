-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users ORDER BY id ASC;

-- name: UpsertUser :one
INSERT INTO users (id, username, full_name, avatar_url, user_type, registered_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    user_type = EXCLUDED.user_type,
    registered_at = EXCLUDED.registered_at
RETURNING *;

-- name: DeleteAllActivities :exec
DELETE FROM user_activities;

-- name: InsertActivity :one
INSERT INTO user_activities (id, user_id, timestamp, activity_type, category, title, price, saved_amount, response_time_sec)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetUserActivities :many
SELECT * FROM user_activities WHERE user_id = $1 ORDER BY timestamp ASC;

-- name: GetRecapCacheByProfileID :one
SELECT * FROM recap_cache WHERE profile_id = $1;

-- name: GetRecapCacheByShareToken :one
SELECT * FROM recap_cache WHERE share_token = $1;

-- name: UpsertRecapCache :one
INSERT INTO recap_cache (profile_id, share_token, ai_title, ai_story, archetype, generated_by_ai, cards_json, achievements_json, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
ON CONFLICT (profile_id) DO UPDATE SET
    share_token = EXCLUDED.share_token,
    ai_title = EXCLUDED.ai_title,
    ai_story = EXCLUDED.ai_story,
    archetype = EXCLUDED.archetype,
    generated_by_ai = EXCLUDED.generated_by_ai,
    cards_json = EXCLUDED.cards_json,
    achievements_json = EXCLUDED.achievements_json,
    updated_at = NOW()
RETURNING *;

