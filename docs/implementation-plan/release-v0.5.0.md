# v0.5.0 Release Plan

Headline:

```txt
SpecDock v0.5.0: easier adoption, richer examples, and API client interoperability
```

Goal:

- Make SpecDock easier to evaluate, adopt, and share.

Scope:

- Static docs or documentation site.
- Example gallery.
- Postman and Insomnia collection interoperability.
- SDK publishing helpers.
- First-run UX polish.

Out of scope:

- Cloud accounts or sync.
- Automatic package publishing.
- Storing registry credentials.

## Stage 1: Docs And Examples

Tasks:

- Add indexable docs pages for overview, self-hosting, security, examples, and
  comparison with Swagger UI and Postman.
- Add screenshots and short workflow GIFs.
- Add at least three safe public example contracts.
- Keep examples free of secrets and production endpoints.

Acceptance:

- New users can understand SpecDock without reading the whole repository.
- Demo users can load multiple safe example contracts.

## Stage 2: Collection Interoperability

Tasks:

- Evaluate Postman and Insomnia collection formats.
- Prefer export first unless import is safe and predictable.
- Preserve redaction rules for auth and sensitive request values.
- Test exported collection shape and secret exclusion.

Acceptance:

- Users can move selected operations into a common API client format.
- Exports do not include auth profile secret values by default.

## Stage 3: SDK Publishing Helpers

Tasks:

- Generate optional package metadata for a documented subset of target
  registries.
- Add generated README install and usage sections.
- Warn that SpecDock does not publish packages automatically.
- Smoke-test metadata validity where local tools are available.

Acceptance:

- Generated SDKs are closer to publish-ready.
- SpecDock never asks for or stores registry credentials.

## Stage 4: First-Run Polish

Tasks:

- Strengthen empty states and demo spec loading.
- Improve progress and error states for import, generate, and request
  execution.
- Improve narrow viewport behavior for core panels.
- Check labels, keyboard access, and focus behavior.

Acceptance:

- A first-time user can evaluate the product in under five minutes.
- Core workflows remain usable in latest Chrome, Edge, Firefox, and Safari.

## Security Review

- Verify examples do not contain secrets or production-only endpoints.
- Verify collection exports keep auth values redacted by default.
- Verify publishing helpers do not request, store, or log registry credentials.
- Verify docs do not recommend unsafe public proxy settings.
