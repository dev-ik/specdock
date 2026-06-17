# Implementation Plan — Phases 8-11

## Phase 8 — Import Flow

### TASK-052 Implement import by file

Support:

```txt
.yaml
.yml
.json
```

### TASK-053 Implement import by raw text

### TASK-054 Implement import by URL

Respect 10 sec timeout and 10 MB limit.

### TASK-055 Show validation errors

Use clear messages from `NON_FUNCTIONAL_REQUIREMENTS.md`.

### TASK-056 Save imported project

Use localStorage adapter.

## Phase 9 — Explorer

### TASK-057 Implement EndpointSidebar

Show tag groups and methods.

### TASK-058 Implement endpoint search

Target latency: under 100 ms for 1000 operations.

### TASK-059 Implement OperationPanel

Show summary, description, params, request body, responses.

### TASK-060 Implement MethodBadge

Colors:

```txt
GET green
POST blue
PUT orange
PATCH yellow
DELETE red
```

## Phase 10 — Request Builder

### TASK-061 Implement path params form

### TASK-062 Implement query params form

### TASK-063 Implement headers form

### TASK-064 Implement JSON body editor

### TASK-065 Implement base URL selection

Use server/environment.

### TASK-066 Implement auth profile selection

Deferred to post-v0.1.0. MVP uses manual headers plus an explicit UI placeholder.

Future scope:

- bearer
- api key
- basic

### TASK-067 Implement buildApiRequest()

Replace path params, append query params, merge headers.

### TASK-068 Implement CURL generation

## Phase 11 — Request Execution & Response Viewer

### TASK-069 Implement Direct Browser Mode

Use browser fetch.

### TASK-070 Implement CORS error UX

Message:

```txt
CORS blocked this request.
This public demo cannot proxy arbitrary API requests for security reasons.
Run SpecDock locally or self-host it to use Proxy Mode.
```

### TASK-071 Implement ResponseViewer

Show:

- status
- status text
- duration
- headers
- formatted JSON
- raw body fallback

### TASK-072 Implement copy response

### TASK-073 Save request history
