# Roadmap

This roadmap tracks work intentionally deferred from `v0.1.0`.

Detailed implementation stages are tracked in
[`docs/implementation-plan/post-v0.1-improvements.md`](implementation-plan/post-v0.1-improvements.md)
and
[`docs/implementation-plan/multi-language-sdk.md`](implementation-plan/multi-language-sdk.md).

Next release plans are tracked in
[`docs/implementation-plan/release-roadmap.md`](implementation-plan/release-roadmap.md).

## Completed Since v0.1.0

### Multi-Language SDK Generation

- language-aware generator options
- shared SDK intermediate model
- Python SDK
- Go SDK
- Java SDK
- C# SDK
- PHP SDK
- generated SDK README and manifest metadata
- target runtime versions per language

### Contract Workflows

- explicit old/new contract diff
- Markdown and JSON diff report exports
- self-hosted mock response generation
- minimal CLI contract diff

## Post-v0.1.0

### Auth Profiles

MVP request execution supports manual headers only. A later release should add first-class auth profiles:

- Bearer token
- API key header/query auth
- Basic auth
- per-project profile persistence
- explicit masking for secret values
- export/import rules that avoid leaking credentials

Auth Profiles must preserve the existing public-demo security model:

- no login requirement
- no cloud storage
- no unrestricted public proxy
- no logging of sensitive headers

### Request Builder Improvements

- parameter serialization styles beyond the simple MVP path/query/header flow
- multipart/form-data
- binary uploads
- richer examples from request body schemas

### Contract Workflows

- collection export
- generated SDK customization presets

### Desktop Path To v1.0.0

SpecDock should treat the stable desktop app as the first public `v1.0.0`
release. The release path is tracked in
[`docs/implementation-plan/release-roadmap.md`](implementation-plan/release-roadmap.md):

- `v0.6.0`: internal workspace persistence foundation milestone
- `v0.7.0`: internal local generation and portable projects milestone
- `v0.8.0`: internal Electron desktop technical preview milestone
- `v0.9.0`: internal desktop beta packaging and hardening milestone
- `v1.0.0`: first public stable Electron desktop workspace release

Desktop must preserve the existing local-first and public-demo security model:

- no login or cloud sync requirement
- no unrestricted public proxy
- renderer isolated from Node.js APIs
- filesystem and backend access only through validated IPC
