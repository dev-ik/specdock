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

## Secrets

Auth profiles are deferred from the MVP because they may contain secrets.

Manual request headers and bodies are not persisted to localStorage. Stored
request preferences must omit headers and bodies and redact sensitive query
values.

UI warning:

```txt
Auth data is stored only in your browser.
```
