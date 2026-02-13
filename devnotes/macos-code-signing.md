# macOS Code Signing and Notarization for FDSN Releases

*2026-02-13T18:15:54Z*

## Overview

FDSN releases now include macOS code signing and notarization. macOS binaries are built as true universal binaries (Intel + Apple Silicon), signed with an Apple Developer ID, and notarized through Apple's notary service. This means users can download and run the binary without Gatekeeper warnings.

The release process has moved from GitHub Actions CI to a local workflow using GoReleaser, which allows the signing toolchain (pycodesign.py) to access the macOS Keychain.

## What Changed

### GoReleaser Config (.goreleaser.yml)

The single combined build was split into three platform-specific builds:
- **fdsn** -- Linux (amd64, arm64)
- **fdsn-macos** -- Darwin (amd64, arm64) with universal binary merging and pycodesign post-hook
- **fdsn-windows** -- Windows (amd64, arm64)

Each platform gets its own archive format: tar.gz for Linux, zip for macOS (binary-only, for Homebrew cask), and zip for Windows.

The config was also updated to use the latest non-deprecated GoReleaser v2 APIs:
- `archives.builds` → `archives.ids`
- `brews` → `homebrew_casks` (Casks directory, with binaries field)
- `dockers` + `docker_manifests` → `dockers_v2` (consolidated multi-platform config)

Releases are created as **drafts** for review before publishing.

### New Files

| File | Purpose |
|------|---------|
| `fdsn_pycodesign.ini` | Pycodesign config with signing identities, bundle ID, and dist paths |
| `goreleaser-tag-and-release.zsh` | Tags next semver (via svu), pushes, runs goreleaser |
| `goreleaser-undo-untag-current-release.zsh` | Removes current tag from local and remote for recovery |
| `release_notes.md` | Template to edit before each release |

### Deleted Files

| File | Reason |
|------|--------|
| `.github/workflows/release.yml` | CI cannot do macOS code signing; replaced by local release scripts |

## Verification

```bash
goreleaser check 2>&1
```

```output
  • checking                                  path=.goreleaser.yml
  • 1 configuration file(s) validated
  • thanks for using GoReleaser!
```

The GoReleaser config validates cleanly with no deprecation warnings.

Verify the three build IDs and universal binary config are present:

```bash
grep -E '^\s+- id:|^universal_binaries:|^\s+post:' .goreleaser.yml
```

```output
  - id: fdsn
  - id: fdsn-macos
  - id: fdsn-windows
universal_binaries:
  - id: fdsn-macos
      post: /usr/local/bin/pycodesign.py fdsn_pycodesign.ini -O {{ .Version }}
  - id: fdsn-linux-archive
  - id: fdsn-macos-archive
  - id: fdsn-windows-archive
```

Verify the pycodesign configuration:

```bash
cat fdsn_pycodesign.ini
```

```output
[identification]
application_id = 4164C5F951A8EF4C43F3E761C407E6DED8B12BF5
installer_id = FECDDF623F2B1E0E195CA19A2BF73C8450CF6AC1
keychain-profile = SCHARFNADO_LLC

[package_details]
package_name = ./dist/fdsn_macos_universal
bundle_id = com.scharfnado.fdsn
file_list = ./dist/fdsn-macos_darwin_all/fdsn
installation_path = /usr/local/bin
entitlements = None
version = 0.0.0
```

Verify the release scripts are executable:

```bash
ls -la goreleaser-*.zsh
```

```output
-rwxr-xr-x 1 joescharf staff 327 Feb 13 11:10 goreleaser-tag-and-release.zsh
-rwxr-xr-x 1 joescharf staff 338 Feb 13 11:10 goreleaser-undo-untag-current-release.zsh
```

Verify the CI release workflow was removed and only ci.yml and docs.yml remain:

```bash
ls .github/workflows/
```

```output
ci.yml
docs.yml
```

## Release Workflow

To create a release:

1. Edit `release_notes.md` with the changes for this version
2. Run `./goreleaser-tag-and-release.zsh` -- this tags, pushes, builds, signs, and creates a draft GitHub release
3. Review the draft on GitHub and publish when ready

To undo a failed release: `./goreleaser-undo-untag-current-release.zsh`

To test without publishing: `goreleaser release --snapshot --clean --skip homebrew,docker`

## Prerequisites

- `pycodesign.py` on PATH (macOS code signing and notarization)
- `svu` installed (semantic version utility)
- `~/.config/goreleaser/github_token` (Classic PAT with repo + write:packages scopes)
- macOS Keychain unlocked with SCHARFNADO_LLC profile
- Docker Desktop running (for container image builds)
