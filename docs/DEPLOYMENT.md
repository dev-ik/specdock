# Deployment

SpecDock is deployed as one Node service that serves:

- the Fastify API under `/api`
- the built web app from `apps/web/dist`
- SPA fallback to `index.html` for non-API routes

## Docker

Build and start the default public-demo configuration:

```bash
docker compose up -d --build
```

The app listens on:

```txt
http://127.0.0.1:3000
```

Default compose settings keep backend proxy mode disabled:

```env
PUBLIC_DEMO=true
PROXY_ENABLED=false
WEB_DIST_DIR=/app/apps/web/dist
TRUST_PROXY=false
```

Published image:

```txt
https://hub.docker.com/r/d8vik/specdock
```

Published image tags:

```txt
docker.io/d8vik/specdock:v0.1.0
docker.io/d8vik/specdock:v0.2.2
```

Use version tags for repeatable deployments. Do not rely on `latest`.

## Run Without Cloning

You can run the
[published Docker Hub image](https://hub.docker.com/r/d8vik/specdock)
directly if you do not want to clone the repository:

```bash
docker run -d --name specdock \
  -p 127.0.0.1:3000:3000 \
  -e PUBLIC_DEMO=true \
  -e PROXY_ENABLED=false \
  docker.io/d8vik/specdock:v0.2.2
```

To pass more configuration, either add more `-e` flags or use an env file:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
PROXY_TIMEOUT_MS=15000
PROXY_MAX_REQUEST_BYTES=5242880
PROXY_MAX_RESPONSE_BYTES=10485760
TRUST_PROXY=false
```

```bash
docker run -d --name specdock \
  -p 127.0.0.1:3000:3000 \
  --env-file ./specdock.env \
  docker.io/d8vik/specdock:v0.2.2
```

Keep `PROXY_ENABLED=false` for public demo use. If you enable proxy mode,
set `PUBLIC_DEMO=false` and provide a narrow `PROXY_ALLOWED_HOSTS` allowlist.

Check health:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

## Self-Hosted Proxy Mode

Enable proxy mode only for trusted self-hosted deployments. Always use an explicit allowlist:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
PROXY_TIMEOUT_MS=15000
PROXY_MAX_REQUEST_BYTES=5242880
PROXY_MAX_RESPONSE_BYTES=10485760
TRUST_PROXY=false
```

For internal-network testing only, private targets can be allowed explicitly:

```env
PROXY_ALLOW_PRIVATE_TARGETS=true
```

Do not enable unrestricted public proxying.

Configured proxy timeout and body limits are capped by SpecDock's built-in safe defaults.
Proxy response bodies are read with a streaming size cap.

## Nginx Reverse Proxy

Run SpecDock on loopback and put Nginx in front of it:

```nginx
server {
  listen 80;
  server_name specdock.example.com;

  client_max_body_size 10m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

For HTTPS, terminate TLS in Nginx and keep the container bound to `127.0.0.1:3000`.
If Nginx is the only trusted proxy and it strips user-controlled forwarding
headers, set `TRUST_PROXY=loopback` so app-level rate limits can use client IPs.
For public deployments, prefer Nginx or edge rate limiting as the primary abuse
control.

## Manual Smoke Checklist

Use the full checklist in `docs/SMOKE_TESTS.md`.

Minimum production smoke:

1. Open `/` and confirm the web app loads.
2. Call `/api/health` and confirm `{ "status": "ok" }`.
3. Import `/examples/specdock-demo-openapi.yaml` by URL.
4. Browse endpoints and run `GET /posts/{id}` in Direct Browser Mode.
5. Generate SDK files and download ZIP.
6. In public demo mode, verify proxy requests return `PROXY_DISABLED`.
