package store

import (
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/joescharf/fdsn/internal/models"
)

type stationStore struct {
	db *sqlx.DB
}

// NewStationStore returns a StationStore backed by SQLite.
func NewStationStore(db *sqlx.DB) StationStore {
	return &stationStore{db: db}
}

func (s *stationStore) ListStations(networkCode, stationCode string, limit, offset int) ([]models.Station, int64, error) {
	where := "1=1"
	args := []any{}

	if networkCode != "" {
		where += " AND n.code = ?"
		args = append(args, networkCode)
	}
	if stationCode != "" {
		where += " AND st.code = ?"
		args = append(args, stationCode)
	}

	// Count
	var total int64
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM stations st JOIN networks n ON st.network_id = n.id WHERE %s", where)
	if err := s.db.Get(&total, countQ, args...); err != nil {
		return nil, 0, err
	}

	// Query
	q := fmt.Sprintf(`SELECT st.*, n.code AS network_code, n.source_id AS source_id,
		EXISTS (SELECT 1 FROM availability a JOIN channels c ON a.channel_id = c.id WHERE c.station_id = st.id) AS has_availability
		FROM stations st
		JOIN networks n ON st.network_id = n.id
		WHERE %s
		ORDER BY n.code, st.code
		LIMIT ? OFFSET ?`, where)
	args = append(args, limit, offset)

	var stations []models.Station
	if err := s.db.Select(&stations, q, args...); err != nil {
		return nil, 0, err
	}
	return stations, total, nil
}

func (s *stationStore) GetStation(id int64) (*models.StationDetail, error) {
	var station models.Station
	err := s.db.Get(&station, `SELECT st.*, n.code AS network_code, n.source_id AS source_id
		FROM stations st
		JOIN networks n ON st.network_id = n.id
		WHERE st.id = ?`, id)
	if err != nil {
		return nil, err
	}

	var channels []models.Channel
	if err := s.db.Select(&channels, "SELECT * FROM channels WHERE station_id = ? ORDER BY location_code, code", id); err != nil {
		return nil, err
	}

	return &models.StationDetail{
		Station:  station,
		Channels: channels,
	}, nil
}

func (s *stationStore) DeleteStation(id int64) error {
	_, err := s.db.Exec("DELETE FROM stations WHERE id = ?", id)
	return err
}

