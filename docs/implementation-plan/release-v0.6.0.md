# v0.6.0 Internal Milestone Plan

Headline:

```txt
SpecDock v0.6.0: workspace persistence foundation for browser and desktop
```

Goal:

- Make workspace state durable, explicit, and portable before adding desktop
  filesystem access.

Scope:

- Versioned workspace schema.
- Project manifest validation.
- Storage migration path.
- Safer import/export boundaries.
- Recovery and diagnostics for corrupted local state.

Out of scope:

- Electron shell.
- Native filesystem project folders.
- Cloud sync, accounts, teams, or collaboration.

## Stage 1: Versioned Workspace Schema

Tasks:

- Define a versioned project manifest in `packages/core`.
- Separate project metadata, OpenAPI source, UI preferences, and safe settings.
- Keep request bodies, response bodies, and secret values outside portable
  manifests by default.
- Add Zod validation for all imported workspace data.

Acceptance:

- Workspace files fail closed when required fields are invalid.
- Existing browser workspaces can migrate without losing imported specs.

## Stage 2: Storage Migration

Tasks:

- Add a migration layer around browser localStorage reads and writes.
- Preserve current keys during the transition.
- Add tests for missing, old, malformed, and future-version records.
- Show a recoverable error when local state cannot be loaded.

Acceptance:

- Users with pre-v0.6 state can open the app without manual cleanup.
- Malformed state does not crash the workspace UI.

## Stage 3: Export Contract Hardening

Tasks:

- Centralize export redaction outside React components.
- Add a manifest field that records redaction policy version.
- Add tests proving auth headers, cookies, tokens, request bodies, and response
  bodies are excluded by default.
- Document the portable workspace format.

Acceptance:

- Exported workspaces are safe to share by default.
- Import validation rejects unknown dangerous execution settings.

## Security Review

- Verify workspace import treats file content as untrusted input.
- Verify exports exclude secrets and request or response payloads by default.
- Verify storage migrations do not log sensitive local state.
