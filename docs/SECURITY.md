# Security

SpecDock is local-first. Imported contracts, request state, generated previews, and saved endpoint exchanges stay in the user's browser storage unless the user exports or sends them.

## Public Demo

Public demo deployments must run with proxy mode disabled:

```env
PUBLIC_DEMO=true
PROXY_ENABLED=false
```

In this mode, request execution uses Direct Browser Mode. Browser CORS rules decide which upstream APIs can be called.

## Self-Hosted Proxy Mode

Proxy mode is only for trusted self-hosted deployments:

```env
PUBLIC_DEMO=false
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
PROXY_ALLOW_PRIVATE_TARGETS=false
```

Do not enable unrestricted public proxying. Keep `PROXY_ALLOWED_HOSTS` explicit and minimal.

The backend proxy enforces:

- HTTP(S)-only targets
- host allowlist
- private-address blocking unless explicitly enabled
- request timeout
- request body size limit
- response body size limit

Use `PROXY_ALLOW_PRIVATE_TARGETS=true` only for local/internal-network testing.

## Sensitive Data

Do not put production credentials into shared browsers. Manual headers and saved endpoint exchanges are local browser data and can include values entered by the user.

Backend logs must not include request bodies or sensitive headers such as:

```txt
Authorization
Cookie
Set-Cookie
X-API-Key
Proxy-Authorization
```

Request history stores execution metadata for browsing recent calls. It must not be used as a response-body archive.
