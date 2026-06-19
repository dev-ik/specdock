import {
  createLocalStorageAdapter,
  normalizeSpec,
  saveImportedProject,
  type OpenApiSource,
  type OpenApiProject,
  type StorageAdapter
} from "@specdock/core";

export const createWorkspaceStorage = (): StorageAdapter => {
  return createLocalStorageAdapter(window.localStorage);
};

export const buildProjectFromSpecText = (
  specText: string,
  source: OpenApiSource,
  existingProject?: OpenApiProject
): OpenApiProject => {
  const normalized = normalizeSpec(specText);
  const title = getInfoTitle(normalized.spec) ?? "Untitled API";
  const now = new Date().toISOString();

  return {
    id: existingProject?.id ?? createProjectId(),
    name: title,
    source,
    specFormat: normalized.specFormat,
    spec: normalized.spec,
    servers: normalized.servers,
    tags: normalized.tags,
    operations: normalized.operations,
    schemas: normalized.schemas,
    createdAt: existingProject?.createdAt ?? now,
    updatedAt: now
  };
};

export const persistProjectFromSpecText = (
  adapter: StorageAdapter,
  specText: string,
  source: OpenApiSource,
  existingProject?: OpenApiProject
): OpenApiProject => {
  const project = buildProjectFromSpecText(specText, source, existingProject);
  saveImportedProject(adapter, project);
  return project;
};

const getInfoTitle = (spec: Record<string, unknown>): string | undefined => {
  const info = spec.info;

  if (typeof info !== "object" || info === null || Array.isArray(info)) {
    return undefined;
  }

  const title = (info as Record<string, unknown>).title;
  return typeof title === "string" && title.trim() ? title.trim() : undefined;
};

const createProjectId = (): string => {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now().toString(36)}`;
};
