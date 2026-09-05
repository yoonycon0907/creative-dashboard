export const SCHEMA_SQL = `
-- 계정 설정
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  account_type TEXT NOT NULL,
  account_name TEXT NOT NULL,
  meta_account_id TEXT NOT NULL UNIQUE,
  business_account_id TEXT,
  country_code TEXT DEFAULT 'KR',
  currency TEXT DEFAULT 'KRW',
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 소재 기본 정보
CREATE TABLE IF NOT EXISTS creatives (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  creative_id TEXT NOT NULL,
  creative_key TEXT NOT NULL,
  video_id TEXT,
  image_hash TEXT,
  asset_feed_id TEXT,
  product_set_id TEXT,
  creative_name TEXT,
  category TEXT,
  format TEXT,
  thumb_url TEXT,
  thumb_local_path TEXT,
  is_winner INTEGER DEFAULT 0,
  notes TEXT,
  manual_tags TEXT,
  status TEXT DEFAULT 'running',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(account_id, creative_key)
);

-- 일별 성과 데이터
CREATE TABLE IF NOT EXISTS ad_daily (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  creative_id TEXT NOT NULL,
  date TEXT NOT NULL,
  spend REAL,
  impressions INTEGER,
  clicks INTEGER,
  actions_omni_purchase INTEGER,
  catalog_segment_actions INTEGER,
  action_value REAL,
  synced_at TEXT NOT NULL,
  UNIQUE(account_id, creative_id, date)
);

-- 성별/연령별 일별 성과 데이터
CREATE TABLE IF NOT EXISTS ad_demo_daily (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  creative_id TEXT NOT NULL,
  date TEXT NOT NULL,
  gender TEXT NOT NULL,
  age_range TEXT NOT NULL,
  spend REAL,
  impressions INTEGER,
  clicks INTEGER,
  actions_omni_purchase INTEGER,
  catalog_segment_actions INTEGER,
  action_value REAL,
  synced_at TEXT NOT NULL,
  UNIQUE(account_id, creative_id, date, gender, age_range)
);

-- 동기화 이력
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  sync_type TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  creatives_fetched INTEGER,
  creatives_created INTEGER,
  creatives_updated INTEGER,
  days_fetched INTEGER,
  rows_inserted INTEGER,
  rows_updated INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  api_calls_made INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_seconds INTEGER
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_creatives_account_key ON creatives(account_id, creative_key);
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
CREATE INDEX IF NOT EXISTS idx_ad_daily_account_date ON ad_daily(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_daily_creative_date ON ad_daily(creative_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_demo_daily_creative_date ON ad_demo_daily(creative_id, date DESC);
`;
