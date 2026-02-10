package store

import (
	"github.com/joescharf/fdsn/internal/models"
)

// SourceStore manages FDSN source configuration.
type SourceStore interface {
	List() ([]models.Source, error)
	Get(id int64) (*models.Source, error)
	Create(s *models.Source) error
	Update(s *models.Source) error
	Delete(id int64) error
}

// StationStore manages imported station metadata.
type StationStore interface {
	ListStations(networkCode, stationCode string, limit, offset int) ([]models.Station, int64, error)
	GetStation(id int64) (*models.StationDetail, error)
	DeleteStation(id int64) error
	ImportStations(sourceID int64, channels []models.ImportChannel) error
	ListNetworks() ([]models.Network, error)
}

// AvailabilityStore manages data availability records.
type AvailabilityStore interface {
	Upsert(channelID int64, earliest, latest string) error
}

// StatsStore provides dashboard statistics.
type StatsStore interface {
	GetStats() (*models.Stats, error)
}
