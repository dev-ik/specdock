import { useMemo } from "react";
import type {
  GeneratedFile,
  OpenApiProject,
  RequestState
} from "@specdock/core";
import { buildApiRequest, generateCurl } from "../request.js";
import { groupOperations } from "./controller-helpers.js";
import { createOperationKey } from "./request-utils.js";
import type {
  ExchangeMap,
  ProjectBaseUrlMap,
  RequestStateMap,
  ResponseScope
} from "./types.js";

type DerivedStateInput = {
  projects: OpenApiProject[];
  activeProjectId?: string;
  selectedOperationId?: string;
  requestStates: RequestStateMap;
  defaultRequestMode: RequestState["requestMode"];
  baseUrlsByProject: ProjectBaseUrlMap;
  files: GeneratedFile[];
  selectedPath?: string;
  searchQuery: string;
  exchangesByOperation: ExchangeMap;
  latestExchangeKey?: string;
  responseScope: ResponseScope;
};

export const useSpecDockDerivedState = ({
  projects,
  activeProjectId,
  selectedOperationId,
  requestStates,
  defaultRequestMode,
  baseUrlsByProject,
  files,
  selectedPath,
  searchQuery,
  exchangesByOperation,
  latestExchangeKey,
  responseScope
}: DerivedStateInput) => {
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [activeProjectId, projects]
  );
  const selectedOperation = useMemo(
    () =>
      activeProject?.operations.find(
        (operation) => operation.id === selectedOperationId
      ),
    [activeProject, selectedOperationId]
  );
  const operationKey =
    activeProject && selectedOperation
      ? createOperationKey(activeProject.id, selectedOperation.id)
      : undefined;
  const storedRequestState = operationKey
    ? requestStates[operationKey]
    : undefined;
  const requestState = storedRequestState
    ? { ...storedRequestState, requestMode: defaultRequestMode }
    : undefined;
  const selectedBaseUrl = activeProject
    ? (baseUrlsByProject[activeProject.id] ??
      activeProject.servers[0]?.url ??
      "")
    : "";
  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) ?? files[0],
    [files, selectedPath]
  );
  const operationGroups = useMemo(
    () => groupOperations(activeProject?.operations ?? [], searchQuery),
    [activeProject, searchQuery]
  );
  const builtRequest = useMemo(() => {
    if (!selectedOperation || !requestState || !selectedBaseUrl.trim()) {
      return undefined;
    }

    try {
      return buildApiRequest(selectedOperation, requestState, selectedBaseUrl);
    } catch {
      return undefined;
    }
  }, [requestState, selectedBaseUrl, selectedOperation]);
  const displayedExchange =
    responseScope === "latest"
      ? exchangesByOperation[latestExchangeKey ?? ""]
      : exchangesByOperation[operationKey ?? ""];
  const displayedContext = useMemo(() => {
    if (!displayedExchange) return undefined;
    const project = projects.find(
      (candidate) => candidate.id === displayedExchange.projectId
    );
    const operation = project?.operations.find(
      (candidate) => candidate.id === displayedExchange.operationId
    );

    return {
      projectName: project?.name ?? "Unknown project",
      operationLabel: operation
        ? `${operation.method} ${operation.path}`
        : displayedExchange.operationId
    };
  }, [displayedExchange, projects]);

  return {
    activeProject,
    selectedOperation,
    operationKey,
    requestState,
    selectedBaseUrl,
    selectedFile,
    operationGroups,
    builtRequest,
    displayedExchange,
    displayedContext,
    curlPreview: builtRequest ? generateCurl(builtRequest) : ""
  };
};
