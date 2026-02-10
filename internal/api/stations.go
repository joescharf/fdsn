package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/joescharf/fdsn/internal/store"
)

type stationsHandler struct {
	store      store.StationStore
	availStore store.AvailabilityStore
}

func (h *stationsHandler) list(w http.ResponseWriter, r *http.Request) {
	network := r.URL.Query().Get("network")
	station := r.URL.Query().Get("station")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 1000 {
		limit = 100
	}

	stations, total, err := h.store.ListStations(network, station, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"stations": stations,
		"total":    total,
	})
}

func (h *stationsHandler) get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	detail, err := h.store.GetStation(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "station not found")
		return
	}
	if h.availStore != nil {
		avail, err := h.availStore.GetByStationID(id)
		if err == nil {
			detail.Availability = avail
		}
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *stationsHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.store.DeleteStation(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type networksHandler struct {
	store store.StationStore
}

func (h *stationsHandler) listNetworksBySource(w http.ResponseWriter, r *http.Request) {
	sourceID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	networks, err := h.store.ListNetworksBySource(sourceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, networks)
}

func (h *stationsHandler) listStationsBySource(w http.ResponseWriter, r *http.Request) {
	sourceID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	network := r.URL.Query().Get("network")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 1000 {
		limit = 100
	}

	stations, total, err := h.store.ListStationsBySource(sourceID, network, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"stations": stations,
		"total":    total,
	})
}

func (h *networksHandler) list(w http.ResponseWriter, r *http.Request) {
	networks, err := h.store.ListNetworks()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, networks)
}
