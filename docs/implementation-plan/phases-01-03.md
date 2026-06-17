# Implementation Plan — Phases 1-3

## Phase 1 — Workspace & Tooling

### TASK-001 Create npm workspace

Create root `package.json` with npm workspaces:

```txt
apps/*
packages/*
```

Done when:

- `npm install` works
- `npm run build --workspaces --if-present` works

### TASK-002 Create base TypeScript config

Create `tsconfig.base.json`.

Done when all packages can extend it.

### TASK-003 Create apps/web

Use:

- React
- TypeScript
- Vite

Done when:

- `npm run dev -w apps/web` works
- app renders dashboard placeholder

### TASK-004 Create apps/api

Use:

- Node.js
- Fastify
- TypeScript

Done when:

- `GET /api/health` returns `{ status: "ok", version: "0.1.0" }`

### TASK-005 Create packages/core

Contains shared OpenAPI parsing and normalized models.

### TASK-006 Create packages/generator

Contains SDK generation functions.

### TASK-007 Create packages/ui

Contains shared UI primitives and project-specific components.

### TASK-008 Configure ESLint and Prettier

Done when:

```bash
npm run lint
npm run format
```

work.

### TASK-009 Configure Vitest

Done when packages can run unit tests.

### TASK-010 Configure GitHub Actions CI

CI steps:

```txt
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Phase 2 — Shared Types & Models

### TASK-011 Add core data models

Implement types from `DATA_MODELS.md`.

### TASK-012 Add API contract types

Implement:

- `ApiError`
- `GenerateRequest`
- `GenerateResponse`
- `ProxyRequest`
- `ProxyResponse`

### TASK-013 Add generator types

Implement:

- `GeneratedFile`
- `GenerateOptions`

### TASK-014 Add storage types

Implement:

- `StorageSchema`
- `StorageAdapter`
- `UserSettings`

### TASK-015 Add default constants

Implement:

- `defaultGenerateOptions`
- `defaultSettings`
- `CURRENT_STORAGE_VERSION`

## Phase 3 — OpenAPI Parser

### TASK-016 Install parser dependencies

Install:

```txt
@apidevtools/swagger-parser
yaml
```

### TASK-017 Implement parseSpec(input)

Accept:

- raw JSON string
- raw YAML string
- object

Return parsed OpenAPI object.

### TASK-018 Implement validateSpec(spec)

Validate supported OpenAPI version:

```txt
3.0.x
3.1.x
```

Reject Swagger 2.0.

### TASK-019 Implement extractServers(spec)

Return normalized `ApiServer[]`.

### TASK-020 Implement extractTags(spec)

Return normalized `ApiTag[]`.

### TASK-021 Implement extractOperations(spec)

Return normalized `ApiOperation[]`.

### TASK-022 Implement extractSchemas(spec)

Return normalized `ApiSchema[]`.

### TASK-023 Add parser tests

Cover:

- valid YAML
- valid JSON
- invalid YAML
- OpenAPI 3.0
- OpenAPI 3.1
- Swagger 2.0 rejection
