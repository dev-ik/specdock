# SpecDock

Open-source local-first workspace for OpenAPI contracts.

SpecDock keeps the core API contract workflow in one place:

```txt
Import -> Explore -> Test -> Generate
```

## What Works In v0.1.0

- Import OpenAPI 3.0/3.1 from raw text, file upload, or URL.
- Explore endpoints grouped by tags with search and operation details.
- Build requests with path/query/header params, JSON body, cURL preview, and saved Base URL/Mode.
- Execute requests in Direct Browser Mode and inspect responses.
- Use Proxy Mode only in trusted self-hosted deployments.
- Generate TypeScript SDK files and ZIP downloads.
- Persist projects, settings, request state, response view state, and request history locally.

## Quick Start

Prerequisites:

```txt
Node.js >=20.19.0 <21 or >=22.13.0
npm
```

Install dependencies:

```bash
nvm use
npm install
```

Run the API and web app:

```bash
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

The container serves both the web app and `/api` from the same Fastify service.

## Proxy Mode

Public/demo deployments must keep proxy mode disabled:

```env
PUBLIC_DEMO=true
PROXY_ENABLED=false
```

For trusted self-hosted deployments, enable proxy mode with an explicit allowlist:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
```

Use `PROXY_ALLOW_PRIVATE_TARGETS=true` only for local or internal-network testing.

## Checks

```bash
nvm use
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentation

Start here:

- [Master plan](docs/SPECDOCK_MASTER_PLAN.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Data models](docs/DATA_MODELS.md)
- [Storage model](docs/STORAGE_MODEL.md)
- [SDK output spec](docs/SDK_SPEC.md)
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

Do not commit local credentials, private proxy targets, or generated build output.

## License

See [LICENSE](LICENSE).
