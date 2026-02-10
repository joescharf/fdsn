package store

import (
	"strings"
	"testing"

	"github.com/joescharf/fdsn/internal/database"
)

func setupTestDB(t *testing.T) *availabilityStore {
	t.Helper()
	db, err := database.New(t.TempDir() + "/test.db")
	if err != nil {
		t.Fatalf("database.New: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		t.Fatalf("Migrate: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	// Seed data: source -> network -> station -> channel
	db.Exec("INSERT INTO sources (name, base_url) VALUES ('test', 'http://test')")
	db.Exec("INSERT INTO networks (source_id, code) VALUES (1, 'IU')")
	db.Exec("INSERT INTO stations (network_id, code, latitude, longitude, elevation) VALUES (1, 'ANMO', 34.9, -106.4, 1850)")
	db.Exec("INSERT INTO channels (station_id, location_code, code, sample_rate) VALUES (1, '00', 'BHZ', 40)")
	db.Exec("INSERT INTO channels (station_id, location_code, code, sample_rate) VALUES (1, '00', 'BH1', 40)")

	return &availabilityStore{db: db}
}

func TestUpsert(t *testing.T) {
	s := setupTestDB(t)
	err := s.Upsert(1, "2020-01-01T00:00:00", "2024-01-01T00:00:00")
	if err != nil {
		t.Fatalf("Upsert: %v", err)
	}

	// Upsert again with later end time — should update
	err = s.Upsert(1, "2020-01-01T00:00:00", "2025-01-01T00:00:00")
	if err != nil {
		t.Fatalf("Upsert update: %v", err)
	}

	var latest string
	s.db.Get(&latest, "SELECT latest FROM availability WHERE channel_id = 1")
	if !strings.Contains(latest, "2025-01-01") {
		t.Errorf("expected updated latest to contain 2025-01-01, got %s", latest)
	}
}

func TestUpsertBatch(t *testing.T) {
	s := setupTestDB(t)
	items := []AvailabilityItem{
		{ChannelID: 1, Earliest: "2020-01-01T00:00:00", Latest: "2024-01-01T00:00:00"},
		{ChannelID: 2, Earliest: "2020-06-01T00:00:00", Latest: "2024-06-01T00:00:00"},
	}
	err := s.UpsertBatch(items)
	if err != nil {
		t.Fatalf("UpsertBatch: %v", err)
	}

	var count int
	s.db.Get(&count, "SELECT COUNT(*) FROM availability")
	if count != 2 {
		t.Errorf("expected 2 rows, got %d", count)
	}
}

func TestGetByStationID(t *testing.T) {
	s := setupTestDB(t)

	// Insert availability for channel 1 only
	s.Upsert(1, "2020-01-01T00:00:00", "2024-01-01T00:00:00")

	rows, err := s.GetByStationID(1)
	if err != nil {
		t.Fatalf("GetByStationID: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 rows (all channels), got %d", len(rows))
	}

	// BH1 (channel_id=2) sorts first, has no availability
	if rows[0].ChannelCode != "BH1" {
		t.Errorf("expected first row to be BH1, got %s", rows[0].ChannelCode)
	}
	if rows[0].Earliest != nil {
		t.Error("expected BH1 to have nil availability")
	}

	// BHZ (channel_id=1) sorts second, has availability
	if rows[1].ChannelCode != "BHZ" {
		t.Errorf("expected second row to be BHZ, got %s", rows[1].ChannelCode)
	}
	if rows[1].Earliest == nil {
		t.Error("expected BHZ to have availability")
	}
}
