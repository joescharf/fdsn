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

## Documentation

The documentation site is built with mkdocs-material and managed through uv.

| Command | Purpose |
|---------|---------|
| `make docs-serve` | Preview the documentation site locally |
| `make docs-build` | Build the static documentation site |

When adding or changing user-facing features, update the relevant documentation pages under `docs/`.
