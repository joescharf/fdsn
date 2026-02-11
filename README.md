# FDSN Portal

[![Release](https://img.shields.io/github/v/release/joescharf/fdsn)](https://github.com/joescharf/fdsn/releases)
[![CI](https://github.com/joescharf/fdsn/actions/workflows/ci.yml/badge.svg)](https://github.com/joescharf/fdsn/actions/workflows/ci.yml)
[![Go Report Card](https://goreportcard.com/badge/github.com/joescharf/fdsn)](https://goreportcard.com/report/github.com/joescharf/fdsn)
[![Docs](https://img.shields.io/badge/docs-joescharf.github.io%2Ffdsn-blue)](https://joescharf.github.io/fdsn)

Seismic station metadata management -- import, explore, and re-serve FDSN data from a single binary.

## Features

- **Single binary deployment** -- Go backend with an embedded React UI, nothing else to install
- **Zero external dependencies** -- pure-Go SQLite driver (no CGO), no separate database server required
- **Connect to any FDSN data centre** -- Earthscope, ORFEUS, and any other standards-compliant source
- **Standard FDSN web-service endpoints** -- `/fdsnws/station`, `/fdsnws/dataselect`, `/fdsnws/availability`
- **Interactive web UI** -- dashboard, station explorer, interactive map, and waveform viewer
- **Flexible configuration** -- YAML config file, environment variables, and CLI flags

## Web UI

<table>
  <tr>
    <td align="center"><b>Dashboard</b><br/><img src="docs/docs/img/fdsn-dashboard.png" width="400"/></td>
    <td align="center"><b>Interactive Map</b><br/><img src="docs/docs/img/fdsn-map.png" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><b>Station Explorer</b><br/><img src="docs/docs/img/fdsn-explorer.png" width="400"/></td>
    <td align="center"><b>Waveform Viewer</b><br/><img src="docs/docs/img/fdsn-waveforms.png" width="400"/></td>
  </tr>
</table>

## Quick Start

### Install

**Homebrew** (macOS / Linux):

```bash
brew install joescharf/tap/fdsn
```

**Binary download:**

Download from [GitHub Releases](https://github.com/joescharf/fdsn/releases) and add to PATH.

**Docker:**

```bash
docker run -p 8080:8080 -v fdsn-data:/data ghcr.io/joescharf/fdsn:latest
```

### Run

```bash
fdsn config init    # Create default config with Earthscope + ORFEUS sources
fdsn serve          # Start server — opens http://localhost:8080 in your browser
```

The server automatically seeds the configured data sources into the database on startup and opens the web UI in your default browser. Use `--no-browser` to disable auto-open.

## Architecture

```
  External FDSN Sources          FDSN Portal             Outputs
 ┌───────────────────┐     ┌──────────────────┐
 │ Earthscope        │     │                  │──▸ FDSN Web Services
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
| `server.no_browser` | `false` | Disable auto-opening the browser on startup |
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
