-- 003_dedup_stations.sql: Deduplicate stations/networks and tighten UNIQUE constraints
-- Remove start_time from uniqueness since it causes duplicates on re-import

-- Step 1: Reassign channels from duplicate stations to the surviving (lowest id) station
UPDATE channels
SET station_id = (
    SELECT MIN(s2.id)
    FROM stations s2
    WHERE s2.network_id = (SELECT network_id FROM stations WHERE id = channels.station_id)
      AND s2.code = (SELECT code FROM stations WHERE id = channels.station_id)
)
WHERE station_id NOT IN (
    SELECT MIN(id) FROM stations GROUP BY network_id, code
);

-- Step 2: Delete duplicate station rows (keep lowest id per network_id, code)
DELETE FROM stations
WHERE id NOT IN (
    SELECT MIN(id) FROM stations GROUP BY network_id, code
);

-- Step 3: Delete duplicate network rows (keep lowest id per source_id, code)
-- First reassign stations from duplicate networks to the surviving network
UPDATE stations
SET network_id = (
    SELECT MIN(n2.id)
    FROM networks n2
    WHERE n2.source_id = (SELECT source_id FROM networks WHERE id = stations.network_id)
      AND n2.code = (SELECT code FROM networks WHERE id = stations.network_id)
)
WHERE network_id NOT IN (
    SELECT MIN(id) FROM networks GROUP BY source_id, code
);

DELETE FROM networks
WHERE id NOT IN (
    SELECT MIN(id) FROM networks GROUP BY source_id, code
);

-- Step 4: Drop old UNIQUE indexes and recreate without start_time
-- SQLite doesn't support DROP CONSTRAINT, so we recreate via index manipulation

-- For stations: drop the old unique constraint by recreating the table
-- Since SQLite has limited ALTER TABLE, we use a temp table approach
CREATE TABLE stations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    elevation REAL NOT NULL,
    site_name TEXT,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(network_id, code)
);

INSERT INTO stations_new SELECT * FROM stations;

-- Move channels FK references: SQLite defers FK checks with pragma, but since
-- we preserve IDs this is safe
DROP TABLE stations;
ALTER TABLE stations_new RENAME TO stations;

-- For networks: same approach
CREATE TABLE networks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES sources(id),
    code TEXT NOT NULL,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, code)
);

INSERT INTO networks_new SELECT * FROM networks;
DROP TABLE networks;
ALTER TABLE networks_new RENAME TO networks;

-- For channels: recreate with updated constraint (exclude start_time for simpler upserts)
CREATE TABLE channels_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    location_code TEXT DEFAULT '',
    code TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    elevation REAL,
    depth REAL,
    azimuth REAL,
    dip REAL,
    sensor_description TEXT,
    scale REAL,
    scale_freq REAL,
    scale_units TEXT,
    sample_rate REAL,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, location_code, code)
);

INSERT OR IGNORE INTO channels_new SELECT * FROM channels;
DROP TABLE channels;
ALTER TABLE channels_new RENAME TO channels;
