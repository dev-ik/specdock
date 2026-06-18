# Roadmap

This roadmap tracks work intentionally deferred from `v0.1.0`.

Detailed implementation stages are tracked in
[`docs/implementation-plan/post-v0.1-improvements.md`](implementation-plan/post-v0.1-improvements.md)
and
[`docs/implementation-plan/multi-language-sdk.md`](implementation-plan/multi-language-sdk.md).

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

- contract diff
- mock server
- collection export
- generated SDK customization presets
