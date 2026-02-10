# Availability Service

**Endpoints:** `/fdsnws/availability/1/query` and `/fdsnws/availability/1/extent`
**Version:** 1.0.0

## Overview

The availability service returns information about the time range of available data for channels in the local database. It provides two endpoints: `query` for individual time spans and `extent` for aggregated time ranges per channel.

## Endpoints

=== "Query"

    **Endpoint:** `/fdsnws/availability/1/query`

    Returns per-channel availability rows from the availability table. Each row represents an individual time span for which data exists.

    ```bash
    curl "http://localhost:8080/fdsnws/availability/1/query?net=IU&sta=ANMO"
    ```

    Example response:

    ```
    #Network|Station|Location|Channel|Earliest|Latest
    IU|ANMO|00|BH1|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|00|BH2|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|00|BHZ|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BH1|2021-03-10T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BH2|2021-03-10T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BHZ|2021-03-10T00:00:00|2024-06-15T23:59:59
    ```

=== "Extent"

    **Endpoint:** `/fdsnws/availability/1/extent`

    Returns aggregated availability per channel, showing the overall earliest and latest times across all time spans. This is computed as `MIN(earliest)` and `MAX(latest)` for each channel.

    ```bash
    curl "http://localhost:8080/fdsnws/availability/1/extent?net=IU&sta=ANMO"
    ```

    Example response:

    ```
    #Network|Station|Location|Channel|Earliest|Latest
    IU|ANMO|00|BH1|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|00|BH2|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|00|BHZ|2020-01-01T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BH1|2021-03-10T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BH2|2021-03-10T00:00:00|2024-06-15T23:59:59
    IU|ANMO|10|BHZ|2021-03-10T00:00:00|2024-06-15T23:59:59
    ```

## Parameters

The same parameters apply to both the `query` and `extent` endpoints.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| network / net | string | * | Network code(s), wildcards supported |
| station / sta | string | * | Station code(s), wildcards supported |
| channel / cha | string | * | Channel code(s), wildcards supported |
| location / loc | string | * | Location code(s), wildcards supported |

## Output Format

Both endpoints return pipe-delimited text with the following header:

```
#Network|Station|Location|Channel|Earliest|Latest
```

Each subsequent line contains one row of availability data with fields separated by the pipe (`|`) character. Times are formatted as ISO 8601 date-time strings.

!!! note
    Availability data is populated during the import process. When station metadata is imported from an upstream FDSN data centre, the portal queries that source's availability service and stores the results locally. If no availability data appears for a network, verify that the upstream source supports the availability service and re-import the network metadata.
