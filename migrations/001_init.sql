CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    saved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    response_time_sec INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

CREATE TABLE IF NOT EXISTS recap_cache (
    profile_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    ai_title TEXT NOT NULL,
    ai_story TEXT NOT NULL,
    archetype VARCHAR(100) NOT NULL,
    generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recap_cache_token ON recap_cache(share_token);
