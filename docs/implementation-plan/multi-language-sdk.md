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

Status: Success

Result:

- Added `language`, shared option resolution, unsupported-combination
  validation, API/docs/UI updates, and compatibility tests.

## Stage 8: Generator Architecture Split

Status: Success

Result:

- Added shared `SdkModel`, routed TypeScript rendering through it, preserved
  existing output behavior, and covered model/path handling in tests.

## Stage 9: Python SDK

Status: Success

Result:

- Python `httpx` SDK generation implemented with client, models, package
  metadata, and path escaping tests.

## Stage 10: Go SDK

Status: Success

Result:

- Go standard-library SDK generation implemented with `go.mod`, `client.go`,
  `models.go`, path escaping tests, and safe JSON tag handling.

## Stage 11: Java SDK

Status: Success

Result:

- Java 17 Maven SDK generation implemented with `HttpClient`, Jackson models,
  file list tests, and path escaping tests. Maven compile smoke skipped when
  Maven is unavailable.

## Stage 12: C# SDK

Status: Success

Result:

- C# .NET SDK generation implemented with `.csproj`, `HttpClient`,
  `System.Text.Json`, nullable reference types, async methods with
  `CancellationToken`, and path escaping tests.

## Stage 13: PHP SDK

Status: Success

Result:

- PHP SDK generation implemented with `composer.json`, Guzzle transport,
  client class, DTO classes, path/query/header/body support, and path literal
  escaping tests.

## Stage 14: Cross-Language Polish

Status: Success

Result:

- Added generated `README.md` and `specdock.manifest.json` for every SDK
  language with runtime target versions, language presets in the Generate UI,
  future CLI shape docs, and a support matrix for runtime/model behavior.

## Security Check Required For Every Stage

- Do not add cloud storage, login requirements, or unrestricted proxy behavior.
- Do not log specs, request bodies, response bodies, credentials, or sensitive
  headers.
- Treat OpenAPI text as untrusted input in generated code comments, strings,
  docs, filenames, and UI previews.
- Keep generated output paths relative and ZIP-safe.
- Keep frontend previews escaped; do not introduce raw HTML or code execution
  sinks.
