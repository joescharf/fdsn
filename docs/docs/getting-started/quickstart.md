---
title: Quickstart
description: Go from zero to browsing seismic station data in five steps.
---

# Quickstart

This walkthrough takes you from a fresh install to importing and browsing seismic station metadata. The entire process takes only a few minutes.

## Step 1: Initialize Configuration

```bash
fdsn config init
```

This creates a default configuration file at `~/.config/fdsn/config.yaml`. The defaults include two pre-configured FDSN data sources -- **IRIS** (`https://service.iris.edu`) and **ORFEUS** (`https://www.orfeus-eu.org`) -- so you can start querying immediately without any manual setup.

## Step 2: Start the Server

```bash
fdsn serve
```

The server starts on `http://localhost:8080`. On first launch it automatically creates the SQLite database at `~/.config/fdsn/fdsn.db` and runs all pending migrations. You will see log output confirming the server is ready.

!!! tip "Changing the port"

    Use the `--port` flag to listen on a different port: `fdsn serve --port 9090`.

## Step 3: Add a Data Source (or Use the Defaults)

IRIS and ORFEUS are already configured out of the box. To manage sources, open the Sources page in your browser:

```
http://localhost:8080/sources
```

From here you can add, edit, or remove FDSN data centres. Sources can also be managed through the REST API at `/api/v1/sources`.

## Step 4: Explore and Import Stations

Navigate to the Station Explorer:

```
http://localhost:8080/explorer
```

Select a source from the dropdown, enter search parameters (for example, network `IU` and station `ANMO`), and run the query. The explorer shows matching stations from the remote FDSN service. Click **Import** to save the results to your local database for offline access and fast lookups.

## Step 5: Browse Your Data

Once stations have been imported, you can view and interact with them in several ways:

| View | URL | Description |
|------|-----|-------------|
| Station Browser | `http://localhost:8080/stations` | Searchable, sortable table of all imported stations |
| Interactive Map | `http://localhost:8080/map` | Leaflet map showing station locations with clickable markers |
| Waveform Viewer | `http://localhost:8080/waveforms` | Visualize waveform data using seisplotjs |

Your imported data is also available through standard FDSN web-service endpoints, for example:

```
http://localhost:8080/fdsnws/station/1/query?network=IU&station=ANMO
```

## What's Next

| Section | Description |
|---------|-------------|
| [Configuration](../configuration.md) | Config file reference, environment variable overrides, and CLI flag precedence |
| [Web UI Guide](../web-ui/index.md) | Detailed walkthrough of the dashboard, explorer, map, and waveform viewer |
| [FDSN Web Services](../fdsn-services/index.md) | Documentation for the station, dataselect, and availability endpoints |
