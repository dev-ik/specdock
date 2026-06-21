# Storage Model

MVP is local-first.

No backend persistence.

No accounts.

No cloud sync.

## Storage

Use localStorage in MVP.

Future: IndexedDB.

## Keys

```txt
specdock:projects
specdock:environments
specdock:authProfiles
specdock:history
specdock:settings
specdock:activeProjectId
specdock:storageVersion
```

## Limits

```txt
Max stored projects: 10
Max single spec size: 10 MB
Max history items: 100
```

## Adapter

Do not call localStorage everywhere. Use a storage adapter.

```ts
export type StorageAdapter = {
  getProjects(): OpenApiProject[];
  saveProjects(projects: OpenApiProject[]): void;
  getEnvironments(): Environment[];
  saveEnvironments(environments: Environment[]): void;
  getAuthProfiles(): AuthProfile[];
  saveAuthProfiles(authProfiles: AuthProfile[]): void;
  getHistory(): RequestHistoryItem[];
  saveHistory(history: RequestHistoryItem[]): void;
  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): void;
};
```

The adapter runs a local migration on startup. Missing keys are initialized,
malformed JSON and invalid shapes are reset to safe defaults, and storage write
failures are reported as diagnostics while the app keeps in-memory fallbacks.
Fresh installs do not show recovery warnings; corrupted or incompatible saved
state is surfaced through the workspace status message.

## Secrets

Auth profiles can contain bearer tokens, API keys, basic-auth passwords,
cookies, CSRF tokens, origin values, and referers. They are stored only in the
user's browser `localStorage`; SpecDock does not send them to a backend except
when the user explicitly executes a request.

Manual request headers and bodies are not persisted to localStorage. Stored
request preferences must omit headers and bodies and redact sensitive query
values. Request/response exchanges are kept in memory for the current browser
session and are cleared on reload.

UI warning:

```txt
Auth data is stored only in this browser. Avoid shared or public devices.
```

## Portable Project Export

Local `.specdock.json` exports use a versioned manifest:

```ts
type SpecDockProjectExport = {
  format: "specdock.project";
  version: 2;
  exportedAt: string;
  redactionPolicyVersion: 1;
  project: {
    metadata: { name: string };
    source: OpenApiSource;
    specFormat?: "openapi3" | "swagger2";
    spec: unknown;
  };
  preferences: {
    baseUrl?: string;
    requestStates: Record<string, PersistedRequestState>;
    generateOptions: Partial<GenerateOptions>;
  };
};
```

Portable exports must exclude auth profile secret values, manual headers,
request bodies, response bodies, file contents, and request history by default.
Sensitive query parameter values are redacted before export.

Imports support existing `version: 1` files through migration, but future
versions fail closed until the importer explicitly supports them.

## Desktop Project Folders

Desktop project folders are explicit user-selected directories. They keep the
workspace manifest and source spec in separate files:

```txt
specdock.project.json
openapi.json
```

The folder manifest uses `format: "specdock.folder"` and references the source
spec file by name. It stores project metadata, source metadata, safe request
preferences, and SDK preset settings. It must not store auth secrets, manual
headers, request bodies, response bodies, or request history.

Opening a folder reconstructs a normal portable project export and validates it
through the shared manifest parser before renderer storage.
