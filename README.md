# SpecDock

Local-first API contract workspace for OpenAPI teams.

SpecDock keeps the everyday API contract loop in one browser workspace:

```txt
Import -> Explore -> Test -> Generate
```

Try the hosted demo: [https://specdock.ru](https://specdock.ru)

## What It Does

- Import OpenAPI 3.0/3.1 specs from raw text, file upload, or URL.
- Explore endpoints grouped by tags with search and operation details.
- Build requests with path/query/header params, JSON body, cURL preview, and saved Base URL/Mode.
- Execute requests in Direct Browser Mode or restricted self-hosted Proxy Mode.
- Inspect saved request/response exchanges per endpoint or latest request.
- Generate TypeScript SDK files and ZIP downloads.
- Store projects, settings, safe request preferences, and history metadata in local browser storage.

The hosted demo is for evaluation. It does not provide unrestricted proxying for arbitrary third-party APIs. For controlled proxy execution, run SpecDock yourself and configure an explicit host allowlist.

## Quick Start

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

Demo OpenAPI spec:

```txt
http://127.0.0.1:5174/examples/specdock-demo-openapi.yaml
```

## Docker

Run from source:

```bash
docker compose up -d --build
```

Run the published Docker Hub image:

```yaml
services:
  specdock:
    image: docker.io/d8vik/specdock:v0.1.0
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      PUBLIC_DEMO: "true"
      PROXY_ENABLED: "false"
```

Open:

```txt
http://127.0.0.1:3000
```

Check health:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Use immutable version tags such as `docker.io/d8vik/specdock:v0.1.0`. The project does not rely on `latest` for the first release.

## Configuration

Public/demo deployments should keep backend proxy mode disabled:

```env
PUBLIC_DEMO=true
PROXY_ENABLED=false
```

Trusted self-hosted deployments can enable restricted proxy mode:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
```

Do not enable unrestricted public proxying. Proxy requests are protected by explicit host allowlists, SSRF checks, header filtering, timeout limits, and request/response size limits. Self-hosted deployments should also use outbound firewall rules for internal networks.

When running behind a trusted loopback reverse proxy, set `TRUST_PROXY=loopback`.
Leave it disabled for direct public exposure.

## Development Checks

```bash
nvm use
npm run typecheck
npm run lint
npm run test
npm run build
```

## SDK Generation Roadmap

SpecDock currently generates TypeScript SDKs with fetch or axios clients.
Post-v0.1 work tracks multi-language SDK generation in this order:

```txt
TypeScript hardening -> Python -> Go -> Java -> C# -> PHP
```

The generator roadmap keeps language-specific rendering behind shared
OpenAPI-to-SDK planning, so generated clients remain predictable while each
language can use its native HTTP and typing conventions.

## Repository Layout

```txt
apps/api        Fastify API, proxy endpoint, generation endpoint, static web serving
apps/web        React/Vite web workspace
packages/core   OpenAPI normalization, storage contracts, shared types
packages/generator TypeScript SDK generation
packages/ui     Shared UI package placeholder
docs            Architecture, security, deployment, smoke tests, and roadmap
```

## Documentation

- [Master plan](docs/SPECDOCK_MASTER_PLAN.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Data models](docs/DATA_MODELS.md)
- [Storage model](docs/STORAGE_MODEL.md)
- [SDK output spec](docs/SDK_SPEC.md)
- [Multi-language SDK generation plan](docs/implementation-plan/multi-language-sdk.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [Smoke tests](docs/SMOKE_TESTS.md)
- [Release](docs/RELEASE.md)
- [Roadmap](docs/ROADMAP.md)

## Open-Source Hygiene

The repository intentionally ignores local-only files:

```txt
.env
.history
.playwright-mcp
docs_deprecated
docs/BOOTSTRAP_REPOSITORY.md
docs/TASKS.md
```

Do not commit local credentials, private proxy targets, provider-specific hosting entrypoints, or generated build output.

## License

SpecDock is released under the [MIT License](LICENSE).
