import type { z } from "zod";
import { CURRENT_STORAGE_VERSION, defaultSettings, LIMITS, STORAGE_KEYS } from "./constants.js";
import {
  authProfilesSchema,
  environmentsSchema,
  historySchema,
  projectsSchema,
  settingsSchema
} from "./storage-schemas.js";
import type {
  OpenApiProject,
  RequestHistoryItem,
  StorageAdapter,
  StorageMigrationDiagnostic,
  UserSettings
} from "./types.js";

export const migrateStorage = (storage: Storage): StorageMigrationDiagnostic[] => {
  const diagnostics: StorageMigrationDiagnostic[] = [];
  const storedVersion = storage.getItem(STORAGE_KEYS.storageVersion);

  if (isFutureStorageVersion(storedVersion)) {
    diagnostics.push({ key: STORAGE_KEYS.storageVersion, code: "future-version" });
  }

  const projects = ensureStoredValue(storage, STORAGE_KEYS.projects, [], projectsSchema, diagnostics);
  ensureStoredValue(storage, STORAGE_KEYS.environments, [], environmentsSchema, diagnostics);
  ensureStoredValue(storage, STORAGE_KEYS.authProfiles, [], authProfilesSchema, diagnostics);
  ensureStoredValue(storage, STORAGE_KEYS.history, [], historySchema, diagnostics);
  ensureStoredValue(storage, STORAGE_KEYS.settings, defaultSettings, settingsSchema, diagnostics);

  if (!safeSet(storage, STORAGE_KEYS.storageVersion, CURRENT_STORAGE_VERSION)) {
    diagnostics.push({ key: STORAGE_KEYS.storageVersion, code: "write-failed" });
  }

  const activeProjectId = storage.getItem(STORAGE_KEYS.activeProjectId);
  if (activeProjectId && !projects.some((project) => project.id === activeProjectId)) {
    safeRemove(storage, STORAGE_KEYS.activeProjectId);
    diagnostics.push({ key: STORAGE_KEYS.activeProjectId, code: "active-project-reset" });
  }

  return diagnostics;
};

export const createLocalStorageAdapter = (storage: Storage): StorageAdapter => {
  const diagnostics = migrateStorage(storage);

  return {
    getDiagnostics: () => [...diagnostics],
    getProjects: () => readStoredValue(storage, STORAGE_KEYS.projects, [], projectsSchema),
    saveProjects: (projects) => {
      safeWriteJson(storage, STORAGE_KEYS.projects, projects.slice(0, LIMITS.maxStoredProjects));
    },
    getEnvironments: () => readStoredValue(storage, STORAGE_KEYS.environments, [], environmentsSchema),
    saveEnvironments: (environments) => {
      safeWriteJson(storage, STORAGE_KEYS.environments, environments);
    },
    getAuthProfiles: () => readStoredValue(storage, STORAGE_KEYS.authProfiles, [], authProfilesSchema),
    saveAuthProfiles: (authProfiles) => {
      safeWriteJson(storage, STORAGE_KEYS.authProfiles, authProfiles);
    },
    getHistory: () => readStoredValue(storage, STORAGE_KEYS.history, [], historySchema),
    saveHistory: (history) => {
      safeWriteJson(storage, STORAGE_KEYS.history, history.slice(0, LIMITS.maxHistoryItems));
    },
    getSettings: () => readStoredValue(storage, STORAGE_KEYS.settings, defaultSettings, settingsSchema),
    saveSettings: (settings) => {
      safeWriteJson(storage, STORAGE_KEYS.settings, settings);
    },
    getActiveProjectId: () => storage.getItem(STORAGE_KEYS.activeProjectId) ?? undefined,
    saveActiveProjectId: (projectId) => {
      if (projectId) {
        safeSet(storage, STORAGE_KEYS.activeProjectId, projectId);
      } else {
        safeRemove(storage, STORAGE_KEYS.activeProjectId);
      }
    }
  };
};

export const saveImportedProject = (adapter: StorageAdapter, project: OpenApiProject): void => {
  const projects = adapter.getProjects();
  const nextProjects = [
    project,
    ...projects.filter((storedProject) => storedProject.id !== project.id)
  ];

  adapter.saveProjects(nextProjects);
  adapter.saveActiveProjectId(project.id);
};

export const updateSettings = (
  adapter: StorageAdapter,
  settings: Partial<UserSettings>
): UserSettings => {
  const nextSettings = {
    ...adapter.getSettings(),
    ...settings
  };

  adapter.saveSettings(nextSettings);
  return nextSettings;
};

export const appendRequestHistoryItem = (
  adapter: StorageAdapter,
  item: RequestHistoryItem
): void => {
  const nextHistory = [
    item,
    ...adapter.getHistory().filter((storedItem) => storedItem.id !== item.id)
  ];

  adapter.saveHistory(nextHistory);
};

const ensureStoredValue = <T>(
  storage: Storage,
  key: string,
  fallback: T,
  schema: z.ZodType<T>,
  diagnostics: StorageMigrationDiagnostic[]
): T => {
  const value = readStorageJson(storage, key);

  if (value.status !== "ok") {
    const code = value.status === "malformed" ? "malformed-json" : "missing-key";
    diagnostics.push({ key, code });
    safeWriteJson(storage, key, fallback);
    return fallback;
  }

  const parsed = schema.safeParse(value.data);

  if (!parsed.success) {
    diagnostics.push({ key, code: "invalid-shape" });
    safeWriteJson(storage, key, fallback);
    return fallback;
  }

  return parsed.data;
};

const readStoredValue = <T>(
  storage: Storage,
  key: string,
  fallback: T,
  schema: z.ZodType<T>
): T => {
  const value = readStorageJson(storage, key);
  if (value.status !== "ok") {
    return fallback;
  }

  const parsed = schema.safeParse(value.data);
  return parsed.success ? parsed.data : fallback;
};

const readStorageJson = (
  storage: Storage,
  key: string
): { status: "ok"; data: unknown } | { status: "missing" | "malformed" } => {
  const value = storage.getItem(key);

  if (!value) {
    return { status: "missing" };
  }

  try {
    return { status: "ok", data: JSON.parse(value) };
  } catch {
    return { status: "malformed" };
  }
};

const safeWriteJson = (storage: Storage, key: string, value: unknown): boolean => {
  return safeSet(storage, key, JSON.stringify(value));
};

const safeSet = (storage: Storage, key: string, value: string): boolean => {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemove = (storage: Storage, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage unavailability; callers keep in-memory fallbacks.
  }
};

const isFutureStorageVersion = (value: string | null): boolean =>
  Boolean(value && Number(value) > Number(CURRENT_STORAGE_VERSION));
