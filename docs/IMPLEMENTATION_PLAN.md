# SpecDock Implementation Plan

This file is the stable entry point for the implementation plan. Detailed task
lists are split by phase to keep each maintained document small.

## Source of Truth

Before implementation read:

1. `docs/SPECDOCK_MASTER_PLAN.md`
2. `docs/API_CONTRACTS.md`
3. `docs/DATA_MODELS.md`
4. `docs/SDK_SPEC.md`
5. `docs/STORAGE_MODEL.md`
6. `docs/NON_FUNCTIONAL_REQUIREMENTS.md`
7. `AGENTS.md`

## Phase Files

- [Phases 1-3: Workspace, types, parser](implementation-plan/phases-01-03.md)
- [Phase 4: Storage](implementation-plan/phase-04.md)
- [Phases 5-7: Backend, SDK generation, web foundation](implementation-plan/phases-05-07.md)
- [Phases 8-11: Import, explorer, request builder, response viewer](implementation-plan/phases-08-11.md)
- [Phases 12-14: Generate UI, Docker/deployment, hardening](implementation-plan/phases-12-14.md)
- [Post-v0.1 Improvements](implementation-plan/post-v0.1-improvements.md)
- [Multi-Language SDK Generation](implementation-plan/multi-language-sdk.md)

## Current Release Notes

- Auth Profiles are deferred to post-v0.1.0; MVP uses manual headers and an explicit placeholder.
- Public demo must keep `PROXY_ENABLED=false`.
- Versioned container images should use immutable version tags; do not rely on `latest` for v0.1.0.
