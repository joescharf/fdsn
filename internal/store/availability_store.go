package store

import (
	"github.com/jmoiron/sqlx"
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
