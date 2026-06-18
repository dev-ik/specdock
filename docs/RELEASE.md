# Release

This document describes the manual release path for `v0.2.3`.

## Preflight

```bash
nvm use
npm ci
npm run typecheck
npm run lint
npm run test
npm run test:sdk-smoke
npm run build
npm audit --audit-level=moderate
```

## Docker Image

Build a local image for smoke testing:

```bash
docker build \
  -t docker.io/d8vik/specdock:v0.2.3 \
  .
```

Smoke the image locally:

```bash
docker run --rm -p 127.0.0.1:3000:3000 \
  -e PUBLIC_DEMO=true \
  -e PROXY_ENABLED=false \
  docker.io/d8vik/specdock:v0.2.3
```

Check:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsSI http://127.0.0.1:3000/examples/specdock-demo-openapi.yaml
```

Publish the Docker Hub multi-arch version tag:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t docker.io/d8vik/specdock:v0.2.3 \
  --push \
  .
```

Always publish an immutable version tag. Do not publish `latest` unless you intentionally want a moving tag.

## Git Release

Do not move old release tags. Create a new immutable tag for every patch
release.

```bash
git tag v0.2.3
git push origin main
git push origin v0.2.3
git push gitlab main
git push gitlab v0.2.3
```

The GitHub Actions Docker workflow publishes the Docker Hub image when `v*` tags are pushed, assuming these repository secrets exist:

```txt
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```
