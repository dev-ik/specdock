# Changelog

## v0.2.0

### Added

- Multi-language SDK generation for TypeScript, Python, Go, Java, C#, and PHP.
- Generated `README.md` and `specdock.manifest.json` metadata for every SDK.
- Runtime target documentation for each generated language.
- Generate UI language selector and language-specific runtime hints.
- Generated SDK smoke test covering all supported languages.
- GitLab CI verification alongside GitHub Actions.

### Changed

- TypeScript generation now uses the shared SDK model used by other languages.
- Generated file diffs are scoped to the active language output.
- Docker examples now point at the immutable `v0.2.0` tag.

### Security

- Proxy behavior is unchanged: public/demo deployments keep proxy mode disabled.
- Generated SDK checks keep output paths relative and ZIP-safe.
- Generated clients do not execute generated code inside SpecDock.
