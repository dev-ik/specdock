import type { OpenApiProject } from "@specdock/core";
import type { ProjectBaseUrlMap } from "./types.js";

export type BaseUrlMode = "preserve" | "reset";

export const serverBaseUrl = (project: OpenApiProject): string =>
  project.servers[0]?.url ?? "";

export const applyProjectBaseUrl = (
  current: ProjectBaseUrlMap,
  project: OpenApiProject,
  mode: BaseUrlMode,
  fallback = "https://api.example.com"
): ProjectBaseUrlMap => ({
  ...current,
  [project.id]: mode === "reset"
    ? serverBaseUrl(project)
    : (current[project.id] ?? serverBaseUrl(project)) || fallback
});
