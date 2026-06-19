import type { ApiOperation, MockResponseResult, MockRouteSummary, OpenApiProject } from "@specdock/core";
import { generateMockResponse, saveMockRoute } from "./controller-helpers.js";
import type { MockServerState } from "./types.js";

export type MockActionsState = {
  activeProject?: OpenApiProject;
  mockServerState: MockServerState;
  setMockServerState(updater: (current: MockServerState) => MockServerState): void;
  setStatus(value: string): void;
};

export const createMockActions = (state: MockActionsState) => {
  const updateMockServerState = (patch: MockServerState) => {
    state.setMockServerState((current) =>
      nextMockState(current, patch, state.activeProject)
    );
  };

  const runMockResponse = async () => {
    if (!state.activeProject) {
      state.setStatus("Import a spec before generating a mock response.");
      return;
    }

    const operation = selectedMockOperation(state.activeProject, state.mockServerState);
    if (!operation) {
      state.setStatus("No operation is available for mock response generation.");
      return;
    }

    try {
      const response = await generateMockResponse({
        spec: state.activeProject.spec,
        method: operation.method,
        path: operation.path,
        statusCode: state.mockServerState.statusCode || undefined
      });
      updateMockServerState({ operationId: operation.id, response, route: undefined });
      state.setStatus(`Generated mock response for ${operation.method} ${operation.path}`);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Mock response failed.");
    }
  };

  const saveCurrentMockRoute = async () => {
    const operation = state.activeProject
      ? selectedMockOperation(state.activeProject, state.mockServerState)
      : undefined;
    const response = state.mockServerState.response;
    if (!operation || !response) {
      state.setStatus("Generate a mock response before saving a live route.");
      return;
    }

    try {
      const result = await saveMockRoute({
        method: operation.method,
        path: operation.path,
        status: response.status,
        statusText: response.statusText,
        body: response.body,
        contentType: response.contentType,
        operationId: response.operationId
      });
      updateMockServerState({ route: result.route });
      state.setStatus(`Saved live mock route ${result.route.url}`);
    } catch (error) {
      state.setStatus(error instanceof Error ? error.message : "Unable to save mock route.");
    }
  };

  return { updateMockServerState, runMockResponse, saveCurrentMockRoute };
};

const selectedMockOperation = (
  project: OpenApiProject,
  mockState: MockServerState
): ApiOperation | undefined =>
  project.operations.find((candidate) => candidate.id === mockState.operationId) ??
  project.operations[0];

const nextMockState = (
  current: MockServerState,
  patch: MockServerState,
  project: OpenApiProject | undefined
): MockServerState => {
  const operationId = "operationId" in patch ? patch.operationId : current.operationId;
  const statusCode = "statusCode" in patch ? patch.statusCode : current.statusCode;
  const next = { ...current, ...patch, operationId, statusCode };
  const key = mockStateKey(project, next);

  if (!key) {
    return next;
  }

  const entries = { ...(current.entries ?? {}) };
  const entry = {
    ...(entries[key] ?? {}),
    ...("response" in patch ? { response: patch.response } : {}),
    ...("route" in patch ? { route: patch.route } : {})
  };
  entries[key] = entry;

  const shouldHydrateSelected =
    "operationId" in patch || "statusCode" in patch;

  return {
    ...next,
    entries,
    response: shouldHydrateSelected ? entry.response : next.response,
    route: shouldHydrateSelected ? entry.route : next.route
  };
};

const mockStateKey = (
  project: OpenApiProject | undefined,
  mockState: MockServerState
): string | undefined => {
  if (!project) return undefined;

  const operation = selectedMockOperation(project, mockState);
  if (!operation) return undefined;

  return mockEntryKey(operation.id, mockState.statusCode);
};

export const mockEntryKey = (
  operationId: string,
  statusCode: string | undefined
): string => `${operationId}:${statusCode || "first-2xx"}`;

export type MockEntry = {
  response?: MockResponseResult;
  route?: MockRouteSummary;
};
