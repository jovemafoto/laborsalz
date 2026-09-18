BEGIN;

CREATE SCHEMA IF NOT EXISTS ai_studio;

CREATE TABLE IF NOT EXISTS ai_studio.generation_requests (
  request_id text PRIMARY KEY,
  model_id text NOT NULL,
  surface text NOT NULL CHECK (surface IN ('image', 'video')),
  prompt text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  source text NOT NULL DEFAULT 'studio-ui',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_studio.generation_assets (
  id bigserial PRIMARY KEY,
  request_id text REFERENCES ai_studio.generation_requests(request_id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text,
  local_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_studio.events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  request_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_requests_created_at_idx
  ON ai_studio.generation_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS generation_requests_model_idx
  ON ai_studio.generation_requests (model_id, created_at DESC);

CREATE INDEX IF NOT EXISTS events_type_time_idx
  ON ai_studio.events (event_type, occurred_at DESC);

COMMIT;
