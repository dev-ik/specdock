# Contributing

Thanks for helping improve SpecDock.

SpecDock is a local-first API contract workspace. Keep changes aligned with the
core flow:

```txt
Import -> Explore -> Test -> Generate
```

## Before You Start

- Check existing issues and pull requests to avoid duplicate work.
- Open an issue first for large UX, architecture, storage, proxy, or generator
  changes.
- Keep public demo behavior safe: no unrestricted public proxying.

## Development Setup

Prerequisites:

```txt
Node.js >=20.19.0 <21 or >=22.13.0
npm
```

Install and run:

```bash
nvm use
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5174
```

Use npm only. Do not use pnpm or yarn in this repository.

## Quality Checks

Run the same checks as GitHub CI before opening a pull request:

```bash
nvm use
npm run lint
npm run typecheck
npm run test
npm run test:sdk-smoke
npm run build
```

If a check is not relevant or cannot run locally, explain why in the pull
request.

## Security Expectations

SpecDock can handle API contracts, request data, and auth profile metadata.
Treat OpenAPI specs, cURL input, URLs, localStorage values, and network
responses as untrusted input.

Do not log or persist secrets such as:

- Authorization headers
- Cookie headers
- API keys or tokens
- request bodies or response bodies

Proxy mode must remain disabled by default, explicitly enabled with
`PROXY_ENABLED=true`, and protected by allowed hosts, SSRF checks, timeouts, and
size limits.

Report security issues using the instructions in [docs/SECURITY.md](docs/SECURITY.md).

## Pull Request Guidelines

- Keep changes focused and scoped to one problem.
- Include tests or explain why the change does not need tests.
- Update documentation when behavior, setup, deployment, or security posture
  changes.
- Avoid committing generated build output, local credentials, or local-only
  files.

## Release Notes

User-visible changes should be reflected in release notes under
`docs/release-notes/` when preparing a release.
