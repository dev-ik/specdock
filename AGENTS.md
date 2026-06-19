# AGENTS.md — Instructions for Coding Agents

## Project

SpecDock

## Goal

Build an open-source local-first API Contract Workspace.

Core flow:

```txt
Import -> Explore -> Test -> Generate
```

## Package Manager

Use npm only.

Do not use:

- pnpm
- yarn

## Stack

Frontend:

- React
- TypeScript
- Vite
- TailwindCSS v4
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

Backend:

- Node.js
- Fastify

Packages:

- packages/core
- packages/generator
- packages/ui

## Source of Truth

Read in order:

1. docs/SPECDOCK_MASTER_PLAN.md
2. docs/IMPLEMENTATION_PLAN.md
3. docs/API_CONTRACTS.md
4. docs/DATA_MODELS.md
5. docs/SECURITY.md
6. docs/NON_FUNCTIONAL_REQUIREMENTS.md
7. docs/ROADMAP.md
8. README.md

## Security Rules

Do not implement unrestricted public proxy.

Proxy mode must be:

- disabled by default
- enabled only with `PROXY_ENABLED=true`
- protected by SSRF checks
- protected by allowed hosts
- protected by timeout and size limits

Public demo must use direct browser requests only.

After code changes, perform a security check before final reporting:

- Review the diff for new trust boundaries, network calls, persistence, logging, generated output, and request execution behavior.
- Verify no secrets, Authorization headers, Cookie headers, API keys, tokens, request bodies, or response bodies are logged or persisted unintentionally.
- Verify frontend changes do not introduce raw HTML or code execution sinks such as `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, or string-based timers.
- Verify URL handling, redirects, proxy targets, and imports do not bypass SSRF protections, allowed hosts, timeout limits, size limits, or public demo restrictions.
- Treat OpenAPI specs, imported files, cURL input, URL input, localStorage, and network responses as untrusted input; render them through safe escaping or validate before use.
- Include the security check result in the final response, including any residual risk or skipped verification.

## Architecture Rules

- Do not put OpenAPI parsing directly into React components.
- Do not put SDK generation directly into React components.
- Do not store user data in cloud.
- Do not require login.
- Do not log Authorization or Cookie headers.
- Keep business logic outside UI.
- Prefer pure functions.

## Maintainability Rules

- Keep manually maintained source and docs files at or below 250 lines.
- Start splitting a file when it grows past roughly 200 lines.
- Prefer domain modules over generic `utils` buckets.
- Accept generated or external artifacts over 250 lines only when they are not maintained by hand, such as `package-lock.json`, `dist`, `node_modules`, and vendored/generated outputs.
- Keep `docs/IMPLEMENTATION_PLAN.md` as the stable index; put detailed phase task lists under `docs/implementation-plan/`.

## Release Rules

- Use Docker Hub as the public container registry: `docker.io/d8vik/specdock`.
- Publish immutable version tags such as `docker.io/d8vik/specdock:v0.1.0`.
- Do not rely on `latest` for the v0.1.0 release.
- Create a release note for every release under `docs/release-notes/`, named after the release version, before tagging or publishing.
- Run before release:

```bash
npm audit
npm run typecheck
npm run lint
npm run test
npm run build
```
