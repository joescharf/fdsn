---
title: Installation
description: Install FDSN Portal using go install or by building from source.
---

# Installation

Choose one of the methods below to install FDSN Portal.

=== "go install"

    The fastest way to get the `fdsn` binary is with `go install`:

    ```bash
    go install github.com/joescharf/fdsn@latest
    ```

    This downloads the module, builds the binary, and places it in your `$GOPATH/bin` directory. Make sure that directory is on your `PATH`.

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

## Verify Installation

After installing, confirm the binary is available:

```bash
fdsn version
```

You should see output similar to:

```
fdsn dev (commit: abc1234, built: 2024-01-01T00:00:00Z)
```

If the command is not found, verify that the directory containing the `fdsn` binary is on your `PATH`.
