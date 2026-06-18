# Multi-Language SDK Generation Plan

This plan tracks post-v0.1 work for expanding SDK generation beyond
TypeScript. Update each stage status as work moves through the pipeline.

Status values:

- Planned
- In Progress
- Success
- Blocked

## Scope

Goal:

- Generate practical client SDKs for the most useful API consumer ecosystems.

Initial language order:

1. TypeScript hardening
2. Python
3. Go
4. Java
5. C#
6. PHP

Deferred until demand is clear:

- Kotlin Android
- Swift
- Rust
- Ruby

## Stage 7: Generator Option Model

Status: Planned

Goal:

- Make generator options language-aware without breaking existing TypeScript
  generation requests.

Implementation:

- Add `language` with default `typescript`.
- Keep existing `client: "fetch" | "axios"` behavior for TypeScript.
- Add language-specific runtime options only where needed.
- Validate unsupported language/runtime combinations.
- Update API contracts, shared types, SDK spec, and generate UI.

Verification:

- Existing TypeScript generator tests still pass unchanged.
- New tests cover default option compatibility and invalid combinations.

## Stage 8: Generator Architecture Split

Status: Planned

Goal:

- Split shared OpenAPI-to-SDK planning from language-specific file rendering.

Implementation:

- Introduce a shared SDK intermediate model for operations, parameters,
  schemas, request bodies, and responses.
- Add a language generator registry.
- Keep all generators pure and returning `GeneratedFile[]`.
- Keep ZIP creation separate from generation.
- Preserve ZIP-safe path validation for every generated file.

Verification:

- Snapshot or golden tests cover stable file lists and output paths.
- Large-spec limits still apply before file rendering.

## Stage 9: Python SDK

Status: Planned

Goal:

- Generate a Python SDK for scripts, backend automation, and data workflows.

Implementation:

- Generate `pyproject.toml`, package `__init__.py`, `client.py`, and
  `models.py`.
- Use `httpx` for HTTP transport.
- Generate typed request functions with path, query, header, and JSON body
  support.
- Start with simple typed models; consider optional Pydantic later.

Verification:

- Golden tests for files and naming.
- Generated sample package imports successfully.

## Stage 10: Go SDK

Status: Planned

Goal:

- Generate a dependency-light Go SDK for backend services.

Implementation:

- Generate `go.mod`, `client.go`, `models.go`, and operation files if needed.
- Use standard `net/http`, `context.Context`, and `encoding/json`.
- Generate structs for supported schemas.
- Return typed response wrappers where practical.

Verification:

- Golden tests for files and naming.
- Generated sample runs `go test` when Go is available.

## Stage 11: Java SDK

Status: Planned

Goal:

- Generate a JVM SDK for enterprise backend consumers.

Implementation:

- Generate Java 17 source files.
- Use `java.net.http.HttpClient`.
- Use Jackson for JSON models and serialization.
- Generate Maven metadata first; Gradle can be added later.

Verification:

- Golden tests for files and naming.
- Generated sample compiles when Java tooling is available.

## Stage 12: C# SDK

Status: Planned

Goal:

- Generate a .NET SDK for enterprise and internal-tool consumers.

Implementation:

- Generate `.csproj`, `Client.cs`, and model classes.
- Use `HttpClient` and `System.Text.Json`.
- Enable nullable reference types.
- Generate async methods with `CancellationToken`.

Verification:

- Golden tests for files and naming.
- Generated sample builds when .NET tooling is available.

## Stage 13: PHP SDK

Status: Planned

Goal:

- Generate a PHP SDK for Laravel and Symfony API consumers.

Implementation:

- Generate `composer.json`, client class, and DTO classes.
- Use Guzzle as the HTTP transport.
- Support path, query, header, and JSON body requests.

Verification:

- Golden tests for files and naming.
- Generated sample syntax checks when PHP is available.

## Stage 14: Cross-Language Polish

Status: Planned

Goal:

- Make SDK generation understandable, predictable, and useful from the UI and
  CLI.

Implementation:

- Add per-language README examples.
- Add generated output manifests for every language.
- Add UI presets for common SDK targets.
- Add a future CLI shape such as
  `specdock generate --language python --input openapi.yaml --out sdk/`.
- Document feature support and known limitations per language.

Verification:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual UI smoke check for each visible generator option.

## Security Check Required For Every Stage

- Do not add cloud storage, login requirements, or unrestricted proxy behavior.
- Do not log specs, request bodies, response bodies, credentials, or sensitive
  headers.
- Treat OpenAPI text as untrusted input in generated code comments, strings,
  docs, filenames, and UI previews.
- Keep generated output paths relative and ZIP-safe.
- Keep frontend previews escaped; do not introduce raw HTML or code execution
  sinks.
