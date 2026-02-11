# Station Browser

**Route:** `/stations`

## Overview

Browse all stations that have been imported into the local database. The Station Browser provides a paginated table view of station metadata with filtering capabilities, and detailed per-station views including channel inventories.

![Station Browser](../img/fdsn-stations.png)

## Table View

Stations are displayed in a paginated table with the following columns:

| Column | Description |
|--------|-------------|
| Network Code | The FDSN network identifier (e.g., `IU`, `US`) |
| Station Code | The station identifier within the network |
| Latitude | Station latitude in decimal degrees |
| Longitude | Station longitude in decimal degrees |
| Elevation | Station elevation in metres |
| Site Name | Human-readable name describing the station location |
| Time Range | The operational start and end times for the station |

Pagination is supported with a configurable limit (default 100, maximum 1000) and offset. Use the pagination controls at the bottom of the table to navigate through large result sets.

## Filtering

Use the network and station filter inputs at the top of the table to narrow results. Filters support exact codes -- enter a network code such as `IU` or a station code such as `ANMO` to restrict the displayed rows to matching records.

## Station Detail

Click any station row to navigate to its detail page at `/stations/:id`. The detail page displays:

![Station Detail](../img/fdsn-station-detail.png)

**Station metadata:**

- Network code
- Station code
- Latitude and longitude
- Elevation
- Site name
- Operational time range (start and end times)

**Channel table:**

All channels associated with the station are listed in a table with the following columns:

| Column | Description |
|--------|-------------|
| Location Code | The location identifier (may be empty) |
| Channel Code | The channel identifier (e.g., `BHZ`, `BHN`, `BHE`) |
| Sample Rate | Number of samples per second |
| Sensor Description | Description of the sensor instrument |
| Azimuth | Sensor azimuth in degrees |
| Dip | Sensor dip in degrees |
| Start Time | Channel operational start time |
| End Time | Channel operational end time |

!!! tip
    You can also view stations on the interactive map at `/map` for a geographic perspective of your imported data.
