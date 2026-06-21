# v1.0.0 Release Plan

Headline:

```txt
SpecDock v1.0.0: stable Electron desktop API Contract Workspace
```

Goal:

- Release SpecDock as a stable desktop-first, local-first API Contract
  Workspace while preserving the self-hosted web distribution.

Scope:

- Stable Electron desktop app for macOS, Windows, and Linux.
- Local project folders.
- Native import/export.
- SDK generation to local folders.
- Built-in local backend lifecycle.
- Final desktop security hardening and release documentation.

Implemented baseline:

- All package manifests, API health version, and generator metadata aligned to
  `1.0.0`.
- Manual release docs updated for the first public stable Docker tag
  `docker.io/d8vik/specdock:v1.0.0`.
- Desktop checksum generation script added for release artifacts.
  `npm run release:checksums` writes `SHA256SUMS.txt`.
- Unsigned desktop directory packaging verified for macOS arm64 as the local
  smoke artifact path.

Out of scope:

- Cloud accounts or sync.
- Hosted team collaboration.
- Automatic package publishing.
- Running generated SDK code.
- Unrestricted public proxy behavior.

## Stage 1: Stable Desktop Experience

Tasks:

- Polish first-run flow for creating or opening local projects.
- Make project status, unsaved changes, and import errors explicit.
- Keep keyboard and narrow-window workflows usable.
- Add desktop-specific release notes and troubleshooting docs.

Acceptance:

- A new user can install the app, import a spec, test an operation, and
  generate an SDK without reading repository setup instructions.
- Existing self-hosted web workflows remain available.

## Stage 2: Stable Local Backend

Tasks:

- Harden startup, shutdown, and restart behavior for the bundled backend.
- Keep backend loopback-only by default.
- Apply the same timeout, body-size, SSRF, and allowed-host protections used by
  self-hosted mode.
- Add diagnostics that avoid logging secrets or payload bodies.

Acceptance:

- Desktop backend failures are recoverable and visible to the user.
- Desktop does not expose a network service beyond loopback by default.

## Stage 3: Desktop Release Artifacts

Tasks:

- Produce versioned desktop artifacts for supported platforms.
- Publish checksums for downloadable artifacts.
- Document install, upgrade, uninstall, and data-location behavior.
- Keep Docker image publishing for self-hosted users.

Acceptance:

- `v1.0.0` has immutable desktop and Docker release artifacts.
- Users can verify downloaded artifacts with published checksums.

## Stage 4: Final Compatibility Pass

Tasks:

- Run release checks for web, API, generator, and desktop packages.
- Run smoke tests on supported desktop platforms.
- Verify project folders created by `v0.9.0` beta still open.
- Verify exported browser workspaces can be imported into desktop.

Acceptance:

- The stable desktop app can open beta project folders or provides a documented
  migration path.
- Web export to desktop import works without exposing secrets.

## Security Review

- Verify renderer isolation, preload allowlist, and IPC validation.
- Verify backend loopback binding and proxy restrictions.
- Verify no secrets, request bodies, or response bodies are logged.
- Verify native filesystem writes are limited to user-selected paths.
