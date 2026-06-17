import { isSensitiveParameterName, type RequestState } from "@specdock/core";
import type { RequestStateMap } from "./types.js";

export type PersistedRequestState = Pick<
  RequestState,
  "operationId" | "pathParams" | "queryParams" | "requestMode"
>;

export const sanitizeRequestStatesForStorage = (
  requestStates: RequestStateMap
): Record<string, PersistedRequestState> => {
  return Object.fromEntries(
    Object.entries(requestStates).map(([key, state]) => [
      key,
      sanitizeRequestStateForStorage(state)
    ])
  );
};

export const hydrateStoredRequestStates = (
  requestStates: Partial<Record<string, Partial<RequestState>>>
): RequestStateMap => {
  return Object.fromEntries(
    Object.entries(requestStates).flatMap(([key, state]) => {
      if (!state?.operationId) {
        return [];
      }

      return [
        [
          key,
          {
            operationId: state.operationId,
            pathParams: safeRecord(state.pathParams),
            queryParams: safeQueryParams(state.queryParams),
            headers: {},
            body: undefined,
            requestMode: state.requestMode === "proxy" ? "proxy" : "direct"
          }
        ]
      ];
    })
  );
};

const sanitizeRequestStateForStorage = (
  state: RequestState
): PersistedRequestState => ({
  operationId: state.operationId,
  pathParams: safeRecord(state.pathParams),
  queryParams: safeQueryParams(state.queryParams),
  requestMode: state.requestMode
});

const safeRecord = (
  values: Record<string, string> | undefined
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(values ?? {}).filter(
      ([name, value]) => name.trim() && typeof value === "string"
    )
  );
};

const safeQueryParams = (
  values: Record<string, string> | undefined
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(safeRecord(values)).map(([name, value]) => [
      name,
      isSensitiveParameterName(name) ? "" : value
    ])
  );
};
