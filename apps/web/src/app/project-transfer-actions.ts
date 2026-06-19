import type { OpenApiProject, RequestState } from "@specdock/core";
import { persistProjectFromSpecText } from "../workspace.js";
import { downloadTextFile } from "./controller-helpers.js";
import { hydrateGenerateOptions } from "./generate-options.js";
import { createProjectExport, parseProjectExport } from "./project-transfer.js";
import { createOperationKey } from "./request-utils.js";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;

export const createProjectTransferActions = (
  state: State,
  activateProject: (project: OpenApiProject, message: string) => void,
  refreshStoredProjects: (projectId?: string) => void
) => {
  const importProjectExport = (text: string) => {
    try {
      const payload = parseProjectExport(text);
      const project = persistProjectFromSpecText(
        state.storageAdapter,
        JSON.stringify(payload.project.spec, null, 2),
        { type: "raw" }
      );
      const rekeyedRequestStates = Object.fromEntries(
        Object.entries(payload.preferences.requestStates).map(([operationId, requestState]) => [
          createOperationKey(project.id, operationId),
          { ...(requestState as RequestState), operationId }
        ])
      );

      refreshStoredProjects(project.id);
      activateProject(project, `Imported ${project.name} workspace`);
      state.setBaseUrlsByProject((current) => ({
        ...current,
        [project.id]: payload.preferences.baseUrl ?? project.servers[0]?.url ?? ""
      }));
      state.setRequestStates((current) => ({ ...current, ...rekeyedRequestStates }));
      state.setGenerateOptions(
        hydrateGenerateOptions(
          state.storageAdapter.getSettings().defaultClient,
          payload.preferences.generateOptions
        )
      );
      state.setCurrentSource({ type: "raw" });
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to import SpecDock project.");
    }
  };

  const exportProject = (project: OpenApiProject) => {
    const content = createProjectExport({
      project,
      baseUrl: state.baseUrlsByProject[project.id],
      requestStates: state.requestStates,
      generateOptions: state.generateOptions
    });
    downloadTextFile(`${safeFileName(project.name)}.specdock.json`, content);
    state.setStatus(`Exported ${project.name}`);
  };

  return { importProjectExport, exportProject };
};

const safeFileName = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
  "specdock-project";
