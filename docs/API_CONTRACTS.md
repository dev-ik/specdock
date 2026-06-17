# SpecDock API Contracts

## Overview

Backend responsibilities for MVP:

- Healthcheck
- SDK generation
- Optional secure proxy request execution

Base API prefix:

```txt
/api
```

Public demo:

```env
PROXY_ENABLED=false
```

Self-hosted mode may enable proxy explicitly:

```env
PROXY_ENABLED=true
PROXY_ALLOWED_HOSTS=api.example.com,staging-api.example.com
```

## Contract Details

- [Endpoint contracts](api-contracts/endpoints.md)

## Common Types

```ts
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";
```

## Limits

```txt
Max spec size: 10 MB
Max proxy request body: 5 MB
Max proxy response body: 10 MB
Generate timeout: 10 sec
Proxy timeout: 15 sec
```

Self-hosted proxy deployments can lower proxy limits with:

```txt
PROXY_TIMEOUT_MS
PROXY_MAX_REQUEST_BYTES
PROXY_MAX_RESPONSE_BYTES
```

## Logging Rules

Do not log sensitive headers:

```txt
Authorization
Cookie
Set-Cookie
X-API-Key
Proxy-Authorization
```

Do not log request bodies by default.
