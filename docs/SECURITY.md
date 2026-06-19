# Security

SpecDock is local-first. Imported contracts, auth profiles, safe request
preferences, and generated previews stay in the user's browser storage unless
the user exports or sends them. Manual request headers and bodies are
session-only by default. Endpoint request/response exchanges are kept in memory
for the current session and are cleared on reload.

## Public Demo

Public demo deployments must run with proxy mode disabled:

```env
PUBLIC_DEMO=true
DEMO_DIRECT_ALLOWED_HOSTS=dummyjson.com,petstore3.swagger.io,httpbin.org
PROXY_ENABLED=false
MOCK_SERVER_ENABLED=false
```

In this mode, backend proxy execution is disabled and Direct Browser Mode is
limited to `DEMO_DIRECT_ALLOWED_HOSTS`. Browser CORS rules still decide which
allowed upstream APIs can be called.

Mock server routes are not registered in public demo deployments, even if
`MOCK_SERVER_ENABLED=true` is set accidentally.

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
- streaming response body size limit
- hop-by-hop and proxy header filtering

Use `PROXY_ALLOW_PRIVATE_TARGETS=true` only for local/internal-network testing.
Self-hosted proxy deployments should also enforce outbound firewall rules to
internal networks. SpecDock pins proxy requests to the validated DNS address,
and network egress policy remains useful defense in depth.

## Self-Hosted Mock Server

Mock response generation is disabled by default:

```env
MOCK_SERVER_ENABLED=false
```

Trusted self-hosted deployments can enable it with:

```env
PUBLIC_DEMO=false
MOCK_SERVER_ENABLED=true
MOCK_MAX_RESPONSE_BYTES=10485760
```

The mock response endpoint accepts an OpenAPI spec and a method/path target,
generates a response from examples or schemas, and does not persist the spec.
Generated mock response bodies are size-limited.

Saved live mock routes are stored in memory in the current API process and are
lost on restart. They can be called through `/mock/*` only in trusted
self-hosted mode.

## Sensitive Data

Do not put production credentials into shared browsers. Auth profiles are stored
in browser `localStorage` and can include bearer tokens, API keys, basic-auth
passwords, cookies, CSRF tokens, origin values, and referers. Manual headers and
request bodies stay in memory for the current browser session and are not
persisted to localStorage.

Backend logs must not include request bodies or sensitive headers such as:

```txt
Authorization
Cookie
Set-Cookie
X-API-Key
Proxy-Authorization
```

Request history stores execution metadata for browsing recent calls. It must not be used as a response-body archive. Sensitive query parameters are redacted before history is saved.

Local `.specdock.json` exports include project metadata, the normalized API
spec, safe request preferences, and SDK preset settings. They exclude auth
profile secret values, manual headers, request bodies, response bodies, and
file contents by default. Imported workspace files are validated before they are
stored.
