package fdsnserver

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/joescharf/fdsn/internal/models"
)

type stationHandler struct {
	db *sqlx.DB
}

func (h *stationHandler) query(w http.ResponseWriter, r *http.Request) {
	params := ParseStationParams(r)

	switch params.Format {
	case "text":
		h.queryText(w, params)
	case "xml":
		h.queryXML(w, params)
	default:
		http.Error(w, "Unsupported format", http.StatusBadRequest)
	}
}

func (h *stationHandler) queryText(w http.ResponseWriter, p StationParams) {
	w.Header().Set("Content-Type", "text/plain")

	switch p.Level {
	case "network":
		h.queryTextNetworks(w, p)
	case "station":
		h.queryTextStations(w, p)
	case "channel":
		h.queryTextChannels(w, p)
	default:
		h.queryTextStations(w, p)
	}
}

func (h *stationHandler) queryTextNetworks(w http.ResponseWriter, p StationParams) {
	rows, err := h.db.Queryx(`SELECT DISTINCT n.code, n.description, n.start_time, n.end_time
		FROM networks n ORDER BY n.code`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Fprintln(w, "#Network|Description|StartTime|EndTime|TotalStations")
	for rows.Next() {
		var code, desc string
		var start, end *time.Time
		rows.Scan(&code, &desc, &start, &end)
		if !matchAny(p.Network, code) {
			continue
		}
		// Count stations
		var count int
		h.db.Get(&count, "SELECT COUNT(*) FROM stations s JOIN networks n ON s.network_id = n.id WHERE n.code = ?", code)
		fmt.Fprintf(w, "%s|%s|%s|%s|%d\n",
			code, desc, formatTime(start), formatTime(end), count)
	}
}

func (h *stationHandler) queryTextStations(w http.ResponseWriter, p StationParams) {
	type row struct {
		Network   string     `db:"network_code"`
		Station   string     `db:"code"`
		Latitude  float64    `db:"latitude"`
		Longitude float64    `db:"longitude"`
		Elevation float64    `db:"elevation"`
		SiteName  string     `db:"site_name"`
		StartTime *time.Time `db:"start_time"`
		EndTime   *time.Time `db:"end_time"`
	}

	var rows []row
	err := h.db.Select(&rows, `SELECT n.code AS network_code, s.code, s.latitude, s.longitude, s.elevation, s.site_name, s.start_time, s.end_time
		FROM stations s JOIN networks n ON s.network_id = n.id
		ORDER BY n.code, s.code`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, "#Network|Station|Latitude|Longitude|Elevation|SiteName|StartTime|EndTime")
	for _, r := range rows {
		if !matchAny(p.Network, r.Network) || !matchAny(p.Station, r.Station) {
			continue
		}
		if p.MinLat != nil && r.Latitude < *p.MinLat {
			continue
		}
		if p.MaxLat != nil && r.Latitude > *p.MaxLat {
			continue
		}
		if p.MinLon != nil && r.Longitude < *p.MinLon {
			continue
		}
		if p.MaxLon != nil && r.Longitude > *p.MaxLon {
			continue
		}
		fmt.Fprintf(w, "%s|%s|%.6f|%.6f|%.1f|%s|%s|%s\n",
			r.Network, r.Station, r.Latitude, r.Longitude, r.Elevation,
			r.SiteName, formatTime(r.StartTime), formatTime(r.EndTime))
	}
}

func (h *stationHandler) queryTextChannels(w http.ResponseWriter, p StationParams) {
	type row struct {
		Network     string     `db:"network_code"`
		Station     string     `db:"station_code"`
		Location    string     `db:"location_code"`
		Channel     string     `db:"channel_code"`
		Latitude    float64    `db:"latitude"`
		Longitude   float64    `db:"longitude"`
		Elevation   float64    `db:"elevation"`
		Depth       float64    `db:"depth"`
		Azimuth     float64    `db:"azimuth"`
		Dip         float64    `db:"dip"`
		Sensor      string     `db:"sensor_description"`
		Scale       float64    `db:"scale"`
		ScaleFreq   float64    `db:"scale_freq"`
		ScaleUnits  string     `db:"scale_units"`
		SampleRate  float64    `db:"sample_rate"`
		StartTime   *time.Time `db:"start_time"`
		EndTime     *time.Time `db:"end_time"`
	}

	var rows []row
	err := h.db.Select(&rows, `SELECT n.code AS network_code, s.code AS station_code,
		c.location_code, c.code AS channel_code,
		c.latitude, c.longitude, c.elevation, c.depth,
		c.azimuth, c.dip, c.sensor_description, c.scale, c.scale_freq, c.scale_units, c.sample_rate,
		c.start_time, c.end_time
		FROM channels c
		JOIN stations s ON c.station_id = s.id
		JOIN networks n ON s.network_id = n.id
		ORDER BY n.code, s.code, c.location_code, c.code`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, "#Network|Station|Location|Channel|Latitude|Longitude|Elevation|Depth|Azimuth|Dip|SensorDescription|Scale|ScaleFreq|ScaleUnits|SampleRate|StartTime|EndTime")
	for _, r := range rows {
		if !matchAny(p.Network, r.Network) || !matchAny(p.Station, r.Station) {
			continue
		}
		if !matchAny(p.Channel, r.Channel) || !matchAny(p.Location, r.Location) {
			continue
		}
		fmt.Fprintf(w, "%s|%s|%s|%s|%.6f|%.6f|%.1f|%.1f|%.1f|%.1f|%s|%.4e|%.4f|%s|%.1f|%s|%s\n",
			r.Network, r.Station, r.Location, r.Channel,
			r.Latitude, r.Longitude, r.Elevation, r.Depth,
			r.Azimuth, r.Dip, r.Sensor,
			r.Scale, r.ScaleFreq, r.ScaleUnits, r.SampleRate,
			formatTime(r.StartTime), formatTime(r.EndTime))
	}
}

func (h *stationHandler) queryXML(w http.ResponseWriter, p StationParams) {
	// Build StationXML from database
	stationXML := models.FDSNStationXML{
		XMLNS:     "http://www.fdsn.org/xml/station/1",
		SchemaVer: "1.1",
		Source:    "BRTT FDSN Portal",
		Sender:    "BRTT",
		Created:   time.Now().UTC().Format(time.RFC3339),
	}

	// Get networks
	type netRow struct {
		ID          int64      `db:"id"`
		Code        string     `db:"code"`
		Description string     `db:"description"`
		StartTime   *time.Time `db:"start_time"`
		EndTime     *time.Time `db:"end_time"`
	}
	var nets []netRow
	h.db.Select(&nets, "SELECT id, code, description, start_time, end_time FROM networks ORDER BY code")

	for _, n := range nets {
		if !matchAny(p.Network, n.Code) {
			continue
		}

		xmlNet := models.XMLNetwork{
			Code:        n.Code,
			Description: n.Description,
			StartDate:   formatTime(n.StartTime),
			EndDate:     formatTime(n.EndTime),
		}

		if p.Level == "station" || p.Level == "channel" || p.Level == "response" {
			type staRow struct {
				ID        int64      `db:"id"`
				Code      string     `db:"code"`
				Lat       float64    `db:"latitude"`
				Lon       float64    `db:"longitude"`
				Elev      float64    `db:"elevation"`
				SiteName  string     `db:"site_name"`
				StartTime *time.Time `db:"start_time"`
				EndTime   *time.Time `db:"end_time"`
			}
			var stas []staRow
			h.db.Select(&stas, "SELECT id, code, latitude, longitude, elevation, site_name, start_time, end_time FROM stations WHERE network_id = ? ORDER BY code", n.ID)

			for _, s := range stas {
				if !matchAny(p.Station, s.Code) {
					continue
				}

				xmlSta := models.XMLStation{
					Code:      s.Code,
					StartDate: formatTime(s.StartTime),
					EndDate:   formatTime(s.EndTime),
					Latitude:  models.XMLValue{Value: s.Lat},
					Longitude: models.XMLValue{Value: s.Lon},
					Elevation: models.XMLValue{Value: s.Elev},
					Site:      models.XMLSite{Name: s.SiteName},
				}

				if p.Level == "channel" || p.Level == "response" {
					type chRow struct {
						Code         string     `db:"code"`
						LocationCode string     `db:"location_code"`
						Lat          float64    `db:"latitude"`
						Lon          float64    `db:"longitude"`
						Elev         float64    `db:"elevation"`
						Depth        float64    `db:"depth"`
						Azimuth      float64    `db:"azimuth"`
						Dip          float64    `db:"dip"`
						Sensor       string     `db:"sensor_description"`
						SampleRate   float64    `db:"sample_rate"`
						StartTime    *time.Time `db:"start_time"`
						EndTime      *time.Time `db:"end_time"`
					}
					var chs []chRow
					h.db.Select(&chs, "SELECT code, location_code, latitude, longitude, elevation, depth, azimuth, dip, sensor_description, sample_rate, start_time, end_time FROM channels WHERE station_id = ? ORDER BY location_code, code", s.ID)

					for _, c := range chs {
						if !matchAny(p.Channel, c.Code) || !matchAny(p.Location, c.LocationCode) {
							continue
						}

						xmlCh := models.XMLChannel{
							Code:         c.Code,
							LocationCode: c.LocationCode,
							StartDate:    formatTime(c.StartTime),
							EndDate:      formatTime(c.EndTime),
							Latitude:     models.XMLValue{Value: c.Lat},
							Longitude:    models.XMLValue{Value: c.Lon},
							Elevation:    models.XMLValue{Value: c.Elev},
							Depth:        models.XMLValue{Value: c.Depth},
							Azimuth:      models.XMLValue{Value: c.Azimuth},
							Dip:          models.XMLValue{Value: c.Dip},
							SampleRate:   c.SampleRate,
						}
						if c.Sensor != "" {
							xmlCh.Sensor = &models.XMLSensor{Description: c.Sensor}
						}
						xmlSta.Channels = append(xmlSta.Channels, xmlCh)
					}
				}

				xmlNet.Stations = append(xmlNet.Stations, xmlSta)
			}
		}

		stationXML.Networks = append(stationXML.Networks, xmlNet)
	}

	w.Header().Set("Content-Type", "application/xml")
	w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	enc.Encode(stationXML)
}

func (h *stationHandler) version(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, "1.1.0")
}

func formatTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02T15:04:05")
}
