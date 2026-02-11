package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/joescharf/fdsn/internal/models"
	"github.com/joescharf/fdsn/internal/store"
)

type sourcesHandler struct {
	store store.SourceStore
}

func (h *sourcesHandler) list(w http.ResponseWriter, r *http.Request) {
	sources, err := h.store.ListWithStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if sources == nil {
		sources = []models.SourceSummary{}
	}
	writeJSON(w, http.StatusOK, sources)
}

func (h *sourcesHandler) get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	src, err := h.store.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "source not found")
		return
	}
	writeJSON(w, http.StatusOK, src)
}

func (h *sourcesHandler) create(w http.ResponseWriter, r *http.Request) {
	var src models.Source
	if err := json.NewDecoder(r.Body).Decode(&src); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if src.Name == "" || src.BaseURL == "" {
		writeError(w, http.StatusBadRequest, "name and base_url are required")
		return
	}
	if err := h.store.Create(&src); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, src)
}

func (h *sourcesHandler) update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var src models.Source
	if err := json.NewDecoder(r.Body).Decode(&src); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	src.ID = id
	if err := h.store.Update(&src); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, src)
}

func (h *sourcesHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.store.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
