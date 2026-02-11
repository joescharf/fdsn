package store

import (
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/joescharf/fdsn/internal/models"
)

type availabilityStore struct {
	db *sqlx.DB
}

// NewAvailabilityStore returns an AvailabilityStore backed by SQLite.
func NewAvailabilityStore(db *sqlx.DB) AvailabilityStore {
	return &availabilityStore{db: db}
}

func (s *availabilityStore) Upsert(channelID int64, earliest, latest string) error {
	_, err := s.db.Exec(`
		INSERT INTO availability (channel_id, earliest, latest)
		VALUES (?, ?, ?)
		ON CONFLICT (channel_id, earliest) DO UPDATE SET latest = excluded.latest, updated_at = CURRENT_TIMESTAMP`,
		channelID, earliest, latest,
	)
	return err
}

func (s *availabilityStore) UpsertBatch(items []AvailabilityItem) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.Prepare(`
		INSERT INTO availability (channel_id, earliest, latest)
		VALUES (?, ?, ?)
		ON CONFLICT (channel_id, earliest) DO UPDATE SET latest = excluded.latest, updated_at = CURRENT_TIMESTAMP`)
	if err != nil {
		return fmt.Errorf("prepare: %w", err)
	}
	defer stmt.Close()

	for _, item := range items {
		if _, err := stmt.Exec(item.ChannelID, item.Earliest, item.Latest); err != nil {
			return fmt.Errorf("upsert availability: %w", err)
		}
	}
	return tx.Commit()
}

func (s *availabilityStore) GetByStationID(stationID int64) ([]models.ChannelAvailability, error) {
	var rows []models.ChannelAvailability
	err := s.db.Select(&rows, `
		SELECT c.id AS channel_id, c.location_code, c.code, c.sample_rate,
		       a.earliest, a.latest
		FROM channels c
		LEFT JOIN availability a ON a.channel_id = c.id
		WHERE c.station_id = ?
		ORDER BY c.location_code, c.code`, stationID)
	return rows, err
}
