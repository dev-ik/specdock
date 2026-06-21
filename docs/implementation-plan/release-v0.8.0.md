# v0.8.0 Internal Milestone Plan

Headline:

```txt
SpecDock v0.8.0: Electron desktop technical preview
```

Goal:

- Complete a desktop technical preview that proves the runtime model, IPC boundary,
  and local backend integration without claiming stable desktop support.

Scope:

- Electron app skeleton.
- Sandboxed renderer loading the existing web app.
- Main-process lifecycle for the local Fastify backend.
- Native file dialogs for import/export.
- Development-only unsigned builds.

Implemented baseline:

- `apps/desktop` npm workspace with Electron entrypoint and preload bridge.
- Loopback-only random-port API child process using the existing Fastify app.
- Forced desktop defaults for `PROXY_ENABLED=false`,
  `MOCK_SERVER_ENABLED=false`, and `TRUST_PROXY=false`.
- Hardened BrowserWindow options: `nodeIntegration=false`,
  `contextIsolation=true`, sandboxing, web security, and denied new windows.
- Native open/save IPC for portable `.specdock.json` project exports validated
  through shared core manifest parsing.

Out of scope:

- Signed release installers.
- Auto-update.
- Native project folder persistence.
- Shell command execution from generated SDK output.

## Stage 1: Electron Shell

Tasks:

- Add `apps/desktop` using Electron and npm workspaces.
- Load the built web app in production mode and Vite in development mode.
- Disable `nodeIntegration`.
- Enable `contextIsolation` and renderer sandboxing.
- Add a narrow preload API for version and file dialog actions.

Acceptance:

- Desktop preview launches on a developer machine.
- Renderer code cannot access Node.js APIs directly.

## Stage 2: Local Backend Lifecycle

Tasks:

- Start the existing Fastify API on a loopback-only random port.
- Pass the local API base URL to the renderer through preload IPC.
- Shut down the backend when the desktop app exits.
- Keep proxy disabled unless explicitly enabled by desktop-safe settings.

Acceptance:

- Desktop can use generation and guarded API routes without Docker.
- Backend never binds to a public interface by default.

## Stage 3: Native Import And Export Preview

Tasks:

- Add allowlisted IPC methods for open-file and save-file dialogs.
- Validate imported project files in shared code before renderer storage.
- Save exported project files with default safe redaction.
- Add tests around IPC payload validation where practical.

Acceptance:

- Users can import and export projects through native dialogs.
- IPC does not expose arbitrary read/write operations to renderer code.

## Security Review

- Verify `nodeIntegration=false`, `contextIsolation=true`, and sandboxing.
- Verify IPC handlers validate payloads and file extensions.
- Verify backend binds to loopback only and keeps proxy disabled by default.
