# Contributing

Contributions to the FDSN Portal are welcome. This page outlines the code conventions, testing practices, and pull request process to help you get started.

## Code Style

### Go

The project follows standard Go formatting conventions. Run `make fmt` before committing to ensure your code is formatted with `gofmt -s`.

### TypeScript / React

The frontend uses Tailwind CSS utility classes for styling and shadcn/ui for UI components. Follow the existing patterns in `ui/src/components/` when adding new features.

### Linting

Run the following before submitting changes:

```bash
make lint   # Run golangci-lint
make vet    # Run go vet
```

## Testing

- Run `make test` to execute all Go tests with the race detector enabled.
- Run `make test-cover` to generate a coverage report.
- Write tests for new functionality. Place test files alongside the code they test, following Go conventions (`*_test.go`).

## Building

| Command | What it does |
|---------|-------------|
| `make all` | Build everything: UI production build, embed into Go, compile binary |
| `make build` | Build just the Go binary (assumes UI is already built and embedded) |
| `make ui-build` | Build just the UI for production |

The final binary is output to `bin/fdsn`.

## Pull Request Process

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes.
4. Run the full check suite:
    ```bash
    make fmt && make lint && make vet && make test
    ```
5. Commit with clear, descriptive messages.
6. Open a pull request against `main`.

## Releasing

Releases are built **locally** using [GoReleaser](https://goreleaser.com/) so that macOS binaries can be code-signed and notarized. There is no CI release workflow.

### Prerequisites

| Tool | Purpose |
|------|---------|
| `goreleaser` | Build and publish release artifacts |
| `svu` | Semantic version utility for auto-tagging |
| `pycodesign.py` | macOS code signing and notarization (must be on PATH) |
| Docker Desktop | Building and pushing container images |

You also need:

- `~/.config/goreleaser/github_token` -- a Classic PAT with `repo` and `write:packages` scopes
- macOS Keychain unlocked with the `SCHARFNADO_LLC` signing profile

### Release Process

1. Edit `release_notes.md` with the changes for this release.
2. Run the tag-and-release script:

    ```bash
    ./goreleaser-tag-and-release.zsh
    ```

    This shows the current and next version (via `svu`), tags the repo, pushes the tag, and runs `goreleaser release`. The macOS binary is automatically signed, notarized, and bundled as a `.pkg` installer.

3. Review the **draft** release on GitHub and publish it when ready.

### Recovering from a Failed Release

If a release fails partway through, undo the tag and try again:

```bash
./goreleaser-undo-untag-current-release.zsh
```

### Snapshot Testing

To test the release process without publishing:

```bash
goreleaser release --snapshot --clean --skip homebrew,docker
```

Check `dist/` for the expected artifacts (linux archives, windows archives, macOS zip, and `fdsn_macos_universal.pkg`).

## Documentation

The documentation site is built with mkdocs-material and managed through uv.

| Command | Purpose |
|---------|---------|
| `make docs-serve` | Preview the documentation site locally |
| `make docs-build` | Build the static documentation site |

When adding or changing user-facing features, update the relevant documentation pages under `docs/`.
