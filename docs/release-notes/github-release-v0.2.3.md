# SpecDock v0.2.3

Public-readiness patch release for SpecDock.

This release includes the public-demo Direct Browser Mode host restriction in
the published release target and updates the documentation for local auth
profile storage.

## Docker

Pull the published image:

```bash
docker pull docker.io/d8vik/specdock:v0.2.3
```

Run locally:

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

## Included

- OpenAPI 3.0/3.1 import from file, URL, raw text, or cURL.
- Endpoint explorer with search and operation details.
- Request builder with path, query, header, auth profile, and JSON body support.
- Public-demo Direct Browser Mode restricted to configured demo hosts.
- Restricted self-hosted proxy mode with allowlist and SSRF protections.
- TypeScript, Python, Go, Java, C#, and PHP SDK generation.
- ZIP download for generated SDK files.

## Security

- Public/demo deployments keep backend proxy mode disabled by default.
- Direct Browser Mode is limited to `DEMO_DIRECT_ALLOWED_HOSTS` when `PUBLIC_DEMO=true`.
- Auth profiles are stored only in browser `localStorage`; avoid shared or public devices.
- Manual request headers and bodies remain session-only by default.

## Verified

Release checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```
