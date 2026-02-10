# Configuration

FDSN Portal uses [Viper](https://github.com/spf13/viper) for configuration management, supporting a YAML config file, environment variables, and CLI flags. This page covers every configuration option, file locations, and how the different configuration sources are resolved.

## Config File

The default configuration file is located at:

```
~/.config/fdsn/config.yaml
```

### Creating the Config File

Run `fdsn config init` to generate a config file populated with default values:

```bash
fdsn config init
```

This will:

- Create the `~/.config/fdsn/` directory if it does not already exist.
- Write the default configuration to `~/.config/fdsn/config.yaml`.

!!! note "Config init does not overwrite"

    If `~/.config/fdsn/config.yaml` already exists, `fdsn config init` will **not** overwrite it. This prevents accidental loss of customized settings. Delete or rename the existing file first if you want to regenerate defaults.

### Overriding the Config File Path

You can point FDSN Portal at a different config file with the `--config` flag:

```bash
fdsn --config /path/to/custom-config.yaml serve
```

## Configuration Keys

The table below lists every configuration key, its default value, and a description.

| Key | Default | Description |
|-----|---------|-------------|
| `server.port` | `8080` | HTTP server listen port |
| `db.path` | `~/.config/fdsn/fdsn.db` | Path to the SQLite database file. Falls back to `./fdsn.db` if the config directory is unavailable. |
| `log.level` | `info` | Application log level |
| `sources` | *(see below)* | Array of preset FDSN data sources |

!!! info "Available log levels"

    The `log.level` key accepts the following values, from most verbose to least verbose:

    `trace` | `debug` | `info` | `warn` | `error` | `fatal` | `panic`

### Default Sources

The `sources` key ships with two pre-configured FDSN data centers:

| Name | Base URL | Description |
|------|----------|-------------|
| IRIS | `https://service.iris.edu` | IRIS Data Management Center |
| ORFEUS | `https://www.orfeus-eu.org` | ORFEUS Data Center (Europe) |

## Example Config File

Below is a complete `config.yaml` showing every key at its default value:

```yaml
server:
  port: 8080

db:
  path: ~/.config/fdsn/fdsn.db

log:
  level: info

sources:
  - name: IRIS
    base_url: https://service.iris.edu
    description: IRIS Data Management Center
  - name: ORFEUS
    base_url: https://www.orfeus-eu.org
    description: ORFEUS Data Center (Europe)
```

## Environment Variables

Every configuration key can be set through an environment variable. FDSN Portal uses Viper's `AutomaticEnv()` with the following conventions:

- **Prefix:** `FDSN`
- **Separator mapping:** The `.` separator in config keys maps to `_` in environment variable names.

!!! tip "Setting config via environment variables"

    Environment variables are useful for containerized deployments or CI/CD pipelines where editing a config file is impractical. Combine the `FDSN` prefix with the uppercased, underscore-separated key name:

    ```bash
    export FDSN_SERVER_PORT=9090
    export FDSN_DB_PATH=/data/fdsn.db
    export FDSN_LOG_LEVEL=debug
    ```

    These variables will override the corresponding values in the config file.

## Configuration Precedence

When the same key is set in multiple places, FDSN Portal resolves the value using the following precedence order (highest priority first):

1. **CLI flags** -- e.g., `--port 9090`
2. **Environment variables** -- e.g., `FDSN_SERVER_PORT=9090`
3. **Config file** -- values in `~/.config/fdsn/config.yaml`
4. **Defaults** -- built-in defaults set via `viper.SetDefault()`

A CLI flag will always win over an environment variable, which in turn wins over the config file, which wins over the compiled-in default.

## File Locations

| File | Default Path | Purpose |
|------|-------------|---------|
| Configuration file | `~/.config/fdsn/config.yaml` | All application settings |
| SQLite database | `~/.config/fdsn/fdsn.db` | Persistent data storage (stations, sources, etc.) |
| Config directory | `~/.config/fdsn/` | Parent directory for all FDSN Portal data files |

Both paths resolve relative to the current user's home directory. The config directory and its contents are created automatically by `fdsn config init`.
