package models

import "time"

type Source struct {
	ID          int64     `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	BaseURL     string    `db:"base_url" json:"base_url"`
	Description string    `db:"description" json:"description"`
	Enabled     bool      `db:"enabled" json:"enabled"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

// SourceSummary extends Source with aggregate counts.
type SourceSummary struct {
	Source
	NetworkCount      int64 `db:"network_count" json:"network_count"`
	StationCount      int64 `db:"station_count" json:"station_count"`
	AvailabilityCount int64 `db:"availability_count" json:"availability_count"`
}

type Network struct {
	ID          int64      `db:"id" json:"id"`
	SourceID    int64      `db:"source_id" json:"source_id"`
	Code        string     `db:"code" json:"code"`
	Description string     `db:"description" json:"description"`
	StartTime   *time.Time `db:"start_time" json:"start_time"`
	EndTime     *time.Time `db:"end_time" json:"end_time"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
}

type Station struct {
	ID        int64      `db:"id" json:"id"`
	NetworkID int64      `db:"network_id" json:"network_id"`
	Code      string     `db:"code" json:"code"`
	Latitude  float64    `db:"latitude" json:"latitude"`
	Longitude float64    `db:"longitude" json:"longitude"`
	Elevation float64    `db:"elevation" json:"elevation"`
	SiteName  string     `db:"site_name" json:"site_name"`
	StartTime *time.Time `db:"start_time" json:"start_time"`
	EndTime   *time.Time `db:"end_time" json:"end_time"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`

	// Joined fields (not always populated)
	NetworkCode     string `db:"network_code" json:"network_code,omitempty"`
	SourceName      string `db:"source_name" json:"source_name,omitempty"`
	SourceID        int64  `db:"source_id" json:"source_id,omitempty"`
	HasAvailability bool   `db:"has_availability" json:"has_availability"`
}

type Channel struct {
	ID                int64      `db:"id" json:"id"`
	StationID         int64      `db:"station_id" json:"station_id"`
	LocationCode      string     `db:"location_code" json:"location_code"`
	Code              string     `db:"code" json:"code"`
	Latitude          *float64   `db:"latitude" json:"latitude"`
	Longitude         *float64   `db:"longitude" json:"longitude"`
	Elevation         *float64   `db:"elevation" json:"elevation"`
	Depth             *float64   `db:"depth" json:"depth"`
	Azimuth           *float64   `db:"azimuth" json:"azimuth"`
	Dip               *float64   `db:"dip" json:"dip"`
	SensorDescription string     `db:"sensor_description" json:"sensor_description"`
	Scale             *float64   `db:"scale" json:"scale"`
	ScaleFreq         *float64   `db:"scale_freq" json:"scale_freq"`
	ScaleUnits        string     `db:"scale_units" json:"scale_units"`
	SampleRate        *float64   `db:"sample_rate" json:"sample_rate"`
	StartTime         *time.Time `db:"start_time" json:"start_time"`
	EndTime           *time.Time `db:"end_time" json:"end_time"`
	CreatedAt         time.Time  `db:"created_at" json:"created_at"`
}

type Availability struct {
	ID        int64     `db:"id" json:"id"`
	ChannelID int64     `db:"channel_id" json:"channel_id"`
	Earliest  time.Time `db:"earliest" json:"earliest"`
	Latest    time.Time `db:"latest" json:"latest"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// ChannelAvailability pairs a channel with its data availability window.
type ChannelAvailability struct {
	ChannelID    int64    `db:"channel_id" json:"channel_id"`
	LocationCode string   `db:"location_code" json:"location_code"`
	ChannelCode  string   `db:"code" json:"channel_code"`
	SampleRate   *float64 `db:"sample_rate" json:"sample_rate"`
	Earliest     *string  `db:"earliest" json:"earliest"`
	Latest       *string  `db:"latest" json:"latest"`
}

// StationDetail includes a Station plus its channels.
type StationDetail struct {
	Station
	Channels     []Channel             `json:"channels"`
	Availability []ChannelAvailability `json:"availability,omitempty"`
}

// ImportChannel is used when importing channel-level data from an external FDSN source.
type ImportChannel struct {
	NetworkCode        string
	NetworkDescription string
	StationCode        string
	Latitude           float64
	Longitude          float64
	Elevation          float64
	SiteName           string
	StationStartTime   *time.Time
	StationEndTime     *time.Time
	LocationCode       string
	ChannelCode        string
	ChanLatitude       float64
	ChanLongitude      float64
	ChanElevation      float64
	Depth              float64
	Azimuth            float64
	Dip                float64
	SensorDescription  string
	Scale              float64
	ScaleFreq          float64
	ScaleUnits         string
	SampleRate         float64
	ChanStartTime      *time.Time
	ChanEndTime        *time.Time
}

// SourceNetwork represents a unique source+network pair for refresh targets.
type SourceNetwork struct {
	SourceID    int64  `db:"source_id" json:"source_id"`
	SourceName  string `db:"source_name" json:"source_name"`
	NetworkCode string `db:"network_code" json:"network_code"`
}

// Stats holds dashboard summary counts.
type Stats struct {
	Sources  int64 `json:"sources"`
	Networks int64 `json:"networks"`
	Stations int64 `json:"stations"`
	Channels int64 `json:"channels"`
}
