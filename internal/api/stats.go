package api

import (
	"net/http"

	"github.com/joescharf/fdsn/internal/store"
)

type statsHandler struct {
	store store.StatsStore
}

func (h *statsHandler) get(w http.ResponseWriter, r *http.Request) {
	stats, err := h.store.GetStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, stats)
}
