package fdsnserver

import (
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/jmoiron/sqlx"
)

type dataselectHandler struct {
	db *sqlx.DB
}

func (h *dataselectHandler) query(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	net := q.Get("net")
	sta := q.Get("sta")
	loc := q.Get("loc")
	cha := q.Get("cha")
	starttime := q.Get("starttime")
	endtime := q.Get("endtime")

	if net == "" || sta == "" || cha == "" || starttime == "" || endtime == "" {
		http.Error(w, "net, sta, cha, starttime, endtime are required", http.StatusBadRequest)
		return
	}

	// Look up the source's base URL for the network
	var baseURL string
	err := h.db.Get(&baseURL, `SELECT sr.base_url FROM sources sr
		JOIN networks n ON n.source_id = sr.id
		WHERE n.code = ? LIMIT 1`, net)
	if err != nil {
		http.Error(w, "Network source not found", http.StatusNotFound)
		return
	}

	// Proxy to upstream
	params := url.Values{}
	params.Set("net", net)
	params.Set("sta", sta)
	if loc != "" {
		params.Set("loc", loc)
	}
	params.Set("cha", cha)
	params.Set("starttime", starttime)
	params.Set("endtime", endtime)

	upstream := baseURL + "/fdsnws/dataselect/1/query?" + params.Encode()
	resp, err := http.Get(upstream)
	if err != nil {
		http.Error(w, fmt.Sprintf("upstream error: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/vnd.fdsn.mseed")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *dataselectHandler) version(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, "1.1.0")
}
