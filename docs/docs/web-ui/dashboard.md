# Dashboard

**Route:** `/` (home page)

## Overview

The dashboard provides an at-a-glance summary of the data in your FDSN Portal instance. It is the first page displayed when you open the web interface.

## Statistics Cards

The dashboard displays four statistics cards showing counts of key entities in your local database:

| Card | Description |
|------|-------------|
| Sources | Number of configured FDSN data sources |
| Networks | Number of imported seismic networks |
| Stations | Number of imported stations |
| Channels | Number of imported channels |

These statistics are retrieved from the `GET /api/v1/stats` endpoint, which returns a JSON response in the following format:

```json
{
  "sources": 2,
  "networks": 5,
  "stations": 42,
  "channels": 168
}
```

The counts update each time you navigate to the dashboard, reflecting any stations or channels that have been imported since your last visit.

## Navigation

From the dashboard, use the sidebar to navigate to other sections of the application. The sidebar is always visible and provides links to all major pages including Sources, Station Explorer, Stations, Map, Waveform Viewer, and the FDSN Endpoint Tester.
