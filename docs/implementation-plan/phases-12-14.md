# Implementation Plan — Phases 12-14

## Phase 12 — Generate UI

### TASK-074 Implement GeneratePanel

Options:

- client fetch/axios
- generateTypes
- generateReactQuery
- generateZod
- outputPath

### TASK-075 Call /api/generate

Show generated files preview.

### TASK-076 Implement ZIP download

Use `/api/generate/zip` or frontend JSZip.

## Phase 13 — Docker & Deployment

### TASK-077 Add Dockerfile

### TASK-078 Add docker-compose.yml

### TASK-079 Add Nginx docs

### TASK-080 Add production env examples

## Phase 14 — MVP Hardening

### TASK-081 Add manual smoke test checklist

### TASK-082 Add example OpenAPI spec

### TASK-083 Add README quickstart

### TASK-084 Confirm public demo security

Ensure:

```txt
PUBLIC_DEMO=true
PROXY_ENABLED=false
```

### TASK-085 Release v0.1.0

Tag:

```txt
v0.1.0
```
