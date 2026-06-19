import type { OpenApiProject } from "@specdock/core";
import { appendCurlCommandToSpec, importCurlCommand } from "../curl-import.js";
import { persistProjectFromSpecText } from "../workspace.js";
import type { BaseUrlMode } from "./base-url.js";
import { createOperationKey } from "./request-utils.js";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;
type ActivateProject = (
  project: OpenApiProject,
  message: string,
  options?: { baseUrlMode?: BaseUrlMode }
) => void;

export const createCurlActions = (
  state: State,
  activateProject: ActivateProject,
  refreshStoredProjects: (projectId?: string) => void
) => {
  const importCurl = () => {
    try {
      const imported = importCurlCommand(state.curlInput, state.defaultRequestMode);
      const project = persistProjectFromSpecText(state.storageAdapter, imported.specText, { type: "curl" });
      const operation = project.operations.find((candidate) => candidate.id === imported.operationId);
      if (!operation) {
        throw new Error("Imported cURL did not produce an operation.");
      }

      refreshStoredProjects(project.id);
      activateProject(project, `Imported cURL as ${operation.method} ${operation.path}`, {
        baseUrlMode: "reset"
      });
      state.setSpecText(imported.specText);
      state.setCurrentSource({ type: "curl" });
      state.setBaseUrlsByProject((current) => ({ ...current, [project.id]: imported.baseUrl }));
      state.setSelectedOperationId(operation.id);
      saveImportedRequestState(state, project, operation.id, imported.requestState);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import cURL.");
    }
  };

  const appendCurlToActiveProject = () => {
    if (!state.activeProject) {
      state.setStatus("Open or import a project before adding cURL.");
      return;
    }

    try {
      const imported = appendCurlCommandToSpec(
        state.activeProject.spec,
        state.curlInput,
        state.defaultRequestMode
      );
      const project = persistProjectFromSpecText(
        state.storageAdapter,
        imported.specText,
        { type: "curl" },
        state.activeProject
      );
      const operation = project.operations.find((candidate) => candidate.id === imported.operationId);
      if (!operation) {
        throw new Error("Imported cURL did not produce an operation.");
      }

      refreshStoredProjects(project.id);
      activateProject(project, `Added ${operation.method} ${operation.path} to ${project.name}`, {
        baseUrlMode: "preserve"
      });
      state.setSpecText(imported.specText);
      state.setCurrentSource({ type: "curl" });
      state.setBaseUrlsByProject((current) => ({
        ...current,
        [project.id]: current[project.id] || imported.baseUrl
      }));
      state.setSelectedOperationId(operation.id);
      saveImportedRequestState(state, project, operation.id, imported.requestState);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to add cURL to project.");
    }
  };

  return { importCurl, appendCurlToActiveProject };
};

const saveImportedRequestState = (
  state: State,
  project: OpenApiProject,
  operationId: string,
  requestState: State["requestStates"][string]
) => {
  state.setRequestStates((current) => ({
    ...current,
    [createOperationKey(project.id, operationId)]: {
      ...requestState,
      operationId
    }
  }));
};
