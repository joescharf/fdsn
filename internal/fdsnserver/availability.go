package fdsnserver

import (
	"fmt"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
)

type availabilityHandler struct {
	db *sqlx.DB
}

func (h *availabilityHandler) query(w http.ResponseWriter, r *http.Request) {
	p := ParseStationParams(r)
	w.Header().Set("Content-Type", "text/plain")

	type row struct {
		Network  string    `db:"network_code"`
		Station  string    `db:"station_code"`
		Location string    `db:"location_code"`
		Channel  string    `db:"channel_code"`
		Earliest time.Time `db:"earliest"`
		Latest   time.Time `db:"latest"`
	}

	var rows []row
	err := h.db.Select(&rows, `SELECT n.code AS network_code, s.code AS station_code,
		c.location_code, c.code AS channel_code, a.earliest, a.latest
		FROM availability a
		JOIN channels c ON a.channel_id = c.id
		JOIN stations s ON c.station_id = s.id
		JOIN networks n ON s.network_id = n.id
		ORDER BY n.code, s.code, c.location_code, c.code`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, "#Network|Station|Location|Channel|Earliest|Latest")
	for _, row := range rows {
		if !matchAny(p.Network, row.Network) || !matchAny(p.Station, row.Station) {
			continue
		}
		if !matchAny(p.Channel, row.Channel) || !matchAny(p.Location, row.Location) {
			continue
		}
		fmt.Fprintf(w, "%s|%s|%s|%s|%s|%s\n",
			row.Network, row.Station, row.Location, row.Channel,
			row.Earliest.Format("2006-01-02T15:04:05"),
			row.Latest.Format("2006-01-02T15:04:05"))
	}
}

func (h *availabilityHandler) extent(w http.ResponseWriter, r *http.Request) {
	p := ParseStationParams(r)
	w.Header().Set("Content-Type", "text/plain")

	type row struct {
		Network  string    `db:"network_code"`
		Station  string    `db:"station_code"`
		Location string    `db:"location_code"`
		Channel  string    `db:"channel_code"`
		Earliest time.Time `db:"earliest"`
		Latest   time.Time `db:"latest"`
	}

	var rows []row
	err := h.db.Select(&rows, `SELECT n.code AS network_code, s.code AS station_code,
		c.location_code, c.code AS channel_code,
		MIN(a.earliest) AS earliest, MAX(a.latest) AS latest
		FROM availability a
		JOIN channels c ON a.channel_id = c.id
		JOIN stations s ON c.station_id = s.id
		JOIN networks n ON s.network_id = n.id
		GROUP BY n.code, s.code, c.location_code, c.code
		ORDER BY n.code, s.code, c.location_code, c.code`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, "#Network|Station|Location|Channel|Earliest|Latest")
	for _, row := range rows {
		if !matchAny(p.Network, row.Network) || !matchAny(p.Station, row.Station) {
			continue
		}
		fmt.Fprintf(w, "%s|%s|%s|%s|%s|%s\n",
			row.Network, row.Station, row.Location, row.Channel,
			row.Earliest.Format("2006-01-02T15:04:05"),
			row.Latest.Format("2006-01-02T15:04:05"))
	}
}

func (h *availabilityHandler) version(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, "1.0.0")
}
