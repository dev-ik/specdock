# Release Roadmap

This document is the index for internal milestones after `v0.2.3` and the
single planned public stable release, `v1.0.0`.

Core flow:

```txt
Import -> Explore -> Test -> Generate
```

## Release Rules

- Keep SpecDock local-first, self-hosted, and open-source.
- Public demo stays safe: `PUBLIC_DEMO=true`, `PROXY_ENABLED=false`.
- Do not add unrestricted public proxy behavior.
- Treat specs, cURL input, URLs, localStorage, and network responses as
  untrusted input.
- Keep business logic outside React components.
- Keep desktop renderer code isolated from Node.js APIs.
- Route desktop filesystem and process access through narrow, validated IPC.
- Treat `v0.3.0` through `v0.9.0` as internal milestones unless the project
  explicitly decides to publish one of them.
- Do not create public GitHub releases, Docker images, or Git tags for internal
  milestones.
- Create `docs/release-notes/<version>.md` before tagging or publishing a
  public release.
- Every public release must pass:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```

## Planned Milestones

- [v0.3.0: Broader import and stronger request testing](release-v0.3.0.md)
- v0.4.0 skipped; contract workflow work is tracked as `v0.5.0`.
- [v0.5.0: Contract workflows and self-hosted mocking](release-v0.5.0.md)
- [v0.6.0: Workspace persistence foundation](release-v0.6.0.md)
- [v0.7.0: Local generation and portable projects](release-v0.7.0.md)
- [v0.8.0: Electron desktop technical preview](release-v0.8.0.md)
- [v0.9.0: Desktop beta packaging and hardening](release-v0.9.0.md)
- [v1.0.0: Stable Electron desktop workspace](release-v1.0.0.md)

## Recommended Order

1. Complete internal milestone `v0.3.0` with import, request builder, SDK
   preset, and local export improvements.
2. Skip `v0.4.0` and complete explicit contract diff workflows and self-hosted
   mock server as internal milestone `v0.5.0`.
3. Complete internal milestone `v0.6.0` with a durable workspace model that can
   later move from browser storage to desktop files.
4. Complete internal milestone `v0.7.0` with local generation and project
   portability workflows.
5. Complete internal milestone `v0.8.0` as an Electron technical preview for
   local dogfooding.
6. Complete internal milestone `v0.9.0` as a packaged desktop beta with
   hardening complete.
7. Publish `v1.0.0` as the first stable public desktop-first local workspace
   release.

## Desktop Direction

`v1.0.0` should be the first stable desktop release, not just a web wrapper.
The desktop app should preserve the web app's local-first model while adding
native filesystem workflows:

- local project folders
- import/export through native file dialogs
- SDK generation into selected directories
- optional local API execution through the existing guarded backend path
- no account, cloud sync, or hosted persistence requirement

Electron is the planned desktop runtime because SpecDock already depends on
Node.js, Fastify, and local SDK generation code. The desktop shell must keep
renderer code sandboxed and expose only allowlisted IPC operations.

## Cross-Release Risk Register

- Swagger 2.0 conversion can lose schema details.
- Parameter serialization must not diverge between execution and cURL preview.
- Multipart files must stay session-only.
- Project export must not leak auth secrets.
- Mock server must stay disabled in public demo deployments.
- CLI or JSON report output must stay stable once used in CI.
- Desktop IPC must not become a generic filesystem, shell, or network bridge.
- Desktop packaging must not weaken public-demo proxy restrictions.
