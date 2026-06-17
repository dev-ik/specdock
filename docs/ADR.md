# Architecture Decision Records

## ADR-001 — Use npm workspaces

Decision:

Use npm workspaces.

Reason:

- simpler onboarding
- no extra package manager
- matches project constraint

Status:

Accepted.

## ADR-002 — Use Vite React app for web

Decision:

Use Vite + React + TypeScript.

Reason:

- no SSR needed
- fast MVP development
- easy future Tauri wrapping

Status:

Accepted.

## ADR-003 — Use Fastify for backend

Decision:

Use Fastify.

Reason:

- small Node.js server
- good TypeScript support
- enough for API, proxy and generation endpoints

Status:

Accepted.

## ADR-004 — Use localStorage in MVP

Decision:

Store MVP state in browser localStorage.

Reason:

- local-first
- no backend persistence
- no accounts
- no cloud sync
- simplest implementation

Status:

Accepted.

## ADR-005 — Disable proxy in public demo

Decision:

Public demo must run with:

```env
PROXY_ENABLED=false
```

Reason:

Prevent:

- SSRF
- port scanning
- DDoS relay
- CORS bypass abuse

Status:

Accepted.

## ADR-006 — Use TailwindCSS and shadcn/ui

Decision:

Use TailwindCSS v4 and shadcn/ui.

Reason:

- fast MVP UI
- developer-first visual style
- AI-agent friendly
- good dark mode support

Status:

Accepted.

## ADR-007 — API_CONTRACTS.md is source of truth

Decision:

`docs/API_CONTRACTS.md` is the only source of truth for backend API contracts.

Reason:

Avoid drift between `API.md`, implementation and tests.

Status:

Accepted.
