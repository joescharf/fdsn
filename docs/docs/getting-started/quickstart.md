---
title: Quickstart
description: Go from zero to browsing seismic station data in four steps.
---

# Quickstart

This walkthrough takes you from a fresh install to importing and browsing seismic station metadata. The entire process takes only a few minutes.

## Step 1: Install

Install FDSN Portal using one of the methods on the [Installation](installation.md) page. The quickest option:

```bash
brew install joescharf/tap/fdsn
```

## Step 2: Initialize & Start

```bash
fdsn config init
fdsn serve
```

`config init` creates a default configuration at `~/.config/fdsn/config.yaml` with two pre-configured data sources -- **Earthscope** (`https://service.iris.edu`) and **ORFEUS** (`https://www.orfeus-eu.org`).

`serve` starts the server, automatically seeds the configured sources into the database, and opens `http://localhost:8080` in your default browser. You should see output like:

```
  FDSN Portal → http://localhost:8080
```

!!! tip "Disable auto-open"

    Use `fdsn serve --no-browser` if you prefer to open the browser manually.

!!! tip "Changing the port"

    Use the `--port` flag to listen on a different port: `fdsn serve --port 9090`.

## Step 3: Explore Earthscope Stations

Navigate to the Station Explorer at [http://localhost:8080/explorer](http://localhost:8080/explorer).

1. Select **Earthscope** from the source dropdown
2. Enter network `IU` and station `ANMO` (Albuquerque Seismological Laboratory -- a well-known global reference station)
3. Click **Search** to query the remote Earthscope FDSN service
4. Review the results and click **Import** to save the station metadata to your local database

## Step 4: Browse Imported Data

Once stations have been imported, you can view and interact with them in several ways:

| View | URL | Description |
|------|-----|-------------|
| Station Browser | [/stations](http://localhost:8080/stations) | Searchable, sortable table of all imported stations |
| Interactive Map | [/map](http://localhost:8080/map) | Leaflet map showing station locations with clickable markers |
| Waveform Viewer | [/waveforms](http://localhost:8080/waveforms) | Visualize waveform data using seisplotjs |

Your imported data is also available through standard FDSN web-service endpoints:

```bash
curl "http://localhost:8080/fdsnws/station/1/query?network=IU&station=ANMO&level=station"
```

## What's Next

| Section | Description |
|---------|-------------|
| [Configuration](../configuration.md) | Config file reference, environment variable overrides, and CLI flag precedence |
| [Web UI Guide](../web-ui/index.md) | Detailed walkthrough of the dashboard, explorer, map, and waveform viewer |
| [FDSN Web Services](../fdsn-services/index.md) | Documentation for the station, dataselect, and availability endpoints |
