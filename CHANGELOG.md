# Changelog

## v0.2.3

### Fixed

- Published a patch release target that includes public-demo Direct Browser Mode host restrictions.
- Updated public Docker examples to use `docker.io/d8vik/specdock:v0.2.3`.

### Security

- Clarified that auth profiles are local browser data and may contain credentials.
- Clarified that shared or public devices should not be used for stored auth profiles.

## v0.2.2

### Fixed

- Increased generated SDK smoke test timeout for CI environments with PHP Composer enabled.
- Set Composer root version during smoke validation to avoid root package version warnings.

## v0.2.1

### Fixed

- Added generated PHP Composer metadata required by `composer validate --strict`.
- Updated GitHub Actions to Node-24-compatible action majors.

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
