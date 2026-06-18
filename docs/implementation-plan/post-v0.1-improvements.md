# Post-v0.1 Improvements

This file tracks product improvements that strengthen the core SpecDock loop:

```txt
Import -> Explore -> Test -> Generate
```

These stages are safe to keep in the open-source repository. They describe
public product direction, contain no secrets, and preserve the local-first and
security-first model.

## Stage 1: Contract Quality Panel

Status: Success

Goal:

- Surface OpenAPI contract quality findings during exploration.

Implemented:

- Pure OpenAPI quality analyzer in `packages/core`.
- Finding types with severity, code, message, location, method, and path.
- Checks for duplicate or missing operation IDs, missing summaries and
  descriptions, untagged operations, undefined tags, missing error responses,
  and schemas without examples.
- Explorer-side `Contract quality` panel with severity counters and filters.
- Unit tests for the analyzer.

Verification:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser smoke check for panel rendering and filtering.

Security result:

- No new network, proxy, auth, logging, or persistence behavior.
- OpenAPI-derived text is rendered through React escaping.
- No raw HTML or code execution sinks were introduced.

## Stage 2: Example Generator

Status: Success

Goal:

- Generate safe request examples from OpenAPI schemas and existing examples.

Implemented:

- Prefer explicit OpenAPI `example` values.
- Read first named OpenAPI `examples.*.value` when `example` is absent.
- Generate fallback examples for `string`, `number`, `integer`, `boolean`,
  `array`, `object`, `enum`, and common string formats.
- Keep generation in `packages/core`, outside React components.
- Add `Fill example` behavior to the request builder JSON body field.
- Keep manual headers and sensitive request data session-only.

Verification:

- Unit tests for schema example generation.
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser smoke check for request body fill behavior.

Security result:

- No new network, proxy, auth, logging, or long-term body persistence behavior.
- Generated examples are inserted only into the session request state.
- Request bodies remain excluded from localStorage persistence.

## Stage 3: SDK Preview Diff

Status: Success

Goal:

- Show generated SDK output before download and compare it to the previous local
  generation.

Implemented:

- Stable generated output manifest with path and content hash.
- File added, removed, changed, and unchanged states.
- Generated files panel diff summary.
- Per-file status badges.
- Line-level added and removed highlights for changed generated files.
- Removed file rows that can still show previous content.
- Unit tests for manifest and diff classification.

Verification:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Security result:

- No new network, proxy, auth, logging, or persistence behavior.
- Diff compares generated file content already present in memory.
- Generated content is rendered as escaped text inside code blocks.

## Stage 4: Collection Export

Status: Success

Goal:

- Export selected operations to portable API-client collection formats.

Implemented:

- `.http` collection export for all active project operations.
- Browser-only text file download with no backend endpoint.
- Request path, query, header, and generated JSON body examples.
- Sensitive header names, query parameter names, path parameter names, and JSON
  body field names are redacted in exported content.
- Unit tests for collection format and redaction behavior.

Verification:

- `npm run test --workspace @specdock/web -- http-collection`
- `npm run typecheck --workspace @specdock/web`

Security result:

- No new network, proxy, auth, logging, or persistence behavior.
- Export uses OpenAPI-derived examples and request metadata.
- User-entered request bodies are not exported.
- Sensitive exported fields are replaced with `[redacted]`.

## Stage 5: Auth Profiles

Status: Success

Goal:

- Add first-class local auth profiles without weakening the public demo model.

Implemented:

- Per-project local auth profiles for Bearer token, API key header/query,
  Basic auth, and Cookie + CSRF browser-session requests.
- Settings UI for creating, editing, and deleting profiles.
- Request panel selector for choosing a profile per operation.
- Auth application during request execution without adding backend endpoints.
- Redacted cURL preview for sensitive headers, query parameters, and JSON body
  fields.
- Cookie + CSRF profiles inject CSRF into JSON bodies and send Cookie,
  Origin, and Referer headers only in proxy mode.
- Request state persistence stores selected profile IDs only, not headers or
  request bodies.
- Unit tests for auth application, preview redaction, and request-state
  persistence.

Verification:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser smoke check for profile creation, request selection, and redacted cURL
  preview.

Security result:

- No login, cloud storage, unrestricted proxy, or sensitive logging added.
- Secrets are local-only in existing `authProfiles` localStorage.
- cURL preview redacts auth headers, sensitive query values, and CSRF body
  fields.
- Collection export remains redacted and does not include auth profile secrets.

## Stage 6: Contract Diff

Status: Success

Goal:

- Compare two OpenAPI specs and classify contract changes.

Implemented:

- Removed endpoints and methods.
- Required request fields added.
- Response status codes removed.
- Response schema changes.
- Breaking, non-breaking, and informational classifications.
- Explorer-side `Contract diff` panel with severity counters and filters.
- Automatic comparison against the previous imported project with the same API
  name, falling back to the latest other project.
- Unit tests for diff classification.

Verification:

- `npm run test --workspace @specdock/core -- openapi-diff`
- `npm run typecheck`

Security result:

- No new network, proxy, auth, logging, request execution, or persistence
  behavior.
- OpenAPI-derived diff text is rendered through React escaping.
