# Waveform Viewer

**Route:** `/waveforms`

## Overview

The Waveform Viewer fetches and displays seismic waveform data in miniSEED format from external FDSN data centres. It uses seisplotjs for rendering time-series plots directly in the browser.

![Waveform Viewer](../img/fdsn-waveforms.png)

## Channel Selection

The viewer uses a hierarchical selection process to identify the channel to display:

1. **Select a source** -- Choose an FDSN data centre from the configured sources.
2. **Choose network code** -- Select the seismic network (e.g., `IU`, `US`).
3. **Choose station code** -- Select the station within the chosen network.
4. **Choose location code** -- Select the location code if applicable (some stations have multiple sensor locations).
5. **Choose channel code** -- Select the specific channel (e.g., `BHZ`, `BHN`, `BHE`).

Each selection filters the available options in the subsequent dropdowns, guiding you to a valid channel.

## Time Range

Specify the start and end times for the waveform data window. The time range determines which segment of continuous data is fetched from the external source.

## Fetching and Display

The viewer proxies miniSEED data through the portal's own API endpoint:

```
GET /api/v1/waveforms/proxy
```

The following query parameters are supported:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `source_id` | Yes | Identifier of the FDSN data centre source |
| `net` | Yes | Network code |
| `sta` | Yes | Station code |
| `loc` | No | Location code (defaults to empty if not specified) |
| `cha` | Yes | Channel code |
| `starttime` | Yes | Start of the data window |
| `endtime` | Yes | End of the data window |

The proxy endpoint forwards the request to the external source's `/fdsnws/dataselect/1/query` endpoint and returns the response with content type `application/vnd.fdsn.mseed`. The binary miniSEED data is then parsed and rendered as time-series plots using seisplotjs.

!!! warning
    Waveform data is fetched in real-time from the external FDSN data centre and is not stored locally. Each request results in a live query to the upstream source.

!!! tip
    Keep time ranges short -- minutes to hours rather than days -- for faster loading and more responsive rendering. Large time windows produce substantial data volumes that take longer to transfer and render.
