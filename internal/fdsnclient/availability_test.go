package fdsnclient

import (
	"errors"
	"strings"
	"testing"
)

func TestParseAvailabilityExtent(t *testing.T) {
	data := `#Network|Station|Location|Channel|Quality|SampleRate|Earliest|Latest
IU|ANMO|00|BHZ|M|40.0|2020-01-01T00:00:00|2024-06-15T12:30:00
IU|ANMO|00|BH1|M|40.0|2020-01-01T00:00:00|2024-06-15T12:30:00
IU|ANMO|10|LHZ|D|1.0|2019-05-01T00:00:00|2024-06-14T23:59:59`

	rows, err := parseAvailabilityExtent(strings.NewReader(data))
	if err != nil {
		t.Fatalf("parseAvailabilityExtent: %v", err)
	}
	if len(rows) != 3 {
		t.Fatalf("expected 3 rows, got %d", len(rows))
	}

	r := rows[0]
	if r.Network != "IU" {
		t.Errorf("network: got %q, want IU", r.Network)
	}
	if r.Station != "ANMO" {
		t.Errorf("station: got %q, want ANMO", r.Station)
	}
	if r.Location != "00" {
		t.Errorf("location: got %q, want 00", r.Location)
	}
	if r.Channel != "BHZ" {
		t.Errorf("channel: got %q, want BHZ", r.Channel)
	}
	if r.Quality != "M" {
		t.Errorf("quality: got %q, want M", r.Quality)
	}
	if r.SampleRate != 40.0 {
		t.Errorf("sample_rate: got %f, want 40.0", r.SampleRate)
	}
	if r.Earliest == nil {
		t.Fatal("earliest is nil")
	}
	if r.Earliest.Year() != 2020 {
		t.Errorf("earliest year: got %d, want 2020", r.Earliest.Year())
	}
	if r.Latest == nil {
		t.Fatal("latest is nil")
	}
	if r.Latest.Year() != 2024 {
		t.Errorf("latest year: got %d, want 2024", r.Latest.Year())
	}
}

func TestParseAvailabilityExtentMinimal(t *testing.T) {
	// Only 8 columns, minimal whitespace (pipe-delimited)
	data := `IU|ANMO|00|BHZ|M|40.0|2020-01-01T00:00:00|2024-01-01T00:00:00`
	rows, err := parseAvailabilityExtent(strings.NewReader(data))
	if err != nil {
		t.Fatalf("parseAvailabilityExtent: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(rows))
	}
}

func TestParseAvailabilityExtentSpaceDelimited(t *testing.T) {
	// Real FDSN availability format is space-delimited with extra columns
	data := `#Network Station Location Channel Quality SampleRate Earliest Latest Updated TimeSpans Restriction
IU ANMO -- BC0 M 20.0 2004-11-22T18:56:51.535840Z 2006-04-20T02:17:46.398920Z 2017-11-22T21:42:07Z 15 OPEN
IU ANMO 00 BHZ M 40.0 2020-01-01T00:00:00Z 2024-06-15T12:30:00Z 2024-03-07T09:23:32Z 355 OPEN`

	rows, err := parseAvailabilityExtent(strings.NewReader(data))
	if err != nil {
		t.Fatalf("parseAvailabilityExtent: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 rows, got %d", len(rows))
	}

	r := rows[0]
	if r.Network != "IU" {
		t.Errorf("network: got %q, want IU", r.Network)
	}
	if r.Station != "ANMO" {
		t.Errorf("station: got %q, want ANMO", r.Station)
	}
	if r.Location != "--" {
		t.Errorf("location: got %q, want --", r.Location)
	}
	if r.Channel != "BC0" {
		t.Errorf("channel: got %q, want BC0", r.Channel)
	}
	if r.Earliest == nil {
		t.Fatal("earliest is nil")
	}
	if r.Earliest.Year() != 2004 {
		t.Errorf("earliest year: got %d, want 2004", r.Earliest.Year())
	}

	r2 := rows[1]
	if r2.Location != "00" {
		t.Errorf("location: got %q, want 00", r2.Location)
	}
	if r2.Channel != "BHZ" {
		t.Errorf("channel: got %q, want BHZ", r2.Channel)
	}
}

func TestParseAvailabilityExtentSkipsShortLines(t *testing.T) {
	data := `IU|ANMO|00|BHZ`
	rows, err := parseAvailabilityExtent(strings.NewReader(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rows) != 0 {
		t.Fatalf("expected 0 rows, got %d", len(rows))
	}
}

func TestIsNotSupported(t *testing.T) {
	tests := []struct {
		err  error
		want bool
	}{
		{nil, false},
		{errors.New("GET http://example.com: status 404: Not Found"), true},
		{errors.New("GET http://example.com: status 501: Not Implemented"), true},
		{errors.New("GET http://example.com: status 200: OK"), false},
		{errors.New("connection refused"), false},
	}
	for _, tt := range tests {
		got := IsNotSupported(tt.err)
		if got != tt.want {
			t.Errorf("IsNotSupported(%v) = %v, want %v", tt.err, got, tt.want)
		}
	}
}

func TestBuildAvailabilityPath(t *testing.T) {
	q := AvailabilityQuery{Network: "IU", Station: "ANMO"}
	path := buildAvailabilityPath(q)
	if !strings.Contains(path, "/fdsnws/availability/1/extent?") {
		t.Errorf("path missing base: %s", path)
	}
	if !strings.Contains(path, "net=IU") {
		t.Errorf("path missing net param: %s", path)
	}
	if !strings.Contains(path, "sta=ANMO") {
		t.Errorf("path missing sta param: %s", path)
	}
	if !strings.Contains(path, "format=text") {
		t.Errorf("path missing format param: %s", path)
	}
}
