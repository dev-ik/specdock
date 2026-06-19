import { useEffect } from "react";
import type {
  ApiOperation,
  AppConfigResponse,
  MockRouteSummary,
  OpenApiProject
} from "@specdock/core";
import { listMockRoutes } from "./controller-helpers.js";
import type { MockServerState } from "./types.js";

export const useMockRouteHydration = ({
  activeProject,
  appConfig,
  mockServerState,
  setMockServerState
}: {
  activeProject?: OpenApiProject;
  appConfig: AppConfigResponse;
  mockServerState: MockServerState;
  setMockServerState(updater: (current: MockServerState) => MockServerState): void;
}) => {
  useEffect(() => {
    if (!appConfig.mockServer.enabled || !activeProject) return;

    const selectedOperation =
      activeProject.operations.find(
        (candidate) => candidate.id === mockServerState.operationId
      ) ?? activeProject.operations[0];
    if (!selectedOperation) return;

    let cancelled = false;
    listMockRoutes()
      .then(({ routes }) => {
        if (cancelled) return;

        const match = findMockRouteMatch(
          routes,
          activeProject.operations,
          selectedOperation,
          mockServerState.operationId
        );
        if (!match) return;

        setMockServerState((current) => {
          const statusCode = String(match.route.status);
          const key = `${match.operation.id}:${statusCode}`;
          const entries = {
            ...(current.entries ?? {}),
            [key]: {
              ...(current.entries?.[key] ?? {}),
              route: match.route
            }
          };

          if (current.response || current.route || current.operationId) {
            return { ...current, entries };
          }

          return {
            ...current,
            entries,
            operationId: match.operation.id,
            statusCode,
            route: match.route
          };
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activeProject, appConfig.mockServer.enabled, mockServerState.operationId, setMockServerState]);
};

const routeMatchesOperation = (
  route: MockRouteSummary,
  operation: ApiOperation
): boolean =>
  route.operationId === operation.operationId ||
  route.operationId === operation.id ||
  (route.method === operation.method && route.path === operation.path);

const findMockRouteMatch = (
  routes: MockRouteSummary[],
  operations: ApiOperation[],
  selectedOperation: ApiOperation,
  selectedOperationId?: string
): { operation: ApiOperation; route: MockRouteSummary } | undefined => {
  const selectedRoute = routes.find((route) =>
    routeMatchesOperation(route, selectedOperation)
  );
  if (selectedRoute) {
    return { operation: selectedOperation, route: selectedRoute };
  }

  if (selectedOperationId) {
    return undefined;
  }

  for (const operation of operations) {
    const route = routes.find((candidate) =>
      routeMatchesOperation(candidate, operation)
    );
    if (route) {
      return { operation, route };
    }
  }

  return undefined;
};
