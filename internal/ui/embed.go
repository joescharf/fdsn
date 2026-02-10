package ui

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

//go:embed all:dist
var distFS embed.FS

// DistFS returns the embedded dist/ filesystem with the "dist" prefix stripped.
func DistFS() (fs.FS, error) {
	return fs.Sub(distFS, "dist")
}

// Handler returns an http.Handler that serves the embedded UI with SPA fallback.
// Static files are served directly. Paths without a file extension are treated as
// client-side routes and served index.html. Missing assets return 404.
func Handler() (http.Handler, error) {
	sub, err := DistFS()
	if err != nil {
		return nil, err
	}

	fileServer := http.FileServerFS(sub)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Clean the path
		p := path.Clean(r.URL.Path)
		if p == "/" {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Strip leading slash for fs operations
		p = strings.TrimPrefix(p, "/")

		// Check if the file exists in the embedded FS
		_, err := fs.Stat(sub, p)
		if err == nil {
			// File exists, serve it directly
			fileServer.ServeHTTP(w, r)
			return
		}

		// File doesn't exist — check if it looks like a static asset
		if strings.Contains(p, ".") {
			// Has extension (e.g. .js, .css, .png) — genuine missing asset
			http.NotFound(w, r)
			return
		}

		// No extension — treat as SPA client-side route, serve index.html
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	}), nil
}
