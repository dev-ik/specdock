# SpecDock Master Plan

## Vision

SpecDock is a local-first API Contract Workspace.

Mission:

Turn API specifications into a practical development workspace.

Core flow:

```txt
Import -> Explore -> Test -> Generate
```

## Positioning

Category:

```txt
API Contract Workspace
```

Not:

- Postman replacement
- Swagger UI clone
- API Gateway
- Cloud platform

## Product Principles

- Open Source
- Local First
- Self Hosted
- OpenAPI First
- Security First

## MVP Scope

Included:

- OpenAPI import
- Endpoint explorer
- Search
- Request builder
- Direct browser requests
- Response viewer
- CURL export
- TypeScript SDK generation
- ZIP export

Excluded:

- Team collaboration
- Cloud sync
- OAuth flows
- Mock server
- Contract diff

## Technical Stack

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

Shared:

- npm workspaces
- swagger-parser
- JSZip

Deployment:

- Docker
- Nginx
- VPS

## Repository Structure

```txt
specdock/
  apps/
    web/
    api/
  packages/
    core/
    generator/
    ui/
  docs/
```

## Security Model

Public demo:

```env
PROXY_ENABLED=false
```

Allowed:

- import specs
- explore endpoints
- generate SDK
- direct browser requests

Disabled:

- arbitrary backend requests

Reason:

- SSRF
- port scanning
- DDoS relay
- CORS bypass

## Development Workflow

1. Read AGENTS.md.
2. Read IMPLEMENTATION_PLAN.md.
3. Implement one task at a time.
4. Run tests.
5. Commit.
