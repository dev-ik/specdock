import { CURRENT_STORAGE_VERSION, defaultSettings, LIMITS, STORAGE_KEYS } from "./constants.js";
import type {
  AuthProfile,
  Environment,
  OpenApiProject,
  RequestHistoryItem,
  StorageAdapter,
  UserSettings
} from "./types.js";

export const migrateStorage = (storage: Storage): void => {
  ensureJson(storage, STORAGE_KEYS.projects, []);
  ensureJson(storage, STORAGE_KEYS.environments, []);
  ensureJson(storage, STORAGE_KEYS.authProfiles, []);
  ensureJson(storage, STORAGE_KEYS.history, []);
  ensureJson(storage, STORAGE_KEYS.settings, defaultSettings);
  storage.setItem(STORAGE_KEYS.storageVersion, CURRENT_STORAGE_VERSION);
};

export const createLocalStorageAdapter = (storage: Storage): StorageAdapter => {
  migrateStorage(storage);

  return {
    getProjects: () => readJson<OpenApiProject[]>(storage, STORAGE_KEYS.projects, []),
    saveProjects: (projects) => {
      writeJson(storage, STORAGE_KEYS.projects, projects.slice(0, LIMITS.maxStoredProjects));
    },
    getEnvironments: () => readJson<Environment[]>(storage, STORAGE_KEYS.environments, []),
    saveEnvironments: (environments) => {
      writeJson(storage, STORAGE_KEYS.environments, environments);
    },
    getAuthProfiles: () => readJson<AuthProfile[]>(storage, STORAGE_KEYS.authProfiles, []),
    saveAuthProfiles: (authProfiles) => {
      writeJson(storage, STORAGE_KEYS.authProfiles, authProfiles);
    },
    getHistory: () => readJson<RequestHistoryItem[]>(storage, STORAGE_KEYS.history, []),
    saveHistory: (history) => {
      writeJson(storage, STORAGE_KEYS.history, history.slice(0, LIMITS.maxHistoryItems));
    },
    getSettings: () => readJson<UserSettings>(storage, STORAGE_KEYS.settings, defaultSettings),
    saveSettings: (settings) => {
      writeJson(storage, STORAGE_KEYS.settings, settings);
    },
    getActiveProjectId: () => storage.getItem(STORAGE_KEYS.activeProjectId) ?? undefined,
    saveActiveProjectId: (projectId) => {
      if (projectId) {
        storage.setItem(STORAGE_KEYS.activeProjectId, projectId);
      } else {
        storage.removeItem(STORAGE_KEYS.activeProjectId);
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

const ensureJson = <T>(storage: Storage, key: string, fallback: T): void => {
  const value = readJson<T | undefined>(storage, key, undefined);

  if (value === undefined) {
    writeJson(storage, key, fallback);
  }
};

const readJson = <T>(storage: Storage, key: string, fallback: T): T => {
  const value = storage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (storage: Storage, key: string, value: unknown): void => {
  storage.setItem(key, JSON.stringify(value));
};
