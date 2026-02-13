# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-02-13

### Changed

- Add macOS code signing and notarization to release process

## [0.2.1] - 2026-02-12

### Changed

- Bump Go version to 1.26

## [0.2.0] - 2026-02-11

### Added

- Rich source cards with network/station/channel stats in Station Explorer
- Auto-open browser on `serve` startup
- Source seeding: default FDSN sources created automatically on first run
- Screenshots in README and documentation for all Web UI pages
- Screenshot capture script for documentation

### Changed

- Renamed IRIS source to Earthscope to reflect the service rebrand

## [0.1.0] - 2026-02-10

### Added

- Go backend with Cobra/Viper CLI, Chi router, and zerolog structured logging
- React 19 frontend with shadcn/ui components, Tailwind CSS v4, and Bun bundler
- Single binary deployment with embedded UI via `//go:embed`
- Pure-Go SQLite database (modernc.org/sqlite) with WAL mode -- no CGO required
- FDSN web-service endpoints: `/fdsnws/station`, `/fdsnws/dataselect`, `/fdsnws/availability`
- REST API at `/api/v1/*` for sources, networks, stations, channels, and availability
- Configurable FDSN data centre sources (IRIS, ORFEUS, and any standards-compliant service)
- Station metadata import from remote FDSN sources with deduplication
- Availability data import and status display
- Interactive web UI: dashboard, station explorer with filtering, station browser
- Leaflet-based interactive map view for station locations
- Waveform viewer powered by seisplotjs with click-to-navigate from channel tables
- FDSN query tester for ad-hoc endpoint testing
- YAML configuration at `~/.config/fdsn/config.yaml` with environment variable and CLI flag overrides
- `config init` command for guided configuration setup
- Auto-migration system for SQLite schema management
- Comprehensive mkdocs-material documentation site
- CI/CD with GitHub Actions (test, lint, release, docs deployment)
- GoReleaser configuration for cross-platform builds, Homebrew tap, and Docker images
- Multi-arch Docker images published to ghcr.io (amd64 + arm64)

[0.2.2]: https://github.com/joescharf/fdsn/releases/tag/v0.2.2
[0.2.1]: https://github.com/joescharf/fdsn/releases/tag/v0.2.1
[0.2.0]: https://github.com/joescharf/fdsn/releases/tag/v0.2.0
[0.1.0]: https://github.com/joescharf/fdsn/releases/tag/v0.1.0