func (s *stationStore) ImportStations(sourceID int64, channels []models.ImportChannel) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	// Cache network and station IDs to avoid repeated lookups
	type netKey struct{ code string }
	type staKey struct {
		netID int64
		code  string
	}
	networkIDs := map[netKey]int64{}
	stationIDs := map[staKey]int64{}

	for _, ch := range channels {
		// Upsert network: find by (source_id, code), update if exists, insert if not
		nk := netKey{code: ch.NetworkCode}
		netID, ok := networkIDs[nk]
		if !ok {
			err := tx.Get(&netID, "SELECT id FROM networks WHERE source_id = ? AND code = ? LIMIT 1", sourceID, ch.NetworkCode)
			if err != nil {
				res, err := tx.Exec(
					"INSERT INTO networks (source_id, code, description) VALUES (?, ?, ?)",
					sourceID, ch.NetworkCode, ch.NetworkDescription,
				)
				if err != nil {
					return fmt.Errorf("insert network %s: %w", ch.NetworkCode, err)
				}
				netID, _ = res.LastInsertId()
			} else {
				// Update existing network metadata
				_, err = tx.Exec("UPDATE networks SET description = ? WHERE id = ?",
					ch.NetworkDescription, netID)
				if err != nil {
					return fmt.Errorf("update network %s: %w", ch.NetworkCode, err)
				}
			}
			networkIDs[nk] = netID
		}

		// Upsert station: find by (network_id, code), update if exists, insert if not
		sk := staKey{netID: netID, code: ch.StationCode}
		staID, ok := stationIDs[sk]
		if !ok {
			err := tx.Get(&staID, "SELECT id FROM stations WHERE network_id = ? AND code = ? LIMIT 1", netID, ch.StationCode)
			if err != nil {
				res, err := tx.Exec(
					"INSERT INTO stations (network_id, code, latitude, longitude, elevation, site_name, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
					netID, ch.StationCode, ch.Latitude, ch.Longitude, ch.Elevation, ch.SiteName, ch.StationStartTime, ch.StationEndTime,
				)
				if err != nil {
					return fmt.Errorf("insert station %s: %w", ch.StationCode, err)
				}
				staID, _ = res.LastInsertId()
			} else {
				// Update existing station metadata
				_, err = tx.Exec(
					"UPDATE stations SET latitude = ?, longitude = ?, elevation = ?, site_name = ?, start_time = ?, end_time = ? WHERE id = ?",
					ch.Latitude, ch.Longitude, ch.Elevation, ch.SiteName, ch.StationStartTime, ch.StationEndTime, staID,
				)
				if err != nil {
					return fmt.Errorf("update station %s: %w", ch.StationCode, err)
				}
			}
			stationIDs[sk] = staID
		}

		// Upsert channel: replace on conflict so metadata gets updated on re-import
		_, err := tx.Exec(
			`INSERT OR REPLACE INTO channels (station_id, location_code, code, latitude, longitude, elevation, depth, azimuth, dip, sensor_description, scale, scale_freq, scale_units, sample_rate, start_time, end_time)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			staID, ch.LocationCode, ch.ChannelCode,
			ch.ChanLatitude, ch.ChanLongitude, ch.ChanElevation, ch.Depth,
			ch.Azimuth, ch.Dip, ch.SensorDescription,
			ch.Scale, ch.ScaleFreq, ch.ScaleUnits, ch.SampleRate,
			ch.ChanStartTime, ch.ChanEndTime,
		)
		if err != nil {
			return fmt.Errorf("insert channel %s.%s: %w", ch.StationCode, ch.ChannelCode, err)
		}
	}

	return tx.Commit()
}

func (s *stationStore) ListNetworks() ([]models.Network, error) {
	var networks []models.Network
	err := s.db.Select(&networks, "SELECT * FROM networks ORDER BY code")
	return networks, err
}

func (s *stationStore) LookupChannelIDs(sourceID int64, networkCode, stationCode string) (map[string]int64, error) {
	type row struct {
		ID           int64  `db:"id"`
		LocationCode string `db:"location_code"`
		Code         string `db:"code"`
	}
	var rows []row
	err := s.db.Select(&rows, `
		SELECT c.id, c.location_code, c.code
		FROM channels c
		JOIN stations st ON c.station_id = st.id
		JOIN networks n ON st.network_id = n.id
		WHERE n.source_id = ? AND n.code = ? AND st.code = ?`,
		sourceID, networkCode, stationCode)
	if err != nil {
		return nil, err
	}
	m := make(map[string]int64, len(rows))
	for _, r := range rows {
		key := r.LocationCode + "." + r.Code
		m[key] = r.ID
	}
	return m, nil
}

func (s *stationStore) ListNetworksBySource(sourceID int64) ([]models.Network, error) {
	var networks []models.Network
	err := s.db.Select(&networks, "SELECT * FROM networks WHERE source_id = ? ORDER BY code", sourceID)
	return networks, err
}

func (s *stationStore) ListStationsBySource(sourceID int64, networkCode string, limit, offset int) ([]models.Station, int64, error) {
	where := "n.source_id = ?"
	args := []any{sourceID}

	if networkCode != "" {
		where += " AND n.code = ?"
		args = append(args, networkCode)
	}

	var total int64
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM stations st JOIN networks n ON st.network_id = n.id WHERE %s", where)
	if err := s.db.Get(&total, countQ, args...); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`SELECT st.*, n.code AS network_code, n.source_id AS source_id,
		EXISTS (SELECT 1 FROM availability a JOIN channels c ON a.channel_id = c.id WHERE c.station_id = st.id) AS has_availability
		FROM stations st
		JOIN networks n ON st.network_id = n.id
		WHERE %s
		ORDER BY n.code, st.code
		LIMIT ? OFFSET ?`, where)
	args = append(args, limit, offset)

	var stations []models.Station
	if err := s.db.Select(&stations, q, args...); err != nil {
		return nil, 0, err
	}
	return stations, total, nil
}

func (s *stationStore) ListUniqueSourceNetworks() ([]models.SourceNetwork, error) {
	var result []models.SourceNetwork
	err := s.db.Select(&result, `
		SELECT DISTINCT n.source_id, src.name AS source_name, n.code AS network_code
		FROM networks n
		JOIN sources src ON n.source_id = src.id
		ORDER BY src.name, n.code`)
	return result, err
}

// NewStatsStore returns a StatsStore backed by SQLite.
func NewStatsStore(db *sqlx.DB) StatsStore {
	return &statsStore{db: db}
}

type statsStore struct {
	db *sqlx.DB
}

func (s *statsStore) GetStats() (*models.Stats, error) {
	var stats models.Stats
	row := s.db.QueryRow(`SELECT
		(SELECT COUNT(*) FROM sources) AS sources,
		(SELECT COUNT(*) FROM networks) AS networks,
		(SELECT COUNT(*) FROM stations) AS stations,
		(SELECT COUNT(*) FROM channels) AS channels`)
	err := row.Scan(&stats.Sources, &stats.Networks, &stats.Stations, &stats.Channels)
	return &stats, err
}
