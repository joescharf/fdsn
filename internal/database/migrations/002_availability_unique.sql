-- 002_availability_unique.sql: Add unique constraint for availability upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_channel_earliest ON availability(channel_id, earliest);
