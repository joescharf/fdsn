package fdsnclient

import (
	"bufio"
	"fmt"
	"io"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// StationTextRow represents one row from an FDSN station text-format response.
type StationTextRow struct {
	Network     string
	Station     string
	Latitude    float64
	Longitude   float64
	Elevation   float64
	SiteName    string
	StartTime   *time.Time
	EndTime     *time.Time
	Description string // network description (when level=network)
}

// ChannelTextRow represents one row from an FDSN channel text-format response.
type ChannelTextRow struct {
	Network           string
	Station           string
	Location          string
	Channel           string
	Latitude          float64
	Longitude         float64
	Elevation         float64
	Depth             float64
	Azimuth           float64
	Dip               float64
	SensorDescription string
	Scale             float64
	ScaleFreq         float64
	ScaleUnits        string
	SampleRate        float64
	StartTime         *time.Time
	EndTime           *time.Time
}

// StationQuery holds query parameters for the FDSN station service.
type StationQuery struct {
	Network   string
	Station   string
	Channel   string
	Location  string
	Level     string // "network", "station", or "channel"
	StartTime string
	EndTime   string
	MinLat    string
	MaxLat    string
	MinLon    string
	MaxLon    string
}

// QueryStations fetches station-level data in text format from an external FDSN source.
func (c *Client) QueryStations(q StationQuery) ([]StationTextRow, error) {
	path := buildStationPath(q, "station")
	body, err := c.get(path)
	if err != nil {
		return nil, err
	}
	if body == nil {
		return nil, nil
	}
	defer body.Close()
	return parseStationText(body)
}

// QueryChannels fetches channel-level data in text format from an external FDSN source.
func (c *Client) QueryChannels(q StationQuery) ([]ChannelTextRow, error) {
	q.Level = "channel"
	path := buildStationPath(q, "channel")
	body, err := c.get(path)
	if err != nil {
		return nil, err
	}
	if body == nil {
		return nil, nil
	}
	defer body.Close()
	return parseChannelText(body)
}

func buildStationPath(q StationQuery, level string) string {
	params := url.Values{}
	params.Set("format", "text")
	params.Set("level", level)
	if q.Network != "" {
		params.Set("net", q.Network)
	}
	if q.Station != "" {
		params.Set("sta", q.Station)
	}
	if q.Channel != "" {
		params.Set("cha", q.Channel)
	}
	if q.Location != "" {
		params.Set("loc", q.Location)
	}
	if q.StartTime != "" {
		params.Set("starttime", q.StartTime)
	}
	if q.EndTime != "" {
		params.Set("endtime", q.EndTime)
	}
	if q.MinLat != "" {
		params.Set("minlat", q.MinLat)
	}
	if q.MaxLat != "" {
		params.Set("maxlat", q.MaxLat)
	}
	if q.MinLon != "" {
		params.Set("minlon", q.MinLon)
	}
	if q.MaxLon != "" {
		params.Set("maxlon", q.MaxLon)
	}
	return "/fdsnws/station/1/query?" + params.Encode()
}

// parseStationText parses the FDSN text format for station-level responses.
// Format: Network|Station|Latitude|Longitude|Elevation|SiteName|StartTime|EndTime
func parseStationText(r io.Reader) ([]StationTextRow, error) {
	scanner := bufio.NewScanner(r)
	var rows []StationTextRow
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" || line[0] == '#' {
			continue
		}
		fields := strings.Split(line, "|")
		if len(fields) < 6 {
			continue
		}
		lat, _ := strconv.ParseFloat(strings.TrimSpace(fields[2]), 64)
		lon, _ := strconv.ParseFloat(strings.TrimSpace(fields[3]), 64)
		elev, _ := strconv.ParseFloat(strings.TrimSpace(fields[4]), 64)

		row := StationTextRow{
			Network:   strings.TrimSpace(fields[0]),
			Station:   strings.TrimSpace(fields[1]),
			Latitude:  lat,
			Longitude: lon,
			Elevation: elev,
			SiteName:  strings.TrimSpace(fields[5]),
		}
		if len(fields) > 6 {
			row.StartTime = parseTime(strings.TrimSpace(fields[6]))
		}
		if len(fields) > 7 {
			row.EndTime = parseTime(strings.TrimSpace(fields[7]))
		}
		rows = append(rows, row)
	}
	return rows, scanner.Err()
}

// parseChannelText parses the FDSN text format for channel-level responses.
// Format: Network|Station|Location|Channel|Latitude|Longitude|Elevation|Depth|Azimuth|Dip|SensorDescription|Scale|ScaleFreq|ScaleUnits|SampleRate|StartTime|EndTime
func parseChannelText(r io.Reader) ([]ChannelTextRow, error) {
	scanner := bufio.NewScanner(r)
	var rows []ChannelTextRow
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" || line[0] == '#' {
			continue
		}
		fields := strings.Split(line, "|")
		if len(fields) < 15 {
			continue
		}

		row := ChannelTextRow{
			Network:  strings.TrimSpace(fields[0]),
			Station:  strings.TrimSpace(fields[1]),
			Location: strings.TrimSpace(fields[2]),
			Channel:  strings.TrimSpace(fields[3]),
		}
		row.Latitude, _ = strconv.ParseFloat(strings.TrimSpace(fields[4]), 64)
		row.Longitude, _ = strconv.ParseFloat(strings.TrimSpace(fields[5]), 64)
		row.Elevation, _ = strconv.ParseFloat(strings.TrimSpace(fields[6]), 64)
		row.Depth, _ = strconv.ParseFloat(strings.TrimSpace(fields[7]), 64)
		row.Azimuth, _ = strconv.ParseFloat(strings.TrimSpace(fields[8]), 64)
		row.Dip, _ = strconv.ParseFloat(strings.TrimSpace(fields[9]), 64)
		row.SensorDescription = strings.TrimSpace(fields[10])
		row.Scale, _ = strconv.ParseFloat(strings.TrimSpace(fields[11]), 64)
		row.ScaleFreq, _ = strconv.ParseFloat(strings.TrimSpace(fields[12]), 64)
		row.ScaleUnits = strings.TrimSpace(fields[13])
		row.SampleRate, _ = strconv.ParseFloat(strings.TrimSpace(fields[14]), 64)
		if len(fields) > 15 {
			row.StartTime = parseTime(strings.TrimSpace(fields[15]))
		}
		if len(fields) > 16 {
			row.EndTime = parseTime(strings.TrimSpace(fields[16]))
		}
		rows = append(rows, row)
	}
	return rows, scanner.Err()
}

func parseTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	formats := []string{
		"2006-01-02T15:04:05",
		"2006-01-02T15:04:05.000",
		"2006-01-02T15:04:05.0000",
		time.RFC3339,
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return &t
		}
	}
	// Try trimming trailing zeroes and parsing again
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	for _, f := range formats[:2] {
		if t, err := time.Parse(f, s); err == nil {
			return &t
		}
	}
	return nil
}

// FormatTime formats a time value for FDSN text output.
func FormatTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02T15:04:05")
}

// FormatTimeOrEmpty returns a formatted time or empty string.
func FormatTimeOrEmpty(t *time.Time) string {
	if t == nil || t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02T15:04:05")
}

// FormatFloat formats a float for output, returning empty string for zero.
func FormatFloat(f float64) string {
	return fmt.Sprintf("%.6f", f)
}
