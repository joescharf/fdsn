---
title: API Reference
description: Complete REST API reference for the FDSN Portal internal API
---

# API Reference

The FDSN Portal exposes a REST API under the `/api/v1` prefix. This API is used by the embedded React UI and can be called directly from any HTTP client. All endpoints accept and return JSON unless otherwise noted. Error responses use the format `{"error": "message"}`.

!!! note "FDSN web-service endpoints"

    This page documents the internal REST API used by the portal UI. For the standards-compliant FDSN web-service endpoints (`/fdsnws/station`, `/fdsnws/dataselect`, `/fdsnws/availability`), see [FDSN Web Services](fdsn-services/index.md).

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/sources` | List all sources |
| `POST` | `/api/v1/sources` | Create a source |
| `GET` | `/api/v1/sources/{id}` | Get source by ID |
| `PUT` | `/api/v1/sources/{id}` | Update a source |
| `DELETE` | `/api/v1/sources/{id}` | Delete a source |
| `GET` | `/api/v1/sources/{id}/explore/stations` | Explore external stations |
| `POST` | `/api/v1/import/stations` | Import stations from external source |
| `GET` | `/api/v1/stations` | List local stations |
| `GET` | `/api/v1/stations/{id}` | Get station with channels |
| `DELETE` | `/api/v1/stations/{id}` | Delete a station |
| `GET` | `/api/v1/networks` | List networks |
| `GET` | `/api/v1/waveforms/proxy` | Proxy miniSEED data |
| `GET` | `/api/v1/stats` | Dashboard statistics |

---

## Health

### GET /api/v1/health

Returns the server health status. Use this endpoint for readiness probes or uptime checks.

**Response**

Status: `200 OK`

```json
{
  "status": "ok"
}
```

---

## Sources

Sources represent external FDSN data centres (such as Earthscope or ORFEUS) that the portal can connect to for querying and importing station metadata.

### GET /api/v1/sources

List all configured sources.

**Response**

Status: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Earthscope",
    "base_url": "https://service.iris.edu",
    "description": "Earthscope (formerly IRIS)",
    "enabled": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "name": "ORFEUS",
    "base_url": "https://www.orfeus-eu.org",
    "description": "ORFEUS European FDSN services",
    "enabled": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
]
```

### POST /api/v1/sources

Create a new source. Both `name` and `base_url` are required.

**Request body**

