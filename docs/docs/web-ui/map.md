# Interactive Map

**Route:** `/map`

## Overview

The interactive map provides a geographic view of all imported stations using Leaflet. Station positions are plotted on a world map, giving a spatial overview of your seismic network coverage.

## Map Features

- **Station markers** -- Each station is represented by a marker placed at its latitude and longitude coordinates.
- **Station popups** -- Click a marker to see a popup displaying station details including network code, station code, site name, and coordinates.
- **Navigation to detail** -- From the popup, navigate directly to the station detail page for full metadata and channel information.
- **Standard map controls** -- Zoom in and out, pan across the map, and switch between map tile layers using the built-in Leaflet controls.

## Usage

The map automatically displays all stations from the local database. As you import more stations through the Station Explorer, they appear on the map the next time you visit the page. No additional configuration is required -- the map reads directly from the same local database used by the Station Browser.

!!! note
    The map requires an internet connection for loading map tile layers. Station data itself is read from the local database, but the background map tiles are fetched from external tile servers.
