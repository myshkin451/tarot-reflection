CREATE TABLE IF NOT EXISTS ai_readings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  locale TEXT NOT NULL,
  question TEXT,
  spread_id TEXT NOT NULL,
  spread_name TEXT NOT NULL,
  cards_json TEXT NOT NULL,
  local_insight_json TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model TEXT NOT NULL,
  usage_json TEXT,
  request_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_readings_created_at ON ai_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_readings_day ON ai_readings(day);
CREATE INDEX IF NOT EXISTS idx_ai_readings_ip_hash ON ai_readings(ip_hash);

CREATE TABLE IF NOT EXISTS daily_ip_limits (
  ip_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (ip_hash, day)
);
