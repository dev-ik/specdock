# SpecDock v0.2.2

Multi-language SDK generation release for SpecDock.

SpecDock now generates SDK files for TypeScript, Python, Go, Java, C#, and PHP, with generated SDK metadata, release smoke checks, and CI validation for the new generation flow.

## Docker

Pull the published image:

```bash
docker pull docker.io/d8vik/specdock:v0.2.2
```

Run locally:

```bash
docker run -d --name specdock \
  -p 127.0.0.1:3000:3000 \
  -e PUBLIC_DEMO=true \
  -e PROXY_ENABLED=false \
  docker.io/d8vik/specdock:v0.2.2
```

Run with Docker Compose:

```yaml
services:
  specdock:
    image: docker.io/d8vik/specdock:v0.2.2
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

## Included

- OpenAPI 3.0/3.1 import from file, URL, or raw text.
- Endpoint explorer with search and operation details.
- Request builder with path, query, header, and JSON body support.
- Direct browser request mode for public/demo deployments.
- Restricted self-hosted proxy mode with allowlist and SSRF protections.
- Local-first project/settings/history storage.
- ZIP download for generated SDK files.

## New In This Release

- TypeScript SDK generation with fetch or axios clients.
- Python SDK generation with httpx.
- Go SDK generation with the standard library.
- Java SDK generation with `java.net.http.HttpClient` and Jackson.
- C# SDK generation with `HttpClient` and `System.Text.Json`.
- PHP SDK generation with Guzzle.
- Generated SDK `README.md` for every language.
- Generated `specdock.manifest.json` with language, runtime target, naming style, generator version, and file list.
- Language selector in the Generate panel.
- Runtime target hints for every supported SDK language.
- Generated file diffs scoped to the active language output.
- SDK smoke checks in CI.
- GitLab CI verification alongside GitHub Actions.

## Runtime Targets

| Language | Runtime target | HTTP runtime |
| --- | --- | --- |
| TypeScript | TypeScript 5.x, Node.js 20+ or modern browsers | fetch or axios |
| Python | Python >=3.11 | httpx >=0.27.0 |
| Go | Go 1.22 | net/http |
| Java | Java 17 | java.net.http + Jackson 2.17.2 |
| C# | .NET 8.0 | HttpClient + System.Text.Json |
| PHP | PHP >=8.1 | Guzzle ^7.0 |

## Fixed

- PHP generated SDK Composer metadata now passes strict validation.
- SDK smoke test timeout now supports CI environments with extra language toolchains installed.
- Composer root version is set during PHP SDK smoke validation.
- GitHub Actions workflows use Node-24-compatible action versions.
- Generated file names are easier to read in the UI.

## Security

- Proxy behavior is unchanged.
- Public/demo deployments keep backend proxy mode disabled by default.
- Generated SDK code is emitted as files and is not executed inside SpecDock.
- Generated output paths remain relative and traversal-safe.
- No unrestricted public proxy behavior was added.

## Verified

Release checks passed:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```

`npm audit` reported 0 vulnerabilities.
