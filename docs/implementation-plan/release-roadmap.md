# Release Roadmap

This document is the index for public release plans after `v0.2.3`.

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
- Every release must pass:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```

## Planned Releases

- [v0.3.0: Broader import and stronger request testing](release-v0.3.0.md)
- [v0.4.0: Contract workflows and self-hosted mocking](release-v0.4.0.md)
- [v0.5.0: Adoption, integrations, and polish](release-v0.5.0.md)

## Recommended Order

1. Ship `v0.3.0` with import, request builder, SDK preset, and local export
   improvements.
2. Ship `v0.4.0` with explicit contract diff workflows and self-hosted mock
   server.
3. Ship `v0.5.0` with adoption, docs, examples, and interoperability polish.

## Cross-Release Risk Register

- Swagger 2.0 conversion can lose schema details.
- Parameter serialization must not diverge between execution and cURL preview.
- Multipart files must stay session-only.
- Project export must not leak auth secrets.
- Mock server must stay disabled in public demo deployments.
- CLI or JSON report output must stay stable once used in CI.
