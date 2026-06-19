import type { OpenApiProject } from "@specdock/core";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;

export const createProjectActions = (
  state: State,
  activateProject: (project: OpenApiProject, message: string) => void
) => {
  const deleteProject = (project: OpenApiProject) => {
    if (!window.confirm(`Delete "${project.name}" from local projects?`)) {
      return;
    }

    const nextProjects = state.storageAdapter
      .getProjects()
      .filter((candidate) => candidate.id !== project.id);
    state.storageAdapter.saveProjects(nextProjects);
    state.storageAdapter.saveHistory(
      state.storageAdapter.getHistory().filter((item) => item.projectId !== project.id)
    );
    state.setProjects(nextProjects);
    state.setHistoryCount(state.storageAdapter.getHistory().length);
    state.setBaseUrlsByProject((current) => omitProjectKey(current, project.id));
    state.setRequestStates((current) => omitProjectOperationKeys(current, project.id));
    state.setRequestBodyFilesByOperation((current) => omitProjectOperationKeys(current, project.id));
    state.setExchangesByOperation((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([, exchange]) => exchange.projectId !== project.id)
      );

      if (state.latestExchangeKey && !(state.latestExchangeKey in next)) {
        state.setLatestExchangeKey(undefined);
      }

      return next;
    });

    if (state.activeProjectId !== project.id) {
      state.setStatus(`Deleted ${project.name}`);
      return;
    }

    const nextProject = nextProjects[0];
    if (nextProject) {
      activateProject(nextProject, `Deleted ${project.name}. Opened ${nextProject.name}`);
      return;
    }

    clearActiveProject(state, `Deleted ${project.name}`);
  };

  return { deleteProject };
};

const clearActiveProject = (state: State, message: string) => {
  state.storageAdapter.saveActiveProjectId(undefined);
  state.setActiveProjectId(undefined);
  state.setCurrentSource({ type: "raw" });
  state.setSpecText("");
  state.setFiles([]);
  state.setGeneratedDiff(undefined);
  state.setGeneratedFilesTarget(undefined);
  state.setSelectedPath(undefined);
  state.setGenerateMeta(undefined);
  state.setSearchQuery("");
  state.setSelectedOperationId(undefined);
  state.setStatus(message);
};

const omitProjectKey = <T>(values: Record<string, T>, projectId: string): Record<string, T> => {
  return Object.fromEntries(Object.entries(values).filter(([key]) => key !== projectId));
};

const omitProjectOperationKeys = <T>(values: Record<string, T>, projectId: string): Record<string, T> => {
  const prefix = `${projectId}::`;
  return Object.fromEntries(Object.entries(values).filter(([key]) => !key.startsWith(prefix)));
};