```json
{
  "name": "GFZ",
  "base_url": "https://geofon.gfz-potsdam.de",
  "description": "GFZ German Research Centre for Geosciences"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique display name for the source |
| `base_url` | string | Yes | Base URL of the FDSN web-service host |
| `description` | string | No | Free-text description |

**Response**

Status: `201 Created`

```json
{
  "id": 3,
  "name": "GFZ",
  "base_url": "https://geofon.gfz-potsdam.de",
  "description": "GFZ German Research Centre for Geosciences",
  "enabled": false,
  "created_at": "2025-06-01T12:00:00Z",
  "updated_at": "2025-06-01T12:00:00Z"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Missing `name` or `base_url`, or invalid JSON body |

### GET /api/v1/sources/{id}

Get a single source by its ID.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Source ID |

**Response**

Status: `200 OK`

```json
{
  "id": 1,
  "name": "Earthscope",
  "base_url": "https://service.iris.edu",
  "description": "Earthscope (formerly IRIS)",
  "enabled": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer |
| `404 Not Found` | No source with the given ID exists |

### PUT /api/v1/sources/{id}

Update an existing source. The request body may include any combination of `name`, `base_url`, and `description`.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Source ID |

**Request body**

```json
{
  "name": "Earthscope (Updated)",
  "base_url": "https://service.iris.edu",
  "description": "Updated description"
}
```

**Response**

Status: `200 OK`

Returns the updated Source object.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer, or invalid JSON body |
| `500 Internal Server Error` | Database error during update |

### DELETE /api/v1/sources/{id}

Delete a source by its ID.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Source ID |

**Response**

Status: `204 No Content`

No response body.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer |
| `500 Internal Server Error` | Database error during deletion |

---

## Explore

The explore endpoint queries an external FDSN data centre in real time without importing any data. Use it to browse station metadata from a remote source before deciding what to import.

### GET /api/v1/sources/{id}/explore/stations

Query station metadata from an external FDSN source.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Source ID of the FDSN data centre to query |

**Query parameters**

All query parameters are optional and act as filters on the external query.

| Parameter | Type | Description |
|-----------|------|-------------|
| `net` | string | Network code (e.g., `IU`, `US`) |
| `sta` | string | Station code (e.g., `ANMO`, `*`) |
| `cha` | string | Channel code (e.g., `BHZ`, `BH*`) |
| `loc` | string | Location code (e.g., `00`, `--`) |
| `minlat` | string | Minimum latitude |
| `maxlat` | string | Maximum latitude |
| `minlon` | string | Minimum longitude |
| `maxlon` | string | Maximum longitude |

**Example request**

```bash
curl "http://localhost:8080/api/v1/sources/1/explore/stations?net=IU&sta=ANMO"
```

**Response**

Status: `200 OK`

Returns an array of station text rows from the external source.

??? note "Example response body"

    ```json
    [
      {
        "Network": "IU",
        "Station": "ANMO",
        "Latitude": 34.9459,
        "Longitude": -106.4572,
        "Elevation": 1820.0,
        "SiteName": "Albuquerque, New Mexico, USA",
        "StartTime": "1989-08-29T00:00:00Z",
        "EndTime": null,
        "Description": "Global Seismograph Network"
      }
    ]
    ```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer |
| `404 Not Found` | No source with the given ID exists |
| `502 Bad Gateway` | The external FDSN source returned an error or is unreachable |

---

## Import

The import endpoint fetches channel-level metadata from an external FDSN source and persists it into the local database, creating networks, stations, and channels as needed.

### POST /api/v1/import/stations

Import stations and their channels from an external FDSN data centre into the local database.

**Request body**

```json
{
  "source_id": 1,
  "network": "IU",
  "station": "ANMO",
  "channel": "BH*",
  "location": "00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_id` | integer | Yes | ID of the source to import from |
| `network` | string | No | Network code filter |
| `station` | string | No | Station code filter |
| `channel` | string | No | Channel code filter (wildcards supported) |
| `location` | string | No | Location code filter |

**Example request**

```bash
curl -X POST http://localhost:8080/api/v1/import/stations \
  -H "Content-Type: application/json" \
  -d '{"source_id": 1, "network": "IU", "station": "ANMO"}'
```

**Response**

Status: `200 OK`

```json
{
  "imported": 42
}
```

The `imported` field indicates the number of channels that were fetched and stored.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Missing `source_id` or invalid JSON body |
| `404 Not Found` | No source with the given `source_id` exists |
| `502 Bad Gateway` | The external FDSN source returned an error or is unreachable |
| `500 Internal Server Error` | Database error during import |

---

## Stations

Stations endpoints operate on station metadata that has been imported into the local database.

### GET /api/v1/stations

List stations stored in the local database with optional filtering and pagination.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `network` | string | | Filter by network code |
| `station` | string | | Filter by station code |
| `limit` | integer | `100` | Number of results to return (max `1000`) |
| `offset` | integer | `0` | Number of results to skip |

**Example request**

```bash
curl "http://localhost:8080/api/v1/stations?network=IU&limit=10"
```

**Response**

Status: `200 OK`

```json
{
  "stations": [
    {
      "id": 1,
      "network_id": 1,
      "code": "ANMO",
      "latitude": 34.9459,
      "longitude": -106.4572,
      "elevation": 1820.0,
      "site_name": "Albuquerque, New Mexico, USA",
      "start_time": "1989-08-29T00:00:00Z",
      "end_time": null,
      "created_at": "2025-06-01T12:00:00Z",
      "network_code": "IU",
      "source_name": "Earthscope"
    }
  ],
  "total": 1
}
```

### GET /api/v1/stations/{id}

Get a single station by ID, including all of its channels.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Station ID |

**Response**

Status: `200 OK`

Returns a StationDetail object containing the station fields plus a `channels` array.

??? note "Example response body"

    ```json
    {
      "id": 1,
      "network_id": 1,
      "code": "ANMO",
      "latitude": 34.9459,
      "longitude": -106.4572,
      "elevation": 1820.0,
      "site_name": "Albuquerque, New Mexico, USA",
      "start_time": "1989-08-29T00:00:00Z",
      "end_time": null,
      "created_at": "2025-06-01T12:00:00Z",
      "network_code": "IU",
      "source_name": "Earthscope",
      "channels": [
        {
          "id": 1,
          "station_id": 1,
          "location_code": "00",
          "code": "BHZ",
          "latitude": 34.9459,
          "longitude": -106.4572,
          "elevation": 1820.0,
          "depth": 100.0,
          "azimuth": 0.0,
          "dip": -90.0,
          "sensor_description": "Streckeisen STS-6A VBB Seismometer",
          "scale": 1.17862e+09,
          "scale_freq": 0.02,
          "scale_units": "M/S",
          "sample_rate": 40.0,
          "start_time": "2018-07-09T00:00:00Z",
          "end_time": null,
          "created_at": "2025-06-01T12:00:00Z"
        }
      ]
    }
    ```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer |
| `404 Not Found` | No station with the given ID exists |

### DELETE /api/v1/stations/{id}

Delete a station and all of its associated channels from the local database.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Station ID |

**Response**

Status: `204 No Content`

No response body.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `id` is not a valid integer |
| `500 Internal Server Error` | Database error during deletion |

---

## Networks

### GET /api/v1/networks

List all networks stored in the local database.

**Response**

Status: `200 OK`

```json
[
  {
    "id": 1,
    "source_id": 1,
    "code": "IU",
    "description": "Global Seismograph Network",
    "start_time": "1988-01-01T00:00:00Z",
    "end_time": null,
    "created_at": "2025-06-01T12:00:00Z"
  },
  {
    "id": 2,
    "source_id": 1,
    "code": "US",
    "description": "United States National Seismic Network",
    "start_time": "1990-01-01T00:00:00Z",
    "end_time": null,
    "created_at": "2025-06-01T12:00:00Z"
  }
]
```

---

## Waveforms

The waveform proxy streams raw miniSEED binary data from an external FDSN data centre. The portal acts as a pass-through proxy so the browser-based waveform viewer can fetch data without CORS restrictions.

### GET /api/v1/waveforms/proxy

Proxy a miniSEED data request to an external FDSN dataselect service.

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_id` | integer | Yes | ID of the source to fetch data from |
| `net` | string | Yes | Network code |
| `sta` | string | Yes | Station code |
| `loc` | string | No | Location code |
| `cha` | string | Yes | Channel code |
| `starttime` | string | Yes | Start time in ISO 8601 format |
| `endtime` | string | Yes | End time in ISO 8601 format |

**Example request**

```bash
curl -o waveform.mseed \
  "http://localhost:8080/api/v1/waveforms/proxy?source_id=1&net=IU&sta=ANMO&loc=00&cha=BHZ&starttime=2025-01-01T00:00:00&endtime=2025-01-01T01:00:00"
```

**Response**

Status: `200 OK`

Content-Type: `application/vnd.fdsn.mseed`

The response body is a binary miniSEED stream. If no data is available for the requested time range, the server returns `204 No Content` with an empty body.

**Error responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Missing required parameter (`source_id`, `net`, `sta`, `cha`, `starttime`, or `endtime`) |
| `404 Not Found` | No source with the given `source_id` exists |
| `502 Bad Gateway` | The external FDSN source returned an error or is unreachable |

---

## Stats

### GET /api/v1/stats

Returns summary counts for the dashboard. All counts reflect the number of records in the local database.

**Response**

Status: `200 OK`

```json
{
  "sources": 2,
  "networks": 5,
  "stations": 128,
  "channels": 3840
}
```

---

## Data Models

### Source

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| ID | `id` | integer | Auto-generated primary key |
| Name | `name` | string | Unique display name (required on create) |
| BaseURL | `base_url` | string | Base URL of the FDSN web-service host (required on create) |
| Description | `description` | string | Free-text description |
| Enabled | `enabled` | boolean | Whether the source is enabled |
| CreatedAt | `created_at` | string (ISO 8601) | Record creation timestamp |
| UpdatedAt | `updated_at` | string (ISO 8601) | Record last-update timestamp |

### Network

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| ID | `id` | integer | Auto-generated primary key |
| SourceID | `source_id` | integer | Foreign key to the parent source |
| Code | `code` | string | Network code (e.g., `IU`, `US`) |
| Description | `description` | string | Network description |
| StartTime | `start_time` | string or null | Network start time (ISO 8601, nullable) |
| EndTime | `end_time` | string or null | Network end time (ISO 8601, nullable) |
| CreatedAt | `created_at` | string (ISO 8601) | Record creation timestamp |

### Station

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| ID | `id` | integer | Auto-generated primary key |
| NetworkID | `network_id` | integer | Foreign key to the parent network |
| Code | `code` | string | Station code (e.g., `ANMO`) |
| Latitude | `latitude` | float | Station latitude in decimal degrees |
| Longitude | `longitude` | float | Station longitude in decimal degrees |
| Elevation | `elevation` | float | Station elevation in metres |
| SiteName | `site_name` | string | Human-readable site name |
| StartTime | `start_time` | string or null | Station start time (ISO 8601, nullable) |
| EndTime | `end_time` | string or null | Station end time (ISO 8601, nullable) |
| CreatedAt | `created_at` | string (ISO 8601) | Record creation timestamp |
| NetworkCode | `network_code` | string | Joined network code (present in list responses, omitted when empty) |
| SourceName | `source_name` | string | Joined source name (present in list responses, omitted when empty) |

### Channel

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| ID | `id` | integer | Auto-generated primary key |
| StationID | `station_id` | integer | Foreign key to the parent station |
| LocationCode | `location_code` | string | Location code (e.g., `00`, `10`) |
| Code | `code` | string | Channel code (e.g., `BHZ`, `HHN`) |
| Latitude | `latitude` | float or null | Channel latitude (nullable) |
| Longitude | `longitude` | float or null | Channel longitude (nullable) |
| Elevation | `elevation` | float or null | Channel elevation in metres (nullable) |
| Depth | `depth` | float or null | Sensor depth in metres (nullable) |
| Azimuth | `azimuth` | float or null | Sensor azimuth in degrees (nullable) |
| Dip | `dip` | float or null | Sensor dip in degrees (nullable) |
| SensorDescription | `sensor_description` | string | Description of the sensor hardware |
| Scale | `scale` | float or null | Instrument sensitivity value (nullable) |
| ScaleFreq | `scale_freq` | float or null | Frequency at which sensitivity is measured (nullable) |
| ScaleUnits | `scale_units` | string | Units for the sensitivity value |
| SampleRate | `sample_rate` | float or null | Sampling rate in samples per second (nullable) |
| StartTime | `start_time` | string or null | Channel start time (ISO 8601, nullable) |
| EndTime | `end_time` | string or null | Channel end time (ISO 8601, nullable) |
| CreatedAt | `created_at` | string (ISO 8601) | Record creation timestamp |

### StationDetail

All fields from [Station](#station) plus:

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| Channels | `channels` | array of [Channel](#channel) | All channels belonging to this station |

### Stats

| Field | JSON Key | Type | Description |
|-------|----------|------|-------------|
| Sources | `sources` | integer | Total number of configured sources |
| Networks | `networks` | integer | Total number of imported networks |
| Stations | `stations` | integer | Total number of imported stations |
| Channels | `channels` | integer | Total number of imported channels |

---

## Error Format

All error responses share a common JSON structure:

```json
{
  "error": "descriptive error message"
}
```

Common HTTP status codes used across endpoints:

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Invalid request parameters, missing required fields, or malformed JSON |
| `404 Not Found` | The requested resource does not exist |
| `500 Internal Server Error` | An unexpected error occurred on the server |
| `502 Bad Gateway` | An external FDSN source could not be reached or returned an error |
