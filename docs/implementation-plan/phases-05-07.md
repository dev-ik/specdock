# Implementation Plan — Phases 5-7

## Phase 5 — Backend API

### TASK-029 Implement GET /api/health

Must match `API_CONTRACTS.md`.

### TASK-030 Implement POST /api/generate

Return JSON `GenerateResponse`.

### TASK-031 Implement POST /api/generate/zip

Return `application/zip`.

### TASK-032 Implement disabled proxy behavior

When `PROXY_ENABLED=false`, `/api/proxy/request` returns:

```txt
PROXY_DISABLED
```

### TASK-033 Implement ProxyConfig

Read env:

- `PROXY_ENABLED`
- `PROXY_ALLOWED_HOSTS`
- `PROXY_TIMEOUT_MS`
- `PROXY_MAX_REQUEST_BYTES`
- `PROXY_MAX_RESPONSE_BYTES`

### TASK-034 Implement URL/protocol validation

Allow only:

```txt
http:
https:
```

### TASK-035 Implement SSRF protection

Block private/local IP ranges.

### TASK-036 Implement host allowlist

Use `PROXY_ALLOWED_HOSTS`.

### TASK-037 Implement proxy request execution

Only after security checks.

## Phase 6 — SDK Generation

### TASK-038 Implement operation naming

Prefer `operationId`; fallback to method/path.

### TASK-039 Implement TypeScript schema generation

Generate `types.ts`.

### TASK-040 Implement fetch client generation

Generate `client.ts`.

### TASK-041 Implement axios client generation

Generate `client.ts`.

### TASK-042 Implement ZIP generation

Use JSZip.

### TASK-043 Add generator tests

Cover naming, types, fetch, axios.

## Phase 7 — Web UI Foundation

### TASK-044 Configure TailwindCSS v4

### TASK-045 Configure shadcn/ui

### TASK-046 Create AppLayout

### TASK-047 Create Dashboard page

### TASK-048 Create Import page

### TASK-049 Create Project Explorer page

### TASK-050 Create Generate page

### TASK-051 Create Settings page
