# Release

This document describes the manual release path for `v1.0.0`.

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

## Desktop Artifacts

Build unsigned desktop artifacts before tagging:

```bash
npm run package:mac --workspace @specdock/desktop
npm run package:win --workspace @specdock/desktop
npm run package:linux --workspace @specdock/desktop
npm run release:checksums
```

Publish `apps/desktop/release/desktop/SHA256SUMS.txt` alongside the desktop
downloads so users can verify artifacts.

GitHub-hosted desktop artifacts are published by the `Desktop Release` workflow.
Push an immutable `v*` tag, or run the workflow manually with an existing tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow builds macOS, Windows, and Linux artifacts, generates
`SHA256SUMS.txt`, and attaches everything to the matching GitHub Release.
Desktop artifacts are unsigned by default for open-source releases. If signing
secrets are configured, macOS and Windows artifacts are signed automatically.

GitHub desktop signing secrets:

```txt
MAC_CSC_LINK
MAC_CSC_KEY_PASSWORD
APPLE_API_KEY_BASE64
APPLE_API_KEY_ID
APPLE_API_ISSUER
WIN_CSC_LINK
WIN_CSC_KEY_PASSWORD
```

These secrets are optional. `MAC_CSC_LINK` and `WIN_CSC_LINK` should contain the
base64-encoded certificate files accepted by Electron Builder. macOS
notarization uses the Apple App Store Connect API key secrets above. Store the
downloaded `.p8` file as `APPLE_API_KEY_BASE64`; the workflow writes it to a
temporary file and passes that path to Electron Builder. Linux artifacts are not
code-signed by this workflow; publish `SHA256SUMS.txt` with the downloads.

Create base64 certificate values without line breaks:

```bash
base64 -i DeveloperIDApplication.p12 | tr -d "\n"
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d "\n"
base64 -i windows-code-signing.pfx | tr -d "\n"
```

## Docker Image

Build a local image for smoke testing:

```bash
docker build \
  -t docker.io/d8vik/specdock:v1.0.0 \
  .
```

Smoke the image locally:

```bash
docker run --rm -p 127.0.0.1:3000:3000 \
  -e PUBLIC_DEMO=true \
  -e PROXY_ENABLED=false \
  docker.io/d8vik/specdock:v1.0.0
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
  -t docker.io/d8vik/specdock:v1.0.0 \
  --push \
  .
```

Always publish an immutable version tag. Do not publish `latest` unless you intentionally want a moving tag.

## Git Release

Before creating or pushing a release tag, create the release note:

```txt
docs/release-notes/v1.0.0.md
```

The release note is required for every release and must be named after the
release version.

Do not move old release tags. Create a new immutable tag for every patch
release.

```bash
git tag v1.0.0
git push origin main
git push origin v1.0.0
git push gitlab main
git push gitlab v1.0.0
```

The GitHub Actions Docker workflow publishes the Docker Hub image when `v*` tags are pushed, assuming these repository secrets exist:

```txt
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```
