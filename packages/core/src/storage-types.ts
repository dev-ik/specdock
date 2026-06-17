import type { HttpMethod, OpenApiProject } from "./openapi-types.js";

export type RequestState = {
  operationId: string;
  environmentId?: string;
  authProfileId?: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  requestMode: "direct" | "proxy";
};

export type Environment = {
  id: string;
  projectId: string;
  name: string;
  baseUrl: string;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type AuthProfile = {
  id: string;
  projectId: string;
  name: string;
  type: "none" | "bearer" | "apiKey" | "basic";
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type RequestHistoryItem = {
  id: string;
  projectId: string;
  operationId?: string;
  method: HttpMethod;
  url: string;
  status?: number;
  durationMs?: number;
  createdAt: string;
};

export type UserSettings = {
  theme: "dark" | "light" | "system";
  defaultClient: "fetch" | "axios";
  defaultRequestMode: "direct" | "proxy";
};

export type StorageSchema = {
  projects: OpenApiProject[];
  environments: Environment[];
  authProfiles: AuthProfile[];
  history: RequestHistoryItem[];
  settings: UserSettings;
  activeProjectId?: string;
};

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
  getActiveProjectId(): string | undefined;
  saveActiveProjectId(projectId: string | undefined): void;
};
