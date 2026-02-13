---
title: Installation
description: Install FDSN Portal via Homebrew, Docker, binary download, go install, or by building from source.
---

# Installation

Choose one of the methods below to install FDSN Portal.

=== "Homebrew"

    The easiest way to install on macOS:

    ```bash
    brew install joescharf/tap/fdsn
    ```

    This installs a code-signed and notarized universal binary (Intel + Apple Silicon) with the embedded UI included. The binary is trusted by macOS Gatekeeper -- no manual quarantine removal required.

=== "Binary Download"

    Download the latest release for your platform from [GitHub Releases](https://github.com/joescharf/fdsn/releases).

    **macOS:** Download the `.pkg` installer for a signed and notarized installation, or the `.zip` archive containing the universal binary. Both are trusted by Gatekeeper.

    **Linux:** Extract the archive and move the binary to a directory on your `PATH`:

    ```bash
    # Example for Linux amd64
    tar xzf fdsn_*_linux_amd64.tar.gz
    sudo mv fdsn /usr/local/bin/
    ```

    **Windows:** Extract the `.zip` archive and add the directory containing `fdsn.exe` to your `PATH`.

=== "Docker"

    Run FDSN Portal as a container with a persistent volume for the database:

    ```bash
    docker run -p 8080:8080 -v fdsn-data:/data ghcr.io/joescharf/fdsn:latest
    ```

    The container stores the SQLite database at `/data/fdsn.db`. The `-v fdsn-data:/data` flag creates a named volume so your data persists across container restarts.

    To initialize configuration inside the container:

    ```bash
    docker run -v fdsn-data:/data ghcr.io/joescharf/fdsn:latest config init
    ```

=== "Build from Source"

    Clone the repository and use the provided Makefile:

    ```bash
    git clone https://github.com/joescharf/fdsn.git
    cd fdsn
    make deps
    make all
    ```

    `make deps` installs all required dependencies (Go modules, Bun packages for the UI, and documentation tooling). `make all` builds the React UI and compiles the Go binary in one step.

    !!! note "Bun required for source builds"

        Building from source requires [Bun](https://bun.sh/) because the React UI is bundled during the build. The `make deps` target will install Bun and its packages for you, but you can also install it manually if you prefer.

=== "go install"

    Install with `go install`:

    ```bash
    go install github.com/joescharf/fdsn@latest
    ```

    This downloads the module, builds the binary, and places it in your `$GOPATH/bin` directory. Make sure that directory is on your `PATH`.

    !!! warning "No embedded UI"

        Binaries installed via `go install` do **not** include the React UI because the UI build step requires Bun and is not part of the standard Go build. You will get a fully functional backend with API and FDSN endpoints, but no web interface. For the full experience, use Homebrew, Docker, or build from source.

## Verify Installation

After installing, confirm the binary is available:

```bash
fdsn version
```

You should see output similar to:

```
fdsn 0.1.0 (commit: abc1234, built: 2026-01-01T00:00:00Z)
```

If the command is not found, verify that the directory containing the `fdsn` binary is on your `PATH`.
