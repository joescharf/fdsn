# FDSN Portal

[![Release](https://img.shields.io/github/v/release/joescharf/fdsn)](https://github.com/joescharf/fdsn/releases)
[![CI](https://github.com/joescharf/fdsn/actions/workflows/ci.yml/badge.svg)](https://github.com/joescharf/fdsn/actions/workflows/ci.yml)
[![Go Report Card](https://goreportcard.com/badge/github.com/joescharf/fdsn)](https://goreportcard.com/report/github.com/joescharf/fdsn)
[![Docs](https://img.shields.io/badge/docs-joescharf.github.io%2Ffdsn-blue)](https://joescharf.github.io/fdsn)

Seismic station metadata management -- import, explore, and re-serve FDSN data from a single binary.

## Features

- **Single binary deployment** -- Go backend with an embedded React UI, nothing else to install
- **Zero external dependencies** -- pure-Go SQLite driver (no CGO), no separate database server required
- **Connect to any FDSN data centre** -- IRIS, ORFEUS, and any other standards-compliant source
- **Standard FDSN web-service endpoints** -- `/fdsnws/station`, `/fdsnws/dataselect`, `/fdsnws/availability`
- **Interactive web UI** -- dashboard, station explorer, interactive map, and waveform viewer
- **Flexible configuration** -- YAML config file, environment variables, and CLI flags

## Quick Start

### Install

=== "Homebrew"

```bash
brew install joescharf/tap/fdsn
```

=== "Go"

```bash
go install github.com/joescharf/fdsn@latest
```

> **Note:** `go install` builds a backend-only binary without the embedded UI.

=== "Docker"

```bash
docker run -p 8080:8080 -v fdsn-data:/data ghcr.io/joescharf/fdsn:latest
```

=== "Binary"

Download the latest release from [GitHub Releases](https://github.com/joescharf/fdsn/releases).

### Run

```bash
# Initialize configuration
fdsn config init

# Start the server
fdsn serve
```

Open [http://localhost:8080](http://localhost:8080) to access the web UI.

## Architecture

```
  External FDSN Sources          FDSN Portal             Outputs
 ┌───────────────────┐     ┌──────────────────┐
 │ IRIS              │     │                  │──▸ FDSN Web Services
 │ ORFEUS            │──▸──│  Go binary       │     /fdsnws/station
 │ Other data centres│     │  + React UI      │     /fdsnws/dataselect
 └───────────────────┘     │  + SQLite DB     │     /fdsnws/availability
                           │  (port 8080)     │
                           │                  │──▸ Web UI
                           └──────────────────┘     Dashboard, Explorer,
                                                    Map, Waveforms
```

## Configuration

Key settings (configured via `~/.config/fdsn/config.yaml`, environment variables, or CLI flags):

| Setting | Default | Description |
|---------|---------|-------------|
| `server.port` | `8080` | HTTP listen port |
| `db.path` | `~/.config/fdsn/fdsn.db` | SQLite database path |
| `log.level` | `info` | Log level (debug, info, warn, error) |

See the [Configuration docs](https://joescharf.github.io/fdsn/configuration/) for the full reference.

## Documentation

Full documentation is available at [joescharf.github.io/fdsn](https://joescharf.github.io/fdsn).

## Development

### Prerequisites

- [Go](https://go.dev/) 1.25+
- [Bun](https://bun.sh/) (for building the React UI)
- [uv](https://docs.astral.sh/uv/) (optional, for building docs)

### Build from Source

```bash
git clone https://github.com/joescharf/fdsn.git
cd fdsn
make deps
make all
./bin/fdsn serve
```

### Run Tests

```bash
go test -v -race -count=1 ./...
```

### Lint

```bash
golangci-lint run ./...
```

## Contributing

See the [Contributing Guide](https://joescharf.github.io/fdsn/development/contributing/) for development setup and guidelines.
