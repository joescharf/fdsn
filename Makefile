# Makefile
BINARY_NAME := $(shell basename $(CURDIR))
MODULE := $(shell head -1 go.mod | awk '{print $$2}')
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS := -ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(BUILD_DATE)"

# Conditionally include UI and docs targets if their directories exist
ALL_TARGETS := build
$(if $(wildcard ui/package.json),$(eval ALL_TARGETS += ui-build ui-embed))
$(if $(wildcard docs/mkdocs.yml),$(eval ALL_TARGETS += docs-build))

# If UI exists, ensure build rebuilds outdated UI assets automatically
$(if $(wildcard ui/package.json),$(eval build: ui-embed))
$(if $(wildcard ui/package.json),$(eval ui-embed: ui-build))

.DEFAULT_GOAL := all

##@ App
.PHONY: build install run serve clean tidy test lint vet fmt mocks

build: ## Build the Go binary
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) .

install: ## Install the binary to $GOPATH/bin
	go install $(LDFLAGS) .

run: build ## Build and run the binary
	./bin/$(BINARY_NAME)

serve: build ## Start the embedded web UI server
	./bin/$(BINARY_NAME) serve

clean: ## Remove build artifacts
	rm -rf bin/
	rm -f coverage.out

tidy: ## Run go mod tidy
	go mod tidy

test: ## Run tests
	go test -v -race -count=1 ./...

test-cover: ## Run tests with coverage
	go test -v -race -count=1 -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

lint: vet ## Run golangci-lint
	@which golangci-lint > /dev/null 2>&1 || { echo "Install golangci-lint: https://golangci-lint.run/welcome/install/"; exit 1; }
	golangci-lint run ./...

vet: ## Run go vet
	go vet ./...

fmt: ## Run gofmt
	gofmt -s -w .

mocks: ## Generate mocks with mockery
	@which mockery > /dev/null 2>&1 || { echo "Install mockery: go install github.com/vektra/mockery/v2@latest"; exit 1; }
	mockery

##@ Release
.PHONY: release release-snapshot

release: ## Create a release with goreleaser
	HOMEBREW_TAP_TOKEN=$$(cat ~/.config/goreleaser/homebrew_tap_token) goreleaser release --clean

release-snapshot: ## Create a snapshot release (no publish)
	goreleaser release --snapshot --clean --skip docker,homebrew

##@ Docs (mkdocs-material via uv)
.PHONY: docs-serve docs-build docs-deps screenshots

docs-serve: ## Serve docs locally (requires uv + docs/ directory)
	@[ -d docs ] && [ -f docs/mkdocs.yml ] || { echo "No docs/ directory with mkdocs.yml found."; exit 1; }
	cd docs && uv run mkdocs serve

docs-build: ## Build docs site (requires uv + docs/ directory)
	@[ -d docs ] && [ -f docs/mkdocs.yml ] || { echo "No docs/ directory with mkdocs.yml found."; exit 1; }
	cd docs && uv run mkdocs build

docs-deps: ## Install doc dependencies (requires uv + docs/ directory)
	@[ -d docs ] && [ -f docs/pyproject.toml ] || { echo "No docs/ directory with pyproject.toml found."; exit 1; }
	cd docs && uv sync

screenshots: ## Capture documentation screenshots (requires running app on :8080)
	bash scripts/scrape.sh

##@ UI (React/shadcn via bun)
.PHONY: ui-dev ui-build ui-embed ui-deps

ui-dev: ## Start UI dev server (requires bun + ui/ directory)
	@[ -d ui ] && [ -f ui/package.json ] || { echo "No ui/ directory found. Re-run go-superinit with --ui to create one."; exit 1; }
	cd ui && bun dev

ui-build: ## Build UI for production (requires bun + ui/ directory)
	@[ -d ui ] && [ -f ui/package.json ] || { echo "No ui/ directory found. Re-run go-superinit with --ui to create one."; exit 1; }
	cd ui && bun run build

ui-embed: ## Copy built UI into internal/ui/dist for embedding
	@[ -d ui/dist ] || { echo "No ui/dist/ directory found. Run 'make ui-build' first."; exit 1; }
	rm -rf internal/ui/dist/*
	cp -r ui/dist/* internal/ui/dist/

ui-deps: ## Install UI dependencies (requires bun + ui/ directory)
	@[ -d ui ] && [ -f ui/package.json ] || { echo "No ui/ directory found. Re-run go-superinit with --ui to create one."; exit 1; }
	cd ui && bun install

##@ All
.PHONY: all deps dev

all: $(ALL_TARGETS) ## Build all existing artifacts (app + UI + docs)

deps: tidy ## Install all dependencies
	@[ -d docs ] && [ -f docs/pyproject.toml ] && (cd docs && uv sync) || true
	@[ -d ui ] && [ -f ui/package.json ] && (cd ui && bun install) || true

dev: ## Start all dev servers (app + docs + UI) in parallel
	@echo "Starting dev servers..."
	@$(MAKE) -j3 run docs-serve ui-dev 2>/dev/null || $(MAKE) run

##@ Help
.PHONY: help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
