package fdsnclient

import (
	"strings"
	"testing"
)

func TestParseStationText(t *testing.T) {
	data := `#Network|Station|Latitude|Longitude|Elevation|SiteName|StartTime|EndTime
IU|ANMO|34.9459|-106.4572|1850.0|Albuquerque, New Mexico, USA|1989-08-29T00:00:00|
IU|HRV|42.5064|-71.5583|200.0|Adam Dziewonski Observatory, Harvard, MA, USA|1988-01-01T00:00:00|`

	rows, err := parseStationText(strings.NewReader(data))
	if err != nil {
		t.Fatalf("parseStationText: %v", err)
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
	if r.Latitude != 34.9459 {
		t.Errorf("latitude: got %f, want 34.9459", r.Latitude)
	}
	if r.SiteName != "Albuquerque, New Mexico, USA" {
		t.Errorf("site_name: got %q", r.SiteName)
	}
}

func TestParseChannelText(t *testing.T) {
	data := `#Network|Station|Location|Channel|Latitude|Longitude|Elevation|Depth|Azimuth|Dip|SensorDescription|Scale|ScaleFreq|ScaleUnits|SampleRate|StartTime|EndTime
IU|ANMO|00|BHZ|34.9459|-106.4572|1850.0|100.0|0.0|-90.0|Streckeisen STS-6A VBB Seismometer|3.31283e+09|0.02|M/S|40.0|2018-07-09T18:50:00|
IU|ANMO|00|BH1|34.9459|-106.4572|1850.0|100.0|64.0|0.0|Streckeisen STS-6A VBB Seismometer|3.31283e+09|0.02|M/S|40.0|2018-07-09T18:50:00|`

	rows, err := parseChannelText(strings.NewReader(data))
	if err != nil {
		t.Fatalf("parseChannelText: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("expected 2 rows, got %d", len(rows))
	}

	r := rows[0]
	if r.Channel != "BHZ" {
		t.Errorf("channel: got %q, want BHZ", r.Channel)
	}
	if r.SampleRate != 40.0 {
		t.Errorf("sample_rate: got %f, want 40.0", r.SampleRate)
	}
	if r.Depth != 100.0 {
		t.Errorf("depth: got %f, want 100.0", r.Depth)
	}
}
