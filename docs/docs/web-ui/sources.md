# Sources

**Route:** `/sources`

## Overview

Sources represent external FDSN data centres that the portal connects to for exploring and importing station metadata. Each source is defined by a name and a base URL that points to an FDSN web services deployment.

## Default Sources

Two sources are automatically seeded into the database on startup from the config file:

| Name | Base URL | Description |
|------|----------|-------------|
| Earthscope | `https://service.iris.edu` | Earthscope (formerly IRIS) |
| ORFEUS | `https://www.orfeus-eu.org` | ORFEUS Data Center (Europe) |

## Common FDSN Data Centres

Beyond the defaults, you can add any FDSN-compliant data centre. The following table lists well-known centres:

| Name | Base URL | Region |
|------|----------|--------|
| Earthscope | `https://service.iris.edu` | North America |
| ORFEUS | `https://www.orfeus-eu.org` | Europe |
| GFZ | `https://geofon.gfz-potsdam.de` | Germany |
| INGV | `http://webservices.ingv.it` | Italy |
| NCEDC | `https://service.ncedc.org` | Northern California |
| SCEDC | `https://service.scedc.caltech.edu` | Southern California |
| RESIF | `https://ws.resif.fr` | France |
| ETH | `https://eida.ethz.ch` | Switzerland |

## Managing Sources

Sources are managed through the Sources page in the web interface. The following operations are available:

- **Add** -- Click the add button and provide a name and base URL. Both fields are required. The base URL should point to the root of the FDSN web services deployment (e.g., `https://service.iris.edu`).
- **Edit** -- Click on an existing source to modify its name or base URL.
- **Delete** -- Remove a source that is no longer needed.

!!! warning
    Deleting a source does not delete station data that has already been imported from that source. Imported networks, stations, and channels remain in the local database.
