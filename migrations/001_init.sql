CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  family_id   UUID NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);

CREATE TABLE activity_types (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(50) NOT NULL UNIQUE,
  points_per_minute NUMERIC(6,2) NOT NULL CHECK (points_per_minute > 0),
  points_per_km     NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (points_per_km >= 0)
);

CREATE TABLE activity_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type_id INT  NOT NULL REFERENCES activity_types(id),
  duration_minutes INT  NOT NULL CHECK (duration_minutes > 0),
  distance_km      NUMERIC(7,2) CHECK (distance_km >= 0),
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, performed_at DESC);

CREATE TABLE point_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_log_id UUID UNIQUE REFERENCES activity_logs(id) ON DELETE SET NULL,
  points          INT  NOT NULL,
  reason          VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_point_events_user ON point_events(user_id);

CREATE TABLE challenges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  CHECK (ends_at > starts_at)
);

CREATE TABLE challenge_participants (
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

INSERT INTO activity_types (name, points_per_minute, points_per_km) VALUES
  ('Correr', 1.0, 5.0),
  ('Ciclismo', 0.8, 2.0),
  ('Natación', 1.2, 0),
  ('Pesas', 0.9, 0),
  ('Caminata', 0.5, 3.0);