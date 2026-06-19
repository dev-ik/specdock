# v0.3.0 Release Plan

Headline:

```txt
SpecDock v0.3.0: broader API import, stronger request testing, and customizable SDK output
```

Goal:

- Make SpecDock handle more real-world API contracts and request shapes without
  changing the public demo security model.

Scope:

- Swagger 2.0 import.
- OpenAPI parameter serialization styles.
- `multipart/form-data` and binary request bodies.
- Basic SDK generation presets.
- Local project export/import without secrets.

Out of scope:

- Public backend proxy expansion.
- Cloud sync, login, teams, or collaboration.
- Mock server.
- Postman or Insomnia import.

## Stage 1: Swagger 2.0 Import

Tasks:

- Add a pure Swagger 2.0 to OpenAPI 3.x normalization path in `packages/core`.
- Support `swagger`, `info`, `host`, `basePath`, `schemes`, `paths`,
  `definitions`, `parameters`, `responses`, and `securityDefinitions`.
- Convert Swagger 2.0 `consumes` and `produces` into OpenAPI media types.
- Preserve imported spec format in project metadata.
- Test path/query/body params, definitions, responses, and security schemes.
- Update README and docs after support lands.

Acceptance:

- Swagger 2.0 imports from raw text, file upload, and URL.
- Converted operations appear in Explorer with stable IDs and tags.
- Existing OpenAPI 3.0/3.1 behavior remains unchanged.

## Stage 2: Parameter Serialization

Tasks:

- Add serialization helpers outside React components.
- Support `simple`, `form`, `spaceDelimited`, `pipeDelimited`, and
  `deepObject`.
- Respect `explode` for supported query and path params.
- Show serialization hints for array and object fields.
- Use the same serialization path for request execution and cURL preview.
- Test generated URLs and cURL previews.

Acceptance:

- Request Builder sends query/path values matching supported OpenAPI rules.
- cURL preview matches request execution.

## Stage 3: Multipart And Binary Requests

Tasks:

- Detect `multipart/form-data` request bodies.
- Render controls for scalar, enum, array, object, and binary fields.
- Keep selected files session-only and out of localStorage.
- Generate safe examples for non-file multipart fields.
- Add `application/octet-stream` body support.
- Add unit tests and browser smoke checks for rendering and redaction.

Acceptance:

- Multipart requests can be sent in Direct Browser Mode when CORS allows it.
- File values are not persisted.
- cURL preview redacts sensitive fields and represents file inputs safely.

## Stage 4: SDK Presets

Tasks:

- Add options for package name, client name, naming style, and base URL
  strategy.
- Keep language-specific options behind the shared SDK planning layer.
- Persist selected preset per project in local storage.
- Include preset metadata in `specdock.manifest.json`.
- Test TypeScript plus at least one non-TypeScript language.

Acceptance:

- Users can generate SDK output with predictable names and package metadata.
- Defaults remain stable unless options change.

## Stage 5: Local Project Export And Import

Tasks:

- Export project metadata, OpenAPI spec, UI preferences, and safe settings to
  `.specdock.json`.
- Exclude auth profile secret values, manual headers, request bodies, response
  bodies, and sensitive history payloads by default.
- Validate imported workspace files with Zod before storing.
- Add redaction and schema validation tests.

Acceptance:

- A project can move between browsers by file export/import.
- Exported files do not contain tokens, cookies, API keys, request bodies, or
  response bodies.

## Security Review

- Verify no new public proxy behavior was added.
- Verify file inputs and request bodies remain session-only.
- Verify project exports exclude auth profile secrets and request/response
  bodies by default.
- Verify imported workspace files are schema-validated before persistence.
