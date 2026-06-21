# v0.9.0 Internal Milestone Plan

Headline:

```txt
SpecDock v0.9.0: desktop beta packaging and hardening
```

Goal:

- Turn the Electron technical preview into a beta-quality desktop app with
  repeatable builds, platform packaging, and hardened local workflows.

Scope:

- Packaged desktop builds for macOS, Windows, and Linux.
- Native project folder persistence.
- SDK generation into selected folders.
- Desktop smoke tests.
- Security and packaging hardening.

Implemented baseline:

- Bundled Electron main/preload build using esbuild.
- Embedded loopback-only Fastify API for packaged desktop runtime.
- Unsigned Electron Builder packaging scripts for directory, macOS, Windows,
  and Linux artifacts.
- Native project folder read/write helpers with separate manifest and spec
  files.
- Native SDK output directory helper that reuses the generated output plan and
  rejects path traversal.
- Packaging dry-run verified with `npm run package:dir --workspace
  @specdock/desktop` on macOS arm64.

Out of scope:

- Cloud sync.
- Auto-update.
- Plugin system.
- Running generated SDK code.

## Stage 1: Desktop Packaging

Tasks:

- Add repeatable packaging scripts using npm.
- Produce macOS, Windows, and Linux artifacts in CI where runners allow it.
- Include license, milestone notes, and version metadata.
- Document unsupported platform combinations.

Acceptance:

- Maintainers can create desktop beta artifacts from a clean checkout.
- Desktop version matches the internal milestone version.

## Stage 2: Native Project Folders

Tasks:

- Let users create and open local SpecDock project folders.
- Store the versioned manifest and source spec in explicit files.
- Keep secret values out of project folders by default.
- Add conflict handling for missing, moved, or externally edited files.

Acceptance:

- Users can reopen a project folder after restarting the desktop app.
- Project folders remain inspectable and portable.

## Stage 3: SDK Output To Directory

Tasks:

- Add a native directory picker for SDK output.
- Reuse the bounded generated-file plan from `v0.7.0`.
- Confirm before overwriting existing files.
- Keep generated output separate from project metadata unless explicitly saved.

Acceptance:

- Desktop users can generate SDK files directly into a local folder.
- Generation cannot write outside the selected output directory.

## Stage 4: Desktop Smoke Tests

Tasks:

- Add launch smoke checks for packaged builds where practical.
- Verify import, request preview, generation, export, and reopen workflows.
- Add manual smoke checklist items for each supported platform.

Acceptance:

- Desktop beta has a repeatable validation path before `v1.0.0` promotion.
- Known platform limitations are documented.

## Security Review

- Verify folder access is explicit and user-selected.
- Verify generated output cannot escape the selected directory.
- Verify packaged builds do not enable unsafe proxy or debug defaults.
- Verify unsigned internal packaging does not auto-discover local signing
  identities.
