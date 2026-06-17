# MVP Smoke Tests

Use this checklist before tagging `v0.1.0`.

## Prerequisites

```bash
nvm use
npm install
```

## Static Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Local Dev Smoke

Run API and web in separate terminals:

```bash
npm run dev --workspace @specdock/api
npm run dev --workspace @specdock/web
```

Open:

```txt
http://127.0.0.1:5173
```

### Import

1. Click `Import raw` with the default raw spec.
2. Confirm the project is saved as `SpecDock Demo API`.
3. Import the same spec by URL:

```txt
http://127.0.0.1:5173/examples/specdock-demo-openapi.yaml
```

Expected result: the URL import succeeds without CORS or size errors.

### Explore

1. Search for `users`.
2. Select `GET /users/{id}`.
3. Confirm the operation panel shows path params, responses, summary, and description.
4. Switch to a narrow mobile viewport and confirm endpoint rows, method badges, and request controls remain readable.

### Direct Request

1. Keep Base URL as `https://jsonplaceholder.typicode.com`.
2. Keep Mode as `direct`.
3. Set path param `id` to `1` for `GET /users/{id}`.
4. Click `Send`.

Expected result: Response shows `200`, JSON body, response headers, duration, and a saved request line.

### Persistence

1. Change Mode to `proxy`, then back to `direct`.
2. Switch to another endpoint and back.
3. Switch to another local project and back.

Expected result: Base URL and Mode are restored for the project. The response scope toggle can show the selected endpoint exchange or the latest exchange.

### Proxy Disabled UX

1. Switch Mode to `proxy`.
2. Click `Send`.

Expected result: public-demo mode returns a documented `PROXY_DISABLED` message and does not proxy the upstream request.

### Generate

1. Choose `fetch`.
2. Enable `Types`.
3. Optionally enable `React Query` and `Zod`.
4. Click `Generate`.
5. Confirm generated files appear.
6. Click `ZIP` and confirm the archive downloads.

## Docker Smoke

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:3000/api/health
```

Open:

```txt
http://127.0.0.1:3000
```

URL import sample:

```txt
http://127.0.0.1:3000/examples/specdock-demo-openapi.yaml
```

Confirm:

1. Web app loads.
2. `/api/health` returns `status: ok`.
3. Direct request smoke passes.
4. Proxy mode returns `PROXY_DISABLED`.
5. Generated ZIP downloads.

Stop:

```bash
docker compose down
```
