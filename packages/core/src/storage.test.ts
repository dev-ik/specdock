import { describe, expect, it } from "vitest";
import { CURRENT_STORAGE_VERSION, defaultSettings, LIMITS, STORAGE_KEYS } from "./constants.js";
import {
  appendRequestHistoryItem,
  createLocalStorageAdapter,
  saveImportedProject,
  updateSettings
} from "./storage.js";
import type { OpenApiProject, RequestHistoryItem } from "./types.js";

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const createProject = (id: string): OpenApiProject => ({
  id,
  name: `Project ${id}`,
  source: { type: "raw" },
  spec: {
    openapi: "3.1.0",
    info: { title: `Project ${id}`, version: "1.0.0" },
    paths: {}
  },
  servers: [],
  tags: [],
  operations: [],
  schemas: [],
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
});

const createHistoryItem = (id: string): RequestHistoryItem => ({
  id,
  projectId: "project-1",
  method: "GET",
  url: `https://api.example.com/${id}`,
  createdAt: "2026-06-16T00:00:00.000Z"
});

describe("local storage adapter", () => {
  it("migrates missing and invalid local storage keys", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.settings, "not json");

    const adapter = createLocalStorageAdapter(storage);

    expect(storage.getItem(STORAGE_KEYS.storageVersion)).toBe(CURRENT_STORAGE_VERSION);
    expect(adapter.getProjects()).toEqual([]);
    expect(adapter.getSettings()).toEqual(defaultSettings);
  });

  it("saves imported projects as active and keeps the newest project first", () => {
    const adapter = createLocalStorageAdapter(new MemoryStorage());

    saveImportedProject(adapter, createProject("old"));
    saveImportedProject(adapter, createProject("new"));
    saveImportedProject(adapter, { ...createProject("old"), name: "Updated" });

    expect(adapter.getProjects().map((project) => project.id)).toEqual(["old", "new"]);
    expect(adapter.getProjects()[0]?.name).toBe("Updated");
    expect(adapter.getActiveProjectId()).toBe("old");
  });

  it("caps stored projects at the configured limit", () => {
    const adapter = createLocalStorageAdapter(new MemoryStorage());

    for (let index = 0; index < LIMITS.maxStoredProjects + 2; index += 1) {
      saveImportedProject(adapter, createProject(`project-${index}`));
    }

    expect(adapter.getProjects()).toHaveLength(LIMITS.maxStoredProjects);
    expect(adapter.getProjects()[0]?.id).toBe(`project-${LIMITS.maxStoredProjects + 1}`);
  });

  it("updates settings without dropping existing values", () => {
    const adapter = createLocalStorageAdapter(new MemoryStorage());

    const settings = updateSettings(adapter, { defaultClient: "axios" });

    expect(settings).toEqual({
      ...defaultSettings,
      defaultClient: "axios"
    });
    expect(adapter.getSettings()).toEqual(settings);
  });

  it("deduplicates request history and caps it at the configured limit", () => {
    const adapter = createLocalStorageAdapter(new MemoryStorage());

    for (let index = 0; index < LIMITS.maxHistoryItems + 2; index += 1) {
      appendRequestHistoryItem(adapter, createHistoryItem(`request-${index}`));
    }

    appendRequestHistoryItem(adapter, {
      ...createHistoryItem("request-99"),
      status: 200
    });

    const history = adapter.getHistory();

    expect(history).toHaveLength(LIMITS.maxHistoryItems);
    expect(history[0]).toMatchObject({ id: "request-99", status: 200 });
    expect(history.filter((item) => item.id === "request-99")).toHaveLength(1);
  });
});
