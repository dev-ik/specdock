import type React from "react";
import {
  type GenerateOptions,
  type OpenApiProject
} from "@specdock/core";
import { importOpenApiFromUrl } from "../import-url.js";
import { persistProjectFromSpecText } from "../workspace.js";
import { downloadSdkZip, generateSdkFiles } from "./controller-helpers.js";
import { createRequestActions } from "./request-actions.js";
import { useSpecDockState } from "./useSpecDockState.js";

export const useSpecDockController = () => {
  const state = useSpecDockState();

  const refreshStoredProjects = (projectId?: string) => {
    state.setProjects(state.storageAdapter.getProjects());
    state.setHistoryCount(state.storageAdapter.getHistory().length);
    state.setActiveProjectId(projectId ?? state.storageAdapter.getActiveProjectId());
  };
  const activateProject = (project: OpenApiProject, message: string) => {
    state.setSpecText(JSON.stringify(project.spec, null, 2));
    state.setFiles([]);
    state.setSelectedPath(undefined);
    state.setGenerateMeta(undefined);
    state.setSearchQuery("");
    state.setBaseUrlsByProject((current) => ({
      ...current,
      [project.id]: current[project.id] ?? project.servers[0]?.url ?? ""
    }));
    state.setSelectedOperationId(project.operations[0]?.id);
    state.setActiveProjectId(project.id);
    state.storageAdapter.saveActiveProjectId(project.id);
    state.setStatus(message);
  };
  const openProject = (project: OpenApiProject) => {
    state.setCurrentSource(project.source);
    activateProject(project, `Opened ${project.name}`);
  };
  const importCurrentSpec = () => {
    const project = persistProjectFromSpecText(
      state.storageAdapter,
      state.specText,
      state.currentSource,
      state.activeProject
    );
    refreshStoredProjects(project.id);
    state.setBaseUrlsByProject((current) => ({
      ...current,
      [project.id]: current[project.id] ?? project.servers[0]?.url ?? state.selectedBaseUrl
    }));
    state.setSelectedOperationId(project.operations[0]?.id);
    return project;
  };
  const importFromUrl = async () => {
    state.setIsImportingUrl(true);
    state.setStatus("Importing OpenAPI URL");
    try {
      const imported = await importOpenApiFromUrl(state.urlInput);
      const project = persistProjectFromSpecText(state.storageAdapter, imported.text, {
        type: "url",
        url: imported.url
      });
      state.setSpecText(imported.text);
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name} from URL`);
      state.setCurrentSource({ type: "url", url: imported.url });
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import OpenAPI URL.");
    } finally {
      state.setIsImportingUrl(false);
    }
  };
  const importRawSpec = () => {
    try {
      state.setCurrentSource({ type: "raw" });
      const project = persistProjectFromSpecText(state.storageAdapter, state.specText, { type: "raw" }, state.activeProject);
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name}`);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import raw OpenAPI.");
    }
  };
  const uploadSpec = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importUploadedText(file.name, String(reader.result ?? ""));
    reader.readAsText(file);
  };
  const importUploadedText = (fileName: string, text: string) => {
    state.setSpecText(text);
    state.setFiles([]);
    state.setSelectedPath(undefined);
    state.setGenerateMeta(undefined);
    try {
      const project = persistProjectFromSpecText(state.storageAdapter, text, { type: "file", fileName });
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name} from ${fileName}`);
      state.setCurrentSource({ type: "file", fileName });
    } catch (error) {
      state.setActiveProjectId(undefined);
      state.setCurrentSource({ type: "file", fileName });
      state.setStatus(error instanceof Error ? error.message : `Loaded ${fileName}`);
    }
  };

  const generate = async () => {
    state.setIsGenerating(true);
    state.setStatus("Generating SDK");
    try {
      const project = importCurrentSpec();
      const payload = await generateSdkFiles(state.specText, state.generateOptions);
      state.setFiles(payload.files);
      state.setSelectedPath(payload.files[0]?.path);
      state.setGenerateMeta(payload.meta);
      state.setStatus(`Generated ${payload.meta.fileCount} files for ${project.name}`);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      state.setIsGenerating(false);
    }
  };
  const downloadZip = async () => {
    state.setIsDownloadingZip(true);
    state.setStatus("Preparing ZIP");
    try {
      await downloadSdkZip(state.specText, state.generateOptions);
      state.setStatus("ZIP downloaded");
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "ZIP download failed.");
    } finally {
      state.setIsDownloadingZip(false);
    }
  };
  const requestActions = createRequestActions(state);

  return {
    ...state,
    setSpecTextAsRaw: (value: string) => {
      state.setSpecText(value);
      state.setCurrentSource({ type: "raw" });
    },
    updateProjectBaseUrl: (projectId: string, value: string) => {
      state.setBaseUrlsByProject((current) => ({ ...current, [projectId]: value }));
    },
    updateGenerateOptions: (patch: Partial<GenerateOptions>) => {
      state.setGenerateOptions((current) => ({ ...current, ...patch }));
    },
    clearRequestHistory: () => {
      state.storageAdapter.saveHistory([]);
      state.setHistoryCount(0);
      state.setStatus("Request history cleared");
    },
    copyText: async (label: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        state.setStatus(`${label} copied`);
      } catch {
        state.setStatus(`Unable to copy ${label.toLowerCase()}`);
      }
    },
    openProject,
    importFromUrl,
    importRawSpec,
    uploadSpec,
    ...requestActions,
    generate,
    downloadZip
  };
};
