---
title: CLI Reference
description: Complete reference for all fdsn command-line interface commands and flags
---

# CLI Reference

The `fdsn` command-line interface provides commands to start the FDSN Portal server, initialize configuration, and display version information. All commands share a common set of global flags and respect the same configuration precedence: CLI flags take highest priority, followed by environment variables, then the config file, and finally built-in defaults.

## Global Flags

These flags are available on every command and subcommand.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--config` | `string` | *(none)* | Path to the configuration file |

When `--config` is not specified, FDSN Portal searches for a file named `config.yaml` in the following locations (in order):

1. `~/.config/fdsn/`
2. The current working directory

!!! tip "Environment variable overrides"

    Every configuration key can be overridden with an environment variable. The prefix is `FDSN_` and dots in key names become underscores. For example, `server.port` maps to `FDSN_SERVER_PORT` and `log.level` maps to `FDSN_LOG_LEVEL`.

    ```bash
    FDSN_SERVER_PORT=9090 fdsn serve
    FDSN_LOG_LEVEL=debug fdsn serve
    ```

---

## `fdsn serve`

Start the FDSN Portal HTTP server.

### Synopsis

```
fdsn serve [flags]
```

### Description

Start the HTTP server that serves the FDSN portal UI and API endpoints. On startup the command reads the database path (`db.path`) and server port (`server.port`) from configuration, ensures the database directory exists, opens (or creates) the SQLite database, runs any pending migrations, builds the HTTP router, and begins listening for connections.

### Flags

| Flag | Shorthand | Type | Default | Viper Key | Description |
|------|-----------|------|---------|-----------|-------------|
| `--port` | `-p` | `int` | `8080` | `server.port` | Port to listen on |

### Examples

Start the server on the default port (8080):

```bash
fdsn serve
```

Start the server on a custom port:

```bash
fdsn serve --port 9090
```

Start the server using the short flag:

```bash
fdsn serve -p 3000
```

Override the port with an environment variable:

```bash
FDSN_SERVER_PORT=9090 fdsn serve
```

Use a custom config file and enable debug logging:

```bash
FDSN_LOG_LEVEL=debug fdsn serve --config /path/to/config.yaml
```

---

## `fdsn config init`

Create the configuration directory and write a default configuration file.

### Synopsis

```
fdsn config init
```

### Description

Creates the `~/.config/fdsn/` directory (if it does not already exist) and writes a default `config.yaml` file into it. The default configuration includes the built-in application defaults for `server.port`, `db.path`, `log.level`, and the preset FDSN sources (IRIS and ORFEUS).

!!! note "Existing configuration is preserved"

    If `~/.config/fdsn/config.yaml` already exists, `fdsn config init` prints a message and exits without modifying the file. It will never overwrite an existing configuration.

### Examples

Initialize the default configuration:

```bash
fdsn config init
```

Expected output when creating a new configuration:

```
Config directory: /home/user/.config/fdsn
Config file created: /home/user/.config/fdsn/config.yaml
```

Expected output when the configuration already exists:

```
Config directory: /home/user/.config/fdsn
Config file already exists: /home/user/.config/fdsn/config.yaml
```

---

## `fdsn version`

Print the version, commit hash, and build date.

### Synopsis

```
fdsn version
```

### Description

Displays the current FDSN Portal version string, the Git commit hash, and the build timestamp. These values are injected at build time via Go linker flags (`ldflags`). During local development the output defaults to `dev` / `unknown`.

### Examples

```bash
fdsn version
```

Example output from a release build:

```
fdsn v1.2.0 (commit: a1b2c3d, built: 2025-06-15T10:30:00Z)
```

Example output from a development build:

```
fdsn dev (commit: unknown, built: unknown)
```
