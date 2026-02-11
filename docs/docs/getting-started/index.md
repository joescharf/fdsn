---
title: Getting Started
description: Install FDSN Portal, run it for the first time, and explore seismic station data in minutes.
---

# Getting Started

FDSN Portal is a self-contained Go + React application for importing, exploring, and re-serving seismic station metadata from FDSN data centres such as Earthscope and ORFEUS. In this section you will install the binary, start the server, and walk through the core workflow -- importing stations and browsing the results in the web UI.

!!! tip "Single binary, zero dependencies"

    The entire application -- backend, embedded SQLite database, and React frontend -- ships as a single binary. There is no separate database server, web server, or Node.js runtime to manage.

## Prerequisites

- **No external database required** -- FDSN Portal uses an embedded, pure-Go SQLite driver (no CGO) and creates its database file automatically on first run.
- **No additional runtime dependencies** -- once you have the `fdsn` binary, everything it needs is included.

## Next Steps

| Page | What you will learn |
|------|---------------------|
| [Installation](installation.md) | How to install via Homebrew, Docker, binary download, or build from source |
| [Quickstart](quickstart.md) | A four-step walkthrough from first launch to browsing station data |
