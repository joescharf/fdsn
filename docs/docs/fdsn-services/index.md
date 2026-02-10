# FDSN Web Services

## Overview

FDSN web services are standard APIs defined by the [International Federation of Digital Seismograph Networks](https://www.fdsn.org/webservices/) for accessing seismological data. They provide a uniform interface that any client can use to retrieve station metadata, waveform data, and data availability information.

The FDSN Portal implements three of these services, mounted at `/fdsnws/*` and served from locally-stored metadata:

1. **Station** -- query station, network, and channel metadata from the local database
2. **Dataselect** -- request waveform data in miniSEED format (proxied from upstream data centres)
3. **Availability** -- check the time extent of available data for channels in the local database

All services support both GET and POST request methods.

## Base URL

All FDSN web service endpoints follow the same URL pattern:

```
http://localhost:8080/fdsnws/{service}/1/{method}
```

Where `{service}` is one of `station`, `dataselect`, or `availability`, and `{method}` is typically `query` (or `extent` for the availability service).

## Common Parameters

The following parameters are shared across services. Both long and short forms are accepted.

| Parameter | Short | Description |
|-----------|-------|-------------|
| network | net | Network code (e.g., IU) |
| station | sta | Station code (e.g., ANMO) |
| channel | cha | Channel code (e.g., BHZ) |
| location | loc | Location code (e.g., 00) |
| starttime | start | Start of time window |
| endtime | end | End of time window |

Time values can be specified in any of the following formats:

- RFC3339: `2024-01-15T00:00:00Z`
- Date-time: `2024-01-15T00:00:00`
- Date only: `2024-01-15`

## Wildcard Support

Both `*` (match any characters) and `?` (match a single character) are supported in string parameters such as network, station, channel, and location codes. Multiple values can be comma-separated.

Examples:

- `net=IU` -- match the IU network only
- `sta=A*` -- match all stations starting with A
- `cha=BH?` -- match BHZ, BHN, BHE, etc.
- `net=IU,US` -- match both IU and US networks

## Service Versions

Each service exposes a WADL (Web Application Description Language) document that describes its parameters and methods.

| Service | Version | WADL |
|---------|---------|------|
| Station | 1.1.0 | `/fdsnws/station/1/application.wadl` |
| Dataselect | 1.1.0 | `/fdsnws/dataselect/1/application.wadl` |
| Availability | 1.0.0 | `/fdsnws/availability/1/application.wadl` |
