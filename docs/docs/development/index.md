# Development

This guide covers setting up a development environment for the FDSN Portal. The project is a full-stack application consisting of a Go backend with an embedded React frontend, built into a single binary. The development workflow supports working on the backend, frontend, or both simultaneously.

## Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| **Go 1.24+** | Yes | Backend compilation and tooling |
| **Bun** | Yes | UI development and production builds |
| **uv** | Optional | Documentation site (mkdocs-material) |
| **golangci-lint** | Optional | Go linting |
| **mockery** | Optional | Generating test mocks |

## Quick Start

```bash
git clone https://github.com/joescharf/fdsn.git
cd fdsn
make deps    # Install all dependencies (Go, UI, docs)
make dev     # Start all dev servers in parallel
```

## Makefile Targets

The Makefile provides targets for every part of the development lifecycle.

| Target | Description |
|--------|-------------|
| `build` | Build the Go binary to `bin/$(BINARY_NAME)` |
| `install` | Install binary to `$GOPATH/bin` |
| `run` | Build and run the binary |
| `serve` | Build and start the server (`fdsn serve`) |
| `clean` | Remove `bin/` and coverage files |
| `tidy` | Run `go mod tidy` |
| `test` | Run tests with race detector |
| `test-cover` | Run tests with coverage report |
| `lint` | Run golangci-lint |
| `vet` | Run `go vet` |
| `fmt` | Run `gofmt -s -w .` |
| `mocks` | Generate mocks with mockery |
| `docs-serve` | Serve docs locally (mkdocs via uv) |
| `docs-build` | Build docs site |
| `docs-deps` | Install doc dependencies (uv sync) |
| `ui-dev` | Start UI dev server (bun) |
| `ui-build` | Build UI for production (bun) |
| `ui-embed` | Copy `ui/dist/*` to `internal/ui/dist/` |
| `ui-deps` | Install UI dependencies (bun install) |
| `all` | Build all artifacts (app + UI + docs) |
| `deps` | Install all dependencies |
| `dev` | Start all dev servers in parallel |
| `help` | Show help |

## Project Layout

```
main.go                 -- Entry point
cmd/                    -- CLI commands (root, serve, config, version)
internal/
  config/               -- Config management (viper)
  api/                  -- REST API handlers + router (chi)
  fdsnserver/           -- FDSN web service endpoints
  fdsnclient/           -- HTTP client for external FDSN sources
  models/               -- Data models + StationXML
  store/                -- SQLite store implementations
  database/             -- DB init, migrations
  ui/                   -- Embedded SPA (go:embed)
ui/                     -- React/Bun frontend source
  src/
    components/         -- React components (dashboard, sources, explorer,
                           stations, map, waveforms, fdsn)
    hooks/              -- Custom React hooks
    lib/                -- Utilities (api fetch, etc.)
    types/              -- TypeScript interfaces
docs/                   -- MkDocs documentation
```

## Development Workflow

### 1. Backend Development

Edit Go code under `cmd/`, `internal/`, or `main.go`, then use `make serve` or `make run` to compile and launch the server. The server listens on port 8080 by default.

### 2. Frontend Development

Run `make ui-dev` to start the Bun dev server with hot module reload. The dev server proxies API requests to the Go backend at `:8080`, so you will typically have both the Go server and the UI dev server running at the same time.

### 3. Full Build

The build chain is: `ui-build` -> `ui-embed` -> `build`. Running `make all` executes this entire chain, producing a single Go binary with the React frontend embedded. The output binary is located at `bin/fdsn`.

### 4. Tests

Run `make test` to execute Go tests with the race detector enabled. Use `make test-cover` to generate a coverage report.

!!! tip
    Run `make dev` to start the Go server, UI dev server, and docs server all in parallel. This is the easiest way to get a full development environment running with a single command.
