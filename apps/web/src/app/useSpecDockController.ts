import type React from "react";
import { type GenerateOptions, type OpenApiProject } from "@specdock/core";
import { importOpenApiFromUrl } from "../import-url.js";
import { persistProjectFromSpecText } from "../workspace.js";
import { createAuthActions } from "./auth-actions.js";
import { applyProjectBaseUrl, type BaseUrlMode } from "./base-url.js";
import { downloadSdkZip, downloadTextFile, generateSdkFiles } from "./controller-helpers.js";
import { createCurlActions } from "./curl-actions.js";
import { directRequestBlockReason } from "./deployment-policy.js";
import { createHttpCollection } from "./http-collection.js";
import { createProjectActions } from "./project-actions.js";
import { createProjectTransferActions } from "./project-transfer-actions.js";
import { createRequestActions } from "./request-actions.js";
import { canDiffGeneratedFiles, diffGeneratedFiles, generatedFilesTargetFromOptions } from "./sdk-diff.js";
import { useSpecDockState } from "./useSpecDockState.js";

export const useSpecDockController = () => {
  const state = useSpecDockState();

  const refreshStoredProjects = (projectId?: string) => {
    state.setProjects(state.storageAdapter.getProjects());
    state.setHistoryCount(state.storageAdapter.getHistory().length);
    state.setActiveProjectId(projectId ?? state.storageAdapter.getActiveProjectId());
  };
  const activateProject = (project: OpenApiProject, message: string, options: { previousProjectForDiff?: OpenApiProject; baseUrlMode?: BaseUrlMode } = {}) => {
    state.setSpecText(JSON.stringify(project.spec, null, 2));
    state.setFiles([]);
    state.setGeneratedDiff(undefined);
    state.setGeneratedFilesTarget(undefined);
    state.setSelectedPath(undefined);
    state.setGenerateMeta(undefined);
    state.setSearchQuery("");
    state.setBaseUrlsByProject((current) => applyProjectBaseUrl(current, project, options.baseUrlMode ?? "preserve", ""));
    state.setSelectedOperationId(project.operations[0]?.id);
    state.setPreviousProjectForDiff(options.previousProjectForDiff);
    state.setActiveProjectId(project.id);
    state.storageAdapter.saveActiveProjectId(project.id);
    state.setStatus(message);
  };
  const openProject = (project: OpenApiProject) => {
    state.setCurrentSource(project.source);
    activateProject(project, `Opened ${project.name}`);
  };
  const importCurrentSpec = () => {
    const previousProject = state.activeProject;
    const project = persistProjectFromSpecText(state.storageAdapter, state.specText, state.currentSource, state.activeProject);
    refreshStoredProjects(project.id);
    state.setBaseUrlsByProject((current) => ({ ...current, [project.id]: current[project.id] ?? project.servers[0]?.url ?? state.selectedBaseUrl }));
    state.setSelectedOperationId(project.operations[0]?.id);
    state.setPreviousProjectForDiff(previousProject);
    return project;
  };
  const importFromUrl = async () => {
    state.setIsImportingUrl(true);
    state.setStatus("Importing OpenAPI URL");
    try {
      const imported = await importOpenApiFromUrl(state.urlInput);
      const project = persistProjectFromSpecText(state.storageAdapter, imported.text, { type: "url", url: imported.url });
      state.setSpecText(imported.text);
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name} from URL`, { baseUrlMode: "reset" });
      state.setCurrentSource({ type: "url", url: imported.url });
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import OpenAPI URL.");
    } finally {
      state.setIsImportingUrl(false);
    }
  };
  const importRawSpec = () => {
    try {
      const previousProject = state.activeProject;
      state.setCurrentSource({ type: "raw" });
      const project = persistProjectFromSpecText(state.storageAdapter, state.specText, { type: "raw" }, state.activeProject);
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name}`, { previousProjectForDiff: previousProject, baseUrlMode: "reset" });
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import raw OpenAPI.");
    }
  };
  const uploadSpec = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (file.name.endsWith(".specdock.json")) {
        projectTransferActions.importProjectExport(text);
      } else {
        importUploadedText(file.name, text);
      }
    };
    reader.readAsText(file);
  };
  const importUploadedText = (fileName: string, text: string) => {
    state.setSpecText(text);
    state.setFiles([]);
    state.setGeneratedDiff(undefined);
    state.setGeneratedFilesTarget(undefined);
    state.setSelectedPath(undefined);
    state.setGenerateMeta(undefined);
    try {
      const project = persistProjectFromSpecText(state.storageAdapter, text, { type: "file", fileName });
      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name} from ${fileName}`, { baseUrlMode: "reset" });
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
      const currentTarget = generatedFilesTargetFromOptions(state.generateOptions);
      const payload = await generateSdkFiles(state.specText, state.generateOptions);
      const shouldDiff = canDiffGeneratedFiles(state.generatedFilesTarget, currentTarget);
      state.setGeneratedDiff(shouldDiff ? diffGeneratedFiles(state.files, payload.files) : undefined);
      state.setFiles(payload.files);
      state.setGeneratedFilesTarget(currentTarget);
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
  const exportHttpCollection = () => {
    if (!state.activeProject) {
      state.setStatus("Import a spec before exporting HTTP collection.");
      return;
    }

    const content = createHttpCollection({
      project: state.activeProject,
      baseUrl: state.selectedBaseUrl,
      requestStates: state.requestStates
    });
    downloadTextFile(`${safeFileName(state.activeProject.name)}.http`, content);
    state.setStatus(`Exported HTTP collection for ${state.activeProject.name}`);
  };
  const requestActions = createRequestActions(state);
  const projectActions = createProjectActions(state, activateProject);
  const projectTransferActions = createProjectTransferActions(state, activateProject, refreshStoredProjects);
  const curlActions = createCurlActions(state, activateProject, refreshStoredProjects);
  const authActions = createAuthActions(state);
  const requestExecutionBlockReason = directRequestBlockReason(
    state.appConfig,
    state.requestState?.requestMode,
    state.builtRequest?.url ?? state.selectedBaseUrl
  );

  return {
    ...state,
    requestExecutionBlockReason,
    setSpecTextAsRaw: (value: string) => {
      state.setSpecText(value);
      state.setCurrentSource({ type: "raw" });
    },
    updateProjectBaseUrl: (projectId: string, value: string) => {
      state.setBaseUrlsByProject((current) => ({ ...current, [projectId]: value }));
    },
    updateGenerateOptions: (patch: Partial<GenerateOptions>) => {
      state.setGenerateOptions((current) => {
        if (patch.language && patch.language !== current.language) {
          state.setGeneratedDiff(undefined);
        }
        return { ...current, ...patch };
      });
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
    ...projectActions,
    ...projectTransferActions,
    ...curlActions,
    importFromUrl,
    importRawSpec,
    uploadSpec,
    ...requestActions,
    ...authActions,
    generate,
    downloadZip,
    exportHttpCollection
  };
};

const safeFileName = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
  "specdock-collection";
