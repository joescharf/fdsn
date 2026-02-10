package fdsnserver

import (
	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
)

// NewRouter creates a chi sub-router for the /fdsnws/* FDSN-compliant endpoints.
func NewRouter(db *sqlx.DB) chi.Router {
	r := chi.NewRouter()

	station := &stationHandler{db: db}
	dataselect := &dataselectHandler{db: db}
	avail := &availabilityHandler{db: db}

	// Station service
	r.Route("/station/1", func(r chi.Router) {
		r.Get("/version", station.version)
		r.Get("/application.wadl", stationWADL)
		r.Get("/query", station.query)
		r.Post("/query", station.query)
	})

	// Dataselect service
	r.Route("/dataselect/1", func(r chi.Router) {
		r.Get("/version", dataselect.version)
		r.Get("/application.wadl", dataselectWADL)
		r.Get("/query", dataselect.query)
		r.Post("/query", dataselect.query)
	})

	// Availability service
	r.Route("/availability/1", func(r chi.Router) {
		r.Get("/version", avail.version)
		r.Get("/application.wadl", availabilityWADL)
		r.Get("/query", avail.query)
		r.Post("/query", avail.query)
		r.Get("/extent", avail.extent)
		r.Post("/extent", avail.extent)
	})

	return r
}
