CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  hanzi TEXT NOT NULL,
  pinyin TEXT NOT NULL DEFAULT '',
  polish TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at);
