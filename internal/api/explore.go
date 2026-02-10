package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/joescharf/fdsn/internal/fdsnclient"
	"github.com/joescharf/fdsn/internal/store"
)

type exploreHandler struct {
	sourceStore store.SourceStore
}

func (h *exploreHandler) stations(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid source id")
		return
	}
	src, err := h.sourceStore.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "source not found")
		return
	}

	q := fdsnclient.StationQuery{
		Network:  r.URL.Query().Get("net"),
		Station:  r.URL.Query().Get("sta"),
		Channel:  r.URL.Query().Get("cha"),
		Location: r.URL.Query().Get("loc"),
		MinLat:   r.URL.Query().Get("minlat"),
		MaxLat:   r.URL.Query().Get("maxlat"),
		MinLon:   r.URL.Query().Get("minlon"),
		MaxLon:   r.URL.Query().Get("maxlon"),
	}

	client := fdsnclient.New(src.BaseURL)
	stations, err := client.QueryStations(q)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if stations == nil {
		stations = []fdsnclient.StationTextRow{}
	}
	writeJSON(w, http.StatusOK, stations)
}
