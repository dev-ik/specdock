# SpecDock v0.2.3

SpecDock is a local-first API contract workspace for OpenAPI teams:

```txt
Import -> Explore -> Test -> Generate
```

This patch release is the recommended public/demo release tag. It includes the
public-demo Direct Browser Mode host restriction in the published release target
and aligns the public documentation with the auth profiles feature.

Use `docker.io/d8vik/specdock:v0.2.3` for new deployments. Do not rely on
`latest`.

## Why v0.2.3

`v0.2.2` shipped the multi-language SDK generation release. After that tag, the
public demo policy was tightened so hosted demo deployments can restrict Direct
Browser Mode to known demo hosts. `v0.2.3` publishes that public-demo behavior
as an immutable Docker tag and updates the docs around local credential storage.

## Docker Quick Start

Pull the published image:

```bash
docker pull docker.io/d8vik/specdock:v0.2.3
```

Run public-demo mode locally:

```bash
docker run -d --name specdock \
  -p 127.0.0.1:3000:3000 \
  -e PUBLIC_DEMO=true \
  -e PROXY_ENABLED=false \
  docker.io/d8vik/specdock:v0.2.3
```

Open:

```txt
http://127.0.0.1:3000
```

Health check:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

## Included In The MVP

- Import OpenAPI 3.0/3.1 specs from raw text, file upload, URL, or cURL.
- Explore endpoints grouped by tags with search and operation details.
- Build requests with path, query, header params, auth profiles, JSON bodies,
  and cURL previews.
- Execute requests in Direct Browser Mode.
- Use restricted Proxy Mode for trusted self-hosted deployments.
- Inspect in-session request/response exchanges per endpoint or latest request.
- Generate SDK files for TypeScript, Python, Go, Java, C#, and PHP.
- Download generated SDK output as ZIP files.
- Store projects, settings, auth profiles, safe request preferences, and history
  metadata locally in browser storage.

## Public Demo Defaults

Public/demo deployments should use:

```env
PUBLIC_DEMO=true
DEMO_DIRECT_ALLOWED_HOSTS=dummyjson.com,petstore3.swagger.io,httpbin.org
PROXY_ENABLED=false
```

In this mode:

- Backend proxy execution is disabled.
- Direct Browser Mode is limited to `DEMO_DIRECT_ALLOWED_HOSTS`.
- Browser CORS rules still decide which allowed upstream APIs can be called.
- Users should self-host SpecDock to test arbitrary custom API hosts.

## Self-Hosted Proxy Mode

Proxy Mode is intended only for trusted self-hosted deployments:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
```

Proxy requests are protected by explicit host allowlists, SSRF checks, timeout
limits, request/response size limits, and hop-by-hop header filtering. Do not
enable unrestricted public proxying.

## Auth Profile Storage

Auth profiles are local browser data. They may contain bearer tokens, API keys,
basic-auth passwords, cookies, CSRF tokens, origin values, and referers.

SpecDock stores auth profiles in browser `localStorage`; it does not sync them
to a cloud backend. Avoid storing credentials on shared or public devices.
Manual request headers and bodies remain session-only by default.

## Security Notes

- Public/demo deployments keep backend proxy mode disabled by default.
- Direct Browser Mode is restricted when `PUBLIC_DEMO=true`.
- Sensitive query values are redacted from saved request history.
- Generated SDK code is emitted as files and is not executed inside SpecDock.
- Generated output paths remain relative and traversal-safe.

## Verified

Release checks passed on Node.js 20.19.0:

```bash
npm install --package-lock-only --ignore-scripts
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```

`npm audit` reported 0 vulnerabilities.

The Docker image was published as a multi-arch image for `linux/amd64` and
`linux/arm64`.
