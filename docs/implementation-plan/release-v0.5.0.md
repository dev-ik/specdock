# v0.5.0 Release Plan

Headline:

```txt
SpecDock v0.5.0: contract diff reports and self-hosted mock APIs
```

Goal:

- Turn SpecDock into a practical contract workflow tool for local and
  CI-assisted development.

Scope:

- Explicit contract diff workflow.
- Markdown and JSON diff report export.
- Self-hosted mock server API.
- Mock Server UI.
- Generated example response bodies.
- In-memory live mock routes under `/mock/*`.
- Minimal CLI diff command.

Out of scope:

- Public demo mock endpoints.
- Cloud-hosted mocks.
- Stateful mock persistence.
- Stateful mock UI sessions.

## Stage 1: Explicit Contract Diff

Tasks:

- Add old/new spec import slots to the Contract Diff panel.
- Accept local projects, files, or raw text for both sides.
- Show breaking, non-breaking, and informational changes.
- Filter by method, path, tag, and severity.
- Test removed endpoints, required field changes, removed response codes, and
  schema changes.

Acceptance:

- Users can compare any two specs without implicit previous-project selection.
- Diff results are reproducible for the same inputs.

## Stage 2: Diff Report Export

Tasks:

- Export Markdown summaries for PR comments and release notes.
- Export JSON reports for automation.
- Include spec names, versions, timestamps, counts, and findings.
- Exclude auth data, request bodies, and response bodies.

Acceptance:

- Markdown renders cleanly in GitHub and GitLab.
- JSON is stable enough for CI consumers.

## Stage 3: Self-Hosted Mock Server

Tasks:

- Add backend mock routes only when `MOCK_SERVER_ENABLED=true`.
- Keep public demo deployments disabled.
- Generate responses from OpenAPI examples first, then schema examples.
- Save generated responses as in-memory live routes.
- Enforce request and response size limits.
- Add a Mock Server panel for endpoint/status selection, response preview, and
  copyable payloads and live route URLs.
- Test disabled defaults, routing, method matching, response generation, and
  saved live responses.

Acceptance:

- Public demo cannot use mock server endpoints.
- Self-hosted users can run and inspect mock responses from an imported spec.
- Self-hosted users can save a generated response and call it externally through
  `/mock/<path>` while the API process is running.

## Stage 4: CLI Diff

Tasks:

- Add a minimal Node CLI.
- Accept two spec files and output Markdown or JSON.
- Reuse core parsing and diff logic.
- Exit non-zero when configured to fail on breaking changes.

Acceptance:

- CI can run contract diff without starting the web app.
- CLI does not import React or browser-only modules.

## Security Review

- Verify mock routes are disabled unless explicitly enabled.
- Verify public demo deployments cannot start mock endpoints.
- Verify diff exports exclude request bodies, response bodies, and auth data.
- Verify CLI output does not expose environment variables or local secrets.
