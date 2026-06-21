# v0.7.0 Internal Milestone Plan

Headline:

```txt
SpecDock v0.7.0: local generation and portable project workflows
```

Goal:

- Prepare SpecDock for desktop by making local project transfer and SDK output
  workflows predictable in the web and self-hosted app.

Scope:

- Project import/export polish.
- Local SDK output planning.
- Generated artifact previews.
- CLI-compatible project operations.
- Documentation for portable workspaces.

Out of scope:

- Electron shell.
- Native directory writes from the browser.
- Automatic SDK publishing.
- Registry credential storage.

## Stage 1: Portable Project Workflow

Tasks:

- Add clear project export and import actions in the workspace.
- Preserve project name, source format, selected operation, and safe UI state.
- Validate imported project files before writing to browser storage.
- Add smoke tests for exporting and re-importing the same project.

Acceptance:

- A project can move between browsers without secrets or request history.
- Invalid project files produce actionable errors.

## Stage 2: Local SDK Output Planning

Tasks:

- Add an output plan that lists generated files before download.
- Keep generation options in shared core/generator code.
- Add checks for dangerous generated paths such as absolute paths or traversal.
- Document how generated SDK archives map to future desktop folder output.

Acceptance:

- Users can inspect generated file names before downloading.
- Generated paths are normalized and cannot escape the intended output root.

## Stage 3: CLI-Compatible Operations

Tasks:

- Keep project load, diff, and generation logic callable without React.
- Add tests proving CLI paths do not import browser-only modules.
- Document stable inputs and outputs for future desktop and CLI reuse.

Acceptance:

- Desktop can reuse core operations without duplicating browser code.
- CI-facing JSON and Markdown outputs stay stable.

## Security Review

- Verify generated file paths are normalized and bounded.
- Verify project imports cannot enable unsafe proxy or mock settings.
- Verify generated previews do not render raw HTML from untrusted specs.
