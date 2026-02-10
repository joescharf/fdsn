package fdsnserver

import (
	"net/http"
	"strings"
	"time"
)

// StationParams holds parsed FDSN station query parameters.
type StationParams struct {
	Network   []string
	Station   []string
	Location  []string
	Channel   []string
	StartTime *time.Time
	EndTime   *time.Time
	Level     string // "network", "station", "channel", "response"
	Format    string // "text", "xml"
	MinLat    *float64
	MaxLat    *float64
	MinLon    *float64
	MaxLon    *float64
}

// ParseStationParams extracts FDSN station parameters from an HTTP request.
func ParseStationParams(r *http.Request) StationParams {
	q := r.URL.Query()

	p := StationParams{
		Level:  q.Get("level"),
		Format: q.Get("format"),
	}

	if p.Level == "" {
		p.Level = "station"
	}
	if p.Format == "" {
		p.Format = "xml"
	}

	if v := q.Get("net"); v != "" {
		p.Network = splitCSV(v)
	}
	if v := q.Get("network"); v != "" {
		p.Network = splitCSV(v)
	}
	if v := q.Get("sta"); v != "" {
		p.Station = splitCSV(v)
	}
	if v := q.Get("station"); v != "" {
		p.Station = splitCSV(v)
	}
	if v := q.Get("loc"); v != "" {
		p.Location = splitCSV(v)
	}
	if v := q.Get("location"); v != "" {
		p.Location = splitCSV(v)
	}
	if v := q.Get("cha"); v != "" {
		p.Channel = splitCSV(v)
	}
	if v := q.Get("channel"); v != "" {
		p.Channel = splitCSV(v)
	}

	p.StartTime = parseOptionalTime(q.Get("starttime"))
	if p.StartTime == nil {
		p.StartTime = parseOptionalTime(q.Get("start"))
	}
	p.EndTime = parseOptionalTime(q.Get("endtime"))
	if p.EndTime == nil {
		p.EndTime = parseOptionalTime(q.Get("end"))
	}

	p.MinLat = parseOptionalFloat(q.Get("minlat"))
	p.MaxLat = parseOptionalFloat(q.Get("maxlat"))
	p.MinLon = parseOptionalFloat(q.Get("minlon"))
	p.MaxLon = parseOptionalFloat(q.Get("maxlon"))

	return p
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

func parseOptionalTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02",
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return &t
		}
	}
	return nil
}

func parseOptionalFloat(s string) *float64 {
	if s == "" {
		return nil
	}
	var f float64
	negative := false
	decimal := false
	divisor := 1.0
	for _, c := range s {
		if c == '-' {
			negative = true
		} else if c == '.' {
			decimal = true
		} else if c >= '0' && c <= '9' {
			if decimal {
				divisor *= 10
				f += float64(c-'0') / divisor
			} else {
				f = f*10 + float64(c-'0')
			}
		}
	}
	if negative {
		f = -f
	}
	return &f
}

// matchWildcard checks if a string matches a simple wildcard pattern (* and ?).
func matchWildcard(pattern, s string) bool {
	if pattern == "*" || pattern == "" {
		return true
	}
	// Simple implementation supporting * at start/end
	if strings.Contains(pattern, "*") {
		parts := strings.Split(pattern, "*")
		if len(parts) == 2 {
			return strings.HasPrefix(s, parts[0]) && strings.HasSuffix(s, parts[1])
		}
	}
	if strings.Contains(pattern, "?") {
		if len(pattern) != len(s) {
			return false
		}
		for i := 0; i < len(pattern); i++ {
			if pattern[i] != '?' && pattern[i] != s[i] {
				return false
			}
		}
		return true
	}
	return pattern == s
}

// matchAny checks if value matches any of the patterns.
func matchAny(patterns []string, value string) bool {
	if len(patterns) == 0 {
		return true
	}
	for _, p := range patterns {
		if matchWildcard(p, value) {
			return true
		}
	}
	return false
}
