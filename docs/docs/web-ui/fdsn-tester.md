# FDSN Query Tester

**Route:** `/fdsn`

## Overview

The FDSN Query Tester is a built-in tool for constructing and testing queries against the portal's own FDSN web-service endpoints. It provides a form-based interface for building valid FDSN queries and inspecting the responses without leaving the browser.

## Service Selection

Choose which FDSN service to test:

| Service | Endpoint | Description |
|---------|----------|-------------|
| Station | `/fdsnws/station/1/query` | Query station metadata at various detail levels |
| Dataselect | `/fdsnws/dataselect/1/query` | Request waveform data in miniSEED format |
| Availability | `/fdsnws/availability/1/query` | Check data availability for specific channels |
| Availability Extent | `/fdsnws/availability/1/extent` | Check the overall time extent of available data |

## Query Builder

The interface provides form fields for common FDSN query parameters:

| Parameter | Applicable Services | Description |
|-----------|-------------------|-------------|
| Network | All | Network code filter (e.g., `IU`) |
| Station | All | Station code filter (e.g., `ANMO`) |
| Location | All | Location code filter (e.g., `00`) |
| Channel | All | Channel code filter (e.g., `BHZ`) |
| Start time | All | Beginning of the time window |
| End time | All | End of the time window |
| Level | Station | Detail level: `network`, `station`, `channel`, or `response` |
| Format | Station | Response format: `xml` or `text` |
| Min latitude | Station | Southern boundary for geographic filtering |
| Max latitude | Station | Northern boundary for geographic filtering |
| Min longitude | Station | Western boundary for geographic filtering |
| Max longitude | Station | Eastern boundary for geographic filtering |

Only the parameters relevant to the selected service are shown in the form.

## URL Preview

As you fill in parameters, the full query URL is constructed and displayed in real time. This URL represents the exact request that will be sent to the portal's FDSN endpoint. You can copy this URL for use with `curl`, `wget`, or other HTTP tools outside the browser.

## Response Display

Submit the query to see the response directly in the browser. Station service responses are displayed formatted -- both XML and text formats are rendered in a readable layout. This allows you to verify that the portal's FDSN endpoints return the expected data for a given set of parameters.

!!! tip
    The Query Tester is useful for testing and debugging your FDSN endpoints before sharing them with external clients. Verify that your imported data is accessible through standard FDSN queries, and use the generated URLs as examples for downstream consumers.
