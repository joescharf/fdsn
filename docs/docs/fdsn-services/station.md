# Station Service

**Endpoint:** `/fdsnws/station/1/query`
**Version:** 1.1.0

## Overview

The station service returns station metadata from the local database in FDSN StationXML or text format. It supports filtering by network, station, channel, location, time range, and geographic bounding box. The detail level of the response can be controlled with the `level` parameter.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| network / net | string | * | Network code(s), comma-separated, wildcards supported |
| station / sta | string | * | Station code(s), comma-separated, wildcards supported |
| channel / cha | string | * | Channel code(s), comma-separated, wildcards supported |
| location / loc | string | * | Location code(s), comma-separated, wildcards supported |
| starttime / start | datetime | | Start time filter |
| endtime / end | datetime | | End time filter |
| level | string | station | Detail level: `network`, `station`, `channel`, `response` |
| format | string | xml | Output format: `xml`, `text` |
| minlat | float | *(none)* | Minimum latitude (no filter when omitted) |
| maxlat | float | *(none)* | Maximum latitude (no filter when omitted) |
| minlon | float | *(none)* | Minimum longitude (no filter when omitted) |
| maxlon | float | *(none)* | Maximum longitude (no filter when omitted) |

## Output Formats

=== "XML (StationXML)"

    The default output format is FDSN StationXML, an XML schema designed for representing station metadata.

    ```bash
    curl "http://localhost:8080/fdsnws/station/1/query?net=IU&sta=ANMO&level=station"
    ```

    Example response:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <FDSNStationXML xmlns="http://www.fdsn.org/xml/station/1" schemaVersion="1.1">
      <Source>FDSN Portal</Source>
      <Sender>FDSN</Sender>
      <Network code="IU">
        <Station code="ANMO">
          <Latitude>34.9459</Latitude>
          <Longitude>-106.4572</Longitude>
          <Elevation>1820.0</Elevation>
          <Site><Name>Albuquerque, New Mexico, USA</Name></Site>
        </Station>
      </Network>
    </FDSNStationXML>
    ```

=== "Text"

    The text format returns pipe-delimited rows with a header line. The header varies by detail level.

    ```bash
    curl "http://localhost:8080/fdsnws/station/1/query?net=IU&sta=ANMO&level=station&format=text"
    ```

    **Header by level:**

    - **Network:** `#Network|Description|StartTime|EndTime|TotalStations`
    - **Station:** `#Network|Station|Latitude|Longitude|Elevation|SiteName|StartTime|EndTime`
    - **Channel:** `#Network|Station|Location|Channel|Latitude|Longitude|Elevation|Depth|Azimuth|Dip|SensorDescription|Scale|ScaleFreq|ScaleUnits|SampleRate|StartTime|EndTime`

    Example station-level text output:

    ```
    #Network|Station|Latitude|Longitude|Elevation|SiteName|StartTime|EndTime
    IU|ANMO|34.9459|-106.4572|1820.0|Albuquerque, New Mexico, USA|1989-08-29T00:00:00|2599-12-31T23:59:59
    IU|CCM|38.0557|-91.2446|222.0|Cathedral Cave, Missouri, USA|1989-08-29T00:00:00|2599-12-31T23:59:59
    ```

## Detail Levels

The `level` parameter controls how much detail is included in the response.

**network**
:   Returns only network-level metadata (network code, description, start/end times). This is the most compact response.

**station**
:   Returns network and station-level metadata including geographic coordinates, elevation, and site name. This is the default level.

**channel**
:   Returns network, station, and channel-level metadata. Includes channel codes, sample rates, sensor orientation (azimuth and dip), and instrument descriptions.

**response**
:   Returns the full instrument response information in addition to all channel-level metadata. This includes poles, zeros, and sensitivity values needed for data processing. This is the most detailed and largest response.
