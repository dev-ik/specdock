import {
  appendRequestHistoryItem,
  redactSensitiveUrl,
  type ApiOperation,
  type OpenApiProject,
  type RequestState
} from "@specdock/core";
import {
  createRequestState,
  executeBrowserRequest,
  type ResponseViewModel
} from "../request.js";
import { createFailedResponse } from "./controller-helpers.js";
import {
  createRequestId,
  executeProxyRequest,
  uniqueHeaderName
} from "./request-utils.js";
import { directRequestBlockReason } from "./deployment-policy.js";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;

export const createRequestActions = (state: State) => {
  const updateRequestState = (
    key: string,
    operation: ApiOperation,
    patch: Partial<RequestState>
  ) => {
    const nextRequestMode = patch.requestMode ?? state.defaultRequestMode;

    if (patch.requestMode) {
      state.setDefaultRequestMode(patch.requestMode);
      state.storageAdapter.saveSettings({
        ...state.storageAdapter.getSettings(),
        defaultRequestMode: patch.requestMode
      });
    }

    state.setRequestStates((current) => ({
      ...syncRequestMode(current, nextRequestMode),
      [key]: {
        ...createRequestState(operation, nextRequestMode),
        ...current[key],
        ...patch,
        requestMode: nextRequestMode
      }
    }));
  };
  const updateRecordField = (
    section: "pathParams" | "queryParams" | "headers",
    name: string,
    value: string
  ) => {
    if (!state.selectedOperation || !state.operationKey || !state.requestState)
      return;
    updateRequestState(state.operationKey, state.selectedOperation, {
      [section]: { ...state.requestState[section], [name]: value }
    });
  };
  const renameRecordField = (
    section: "pathParams" | "queryParams" | "headers",
    oldName: string,
    newName: string
  ) => {
    if (
      !state.selectedOperation ||
      !state.operationKey ||
      !state.requestState ||
      oldName === newName
    )
      return;
    const nextValues = Object.fromEntries(
      Object.entries(state.requestState[section]).map(([name, value]) =>
        name === oldName ? [newName, value] : [name, value]
      )
    );
    updateRequestState(state.operationKey, state.selectedOperation, {
      [section]: nextValues
    });
  };
  const removeRecordField = (
    section: "pathParams" | "queryParams" | "headers",
    nameToRemove: string
  ) => {
    if (!state.selectedOperation || !state.operationKey || !state.requestState)
      return;
    const nextValues = Object.fromEntries(
      Object.entries(state.requestState[section]).filter(
        ([name]) => name !== nameToRemove
      )
    );
    updateRequestState(state.operationKey, state.selectedOperation, {
      [section]: nextValues
    });
  };
  const addHeader = () => {
    if (!state.selectedOperation || !state.operationKey || !state.requestState)
      return;
    updateRequestState(state.operationKey, state.selectedOperation, {
      headers: {
        ...state.requestState.headers,
        [uniqueHeaderName(state.requestState.headers)]: ""
      }
    });
  };
  const updateRequestBodyFile = (
    operationKey: string,
    name: string,
    file: File | undefined
  ) => {
    state.setRequestBodyFilesByOperation((current) => {
      const currentFiles = current[operationKey] ?? {};
      const nextFiles = { ...currentFiles };

      if (file) {
        nextFiles[name] = file;
      } else {
        delete nextFiles[name];
      }

      return {
        ...current,
        [operationKey]: nextFiles
      };
    });
  };
  const fillRequestBodyExample = () => {
    if (!state.selectedOperation || !state.operationKey || !state.requestBodyExample)
      return;
    updateRequestState(state.operationKey, state.selectedOperation, {
      body: state.requestBodyExample
    });
    state.setStatus("Request body example filled");
  };
  const executeRequest = async () => {
    if (
      !state.activeProject ||
      !state.selectedOperation ||
      !state.operationKey ||
      !state.requestState ||
      !state.builtRequest
    ) {
      state.setStatus("Select an operation and enter a valid base URL.");
      return;
    }
    const blockReason = directRequestBlockReason(
      state.appConfig,
      state.requestState.requestMode,
      state.builtRequest.url
    );

    if (blockReason) {
      state.setStatus(blockReason);
      return;
    }

    state.setIsExecuting(true);
    state.setStatus(
      state.requestState.requestMode === "proxy"
        ? "Executing through proxy"
        : "Executing browser request"
    );
    try {
      const response =
        state.requestState.requestMode === "proxy"
          ? await executeProxyRequest(state.builtRequest)
          : await executeBrowserRequest(state.builtRequest);
      saveExchange(
        state,
        state.activeProject,
        state.selectedOperation,
        state.operationKey,
        response
      );
      state.setStatus(`Request completed with ${response.status}`);
    } catch (error) {
      const response = createFailedResponse(error);
      saveExchange(
        state,
        state.activeProject,
        state.selectedOperation,
        state.operationKey,
        response
      );
      state.setStatus(response.body);
    } finally {
      state.setIsExecuting(false);
    }
  };

  return {
    updateRequestState,
    updateRecordField,
    renameRecordField,
    removeRecordField,
    addHeader,
    updateRequestBodyFile,
    fillRequestBodyExample,
    executeRequest
  };
};

const syncRequestMode = (
  states: Record<string, RequestState>,
  requestMode: RequestState["requestMode"]
): Record<string, RequestState> => {
  return Object.fromEntries(
    Object.entries(states).map(([key, value]) => [
      key,
      { ...value, requestMode }
    ])
  );
};

const saveExchange = (
  state: State,
  project: OpenApiProject,
  operation: ApiOperation,
  key: string,
  response: ResponseViewModel
) => {
  if (!state.builtRequest) return;
  const createdAt = new Date().toISOString();
  state.setExchangesByOperation((current) => ({
    ...current,
    [key]: {
      projectId: project.id,
      operationId: operation.id,
      request: state.builtRequest!,
      response,
      createdAt
    }
  }));
  state.setLatestExchangeKey(key);
  appendRequestHistoryItem(state.storageAdapter, {
    id: createRequestId(),
    projectId: project.id,
    operationId: operation.id,
    method: state.builtRequest.method,
    url: redactSensitiveUrl(state.builtRequest.url),
    status: response.status,
    durationMs: response.durationMs,
    createdAt
  });
  state.setHistoryCount(state.storageAdapter.getHistory().length);
};
