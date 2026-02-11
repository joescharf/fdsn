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
	LookupChannelIDs(sourceID int64, networkCode, stationCode string) (map[string]int64, error)
	ListNetworksBySource(sourceID int64) ([]models.Network, error)
	ListStationsBySource(sourceID int64, networkCode string, limit, offset int) ([]models.Station, int64, error)
	ListUniqueSourceNetworks() ([]models.SourceNetwork, error)
}

// AvailabilityItem represents a single availability record for batch operations.
type AvailabilityItem struct {
	ChannelID int64
	Earliest  string
	Latest    string
}

// AvailabilityStore manages data availability records.
type AvailabilityStore interface {
	Upsert(channelID int64, earliest, latest string) error
	UpsertBatch(items []AvailabilityItem) error
	GetByStationID(stationID int64) ([]models.ChannelAvailability, error)
}

// StatsStore provides dashboard statistics.
type StatsStore interface {
	GetStats() (*models.Stats, error)
}
