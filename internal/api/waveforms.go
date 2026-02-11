package api

import (
	"io"
	"net/http"

	"github.com/joescharf/fdsn/internal/fdsnclient"
	"github.com/joescharf/fdsn/internal/store"
)

type waveformsHandler struct {
	sourceStore store.SourceStore
}

// proxy streams miniSEED data from an external FDSN source.
// Query params: source_id, net, sta, loc, cha, starttime, endtime
func (h *waveformsHandler) proxy(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	sourceID := q.Get("source_id")
	if sourceID == "" {
		writeError(w, http.StatusBadRequest, "source_id is required")
		return
	}

	src, err := h.sourceStore.Get(parseInt64(sourceID))
	if err != nil {
		writeError(w, http.StatusNotFound, "source not found")
		return
	}

	net := q.Get("net")
	sta := q.Get("sta")
	loc := q.Get("loc")
	cha := q.Get("cha")
	starttime := q.Get("starttime")
	endtime := q.Get("endtime")

	if net == "" || sta == "" || cha == "" || starttime == "" || endtime == "" {
		writeError(w, http.StatusBadRequest, "net, sta, cha, starttime, endtime are required")
		return
	}

	client := fdsnclient.New(src.BaseURL)
	body, err := client.FetchMiniSEED(net, sta, loc, cha, starttime, endtime)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if body == nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	defer body.Close()

	w.Header().Set("Content-Type", "application/vnd.fdsn.mseed")
	w.Header().Set("Content-Disposition", "inline")
	_, _ = io.Copy(w, body)
}

func parseInt64(s string) int64 {
	var n int64
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int64(c-'0')
		}
	}
	return n
}
