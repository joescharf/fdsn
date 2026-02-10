package fdsnclient

import (
	"bufio"
	"io"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// AvailabilityExtent represents one row from an FDSN availability extent response.
type AvailabilityExtent struct {
	Network    string
	Station    string
	Location   string
	Channel    string
	Quality    string
	SampleRate float64
	Earliest   *time.Time
	Latest     *time.Time
}

// AvailabilityQuery holds query parameters for the FDSN availability service.
type AvailabilityQuery struct {
	Network  string
	Station  string
	Channel  string
	Location string
}

// QueryAvailabilityExtent fetches availability extents from an external FDSN source.
func (c *Client) QueryAvailabilityExtent(q AvailabilityQuery) ([]AvailabilityExtent, error) {
	path := buildAvailabilityPath(q)
	body, err := c.get(path)
	if err != nil {
		return nil, err
	}
	if body == nil {
		return nil, nil
	}
	defer body.Close()
	return parseAvailabilityExtent(body)
}

func buildAvailabilityPath(q AvailabilityQuery) string {
	params := url.Values{}
	params.Set("format", "text")
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
	return "/fdsnws/availability/1/extent?" + params.Encode()
}

// parseAvailabilityExtent parses the FDSN text format for availability extent responses.
// Format: #Network|Station|Location|Channel|Quality|SampleRate|Earliest|Latest
func parseAvailabilityExtent(r io.Reader) ([]AvailabilityExtent, error) {
	scanner := bufio.NewScanner(r)
	var rows []AvailabilityExtent
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" || line[0] == '#' {
			continue
		}
		fields := strings.Split(line, "|")
		if len(fields) < 8 {
			continue
		}

		sampleRate, _ := strconv.ParseFloat(strings.TrimSpace(fields[5]), 64)

		row := AvailabilityExtent{
			Network:    strings.TrimSpace(fields[0]),
			Station:    strings.TrimSpace(fields[1]),
			Location:   strings.TrimSpace(fields[2]),
			Channel:    strings.TrimSpace(fields[3]),
			Quality:    strings.TrimSpace(fields[4]),
			SampleRate: sampleRate,
			Earliest:   parseTime(strings.TrimSpace(fields[6])),
			Latest:     parseTime(strings.TrimSpace(fields[7])),
		}
		rows = append(rows, row)
	}
	return rows, scanner.Err()
}
