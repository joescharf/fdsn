package api

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jmoiron/sqlx"
	"github.com/rs/cors"
	"github.com/rs/zerolog/log"

	"github.com/joescharf/fdsn/internal/fdsnserver"
	"github.com/joescharf/fdsn/internal/store"
	"github.com/joescharf/fdsn/internal/ui"
)

// NewRouter builds the top-level chi router with all API routes and the SPA handler.
func NewRouter(db *sqlx.DB) (http.Handler, error) {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(zerologMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: false,
		MaxAge:           300,
	})
	r.Use(c.Handler)

	// Stores
	srcStore := store.NewSourceStore(db)
	staStore := store.NewStationStore(db)
	availStore := store.NewAvailabilityStore(db)
	statsStore := store.NewStatsStore(db)

	// Handlers
	sources := &sourcesHandler{store: srcStore}
	explore := &exploreHandler{sourceStore: srcStore}
	imp := &importHandler{sourceStore: srcStore, stationStore: staStore, availabilityStore: availStore}
	stations := &stationsHandler{store: staStore, availStore: availStore}
	networks := &networksHandler{store: staStore}
	stats := &statsHandler{store: statsStore}
	waveforms := &waveformsHandler{sourceStore: srcStore}
	avail := &availabilityHandler{store: availStore}

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler)

		// Sources CRUD
		r.Get("/sources", sources.list)
		r.Post("/sources", sources.create)
		r.Get("/sources/{id}", sources.get)
		r.Put("/sources/{id}", sources.update)
		r.Delete("/sources/{id}", sources.delete)

		// Explore external FDSN sources
		r.Get("/sources/{id}/explore/stations", explore.stations)

		// Source-filtered endpoints
		r.Get("/sources/{id}/networks", stations.listNetworksBySource)
		r.Get("/sources/{id}/stations", stations.listStationsBySource)

		// Import
		r.Post("/import/stations", imp.importStations)

		// Stations
		r.Get("/stations", stations.list)
		r.Get("/stations/{id}", stations.get)
		r.Delete("/stations/{id}", stations.delete)

		// Availability
		r.Get("/stations/{id}/availability", avail.getByStation)

		// Networks
		r.Get("/networks", networks.list)

		// Waveforms
		r.Get("/waveforms/proxy", waveforms.proxy)

		// Stats
		r.Get("/stats", stats.get)
	})

	// FDSN-compliant endpoints
	r.Mount("/fdsnws", fdsnserver.NewRouter(db))

	// SPA handler — serves embedded UI for everything else
	spaHandler, err := ui.Handler()
	if err != nil {
		return nil, err
	}
	r.NotFound(spaHandler.ServeHTTP)

	return r, nil
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// zerologMiddleware logs each request using zerolog.
func zerologMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		log.Debug().
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("status", ww.Status()).
			Dur("duration", time.Since(start)).
			Msg("request")
	})
}
