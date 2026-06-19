import { useMemo } from "react";
import type {
  GeneratedFile,
  AuthProfile,
  OpenApiQualityFinding,
  OpenApiProject,
  RequestState,
  SchemaField
} from "@specdock/core";
import {
  analyzeOpenApiQuality,
  generateRequestBodyExample,
  getRequestBodySchemaFields
} from "@specdock/core";
import { buildApiRequest, createRequestState, generateCurl } from "../request.js";
import {
  applyAuthProfileToRequest,
  redactRequestForPreview
} from "./auth-profiles.js";
import { groupOperations } from "./controller-helpers.js";
import { createOperationKey } from "./request-utils.js";
import type {
  ExchangeMap,
  ProjectBaseUrlMap,
  RequestBodyFileMap,
  RequestStateMap,
  ResponseScope
} from "./types.js";

type DerivedStateInput = {
  projects: OpenApiProject[];
  activeProjectId?: string;
  selectedOperationId?: string;
  requestStates: RequestStateMap;
  requestBodyFilesByOperation: RequestBodyFileMap;
  authProfiles: AuthProfile[];
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
  requestBodyFilesByOperation,
  authProfiles,
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
  const defaultRequestState = selectedOperation
    ? createRequestState(selectedOperation, defaultRequestMode)
    : undefined;
  const requestState = storedRequestState
    ? {
        ...defaultRequestState,
        ...storedRequestState,
        body: storedRequestState.body ?? defaultRequestState?.body,
        requestMode: defaultRequestMode
      }
    : undefined;
  const projectAuthProfiles = useMemo(
    () =>
      activeProject
        ? authProfiles.filter((profile) => profile.projectId === activeProject.id)
        : [],
    [activeProject, authProfiles]
  );
  const selectedAuthProfile = useMemo(
    () =>
      projectAuthProfiles.find(
        (profile) => profile.id === requestState?.authProfileId
      ),
    [projectAuthProfiles, requestState?.authProfileId]
  );
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
  const qualityFindings = useMemo<OpenApiQualityFinding[]>(
    () => (activeProject ? analyzeOpenApiQuality(activeProject) : []),
    [activeProject]
  );
  const requestBodyExample = useMemo(
    () => (selectedOperation ? generateRequestBodyExample(selectedOperation) : undefined),
    [selectedOperation]
  );
  const requestBodyFields = useMemo<SchemaField[]>(
    () =>
      selectedOperation
        ? getRequestBodySchemaFields(selectedOperation, activeProject?.spec)
      : [],
    [activeProject?.spec, selectedOperation]
  );
  const requestBodyFiles = operationKey ? (requestBodyFilesByOperation[operationKey] ?? {}) : {};
  const builtRequest = useMemo(() => {
    if (!selectedOperation || !requestState || !selectedBaseUrl.trim()) {
      return undefined;
    }

    try {
      return applyAuthProfileToRequest(
        buildApiRequest(selectedOperation, requestState, selectedBaseUrl, requestBodyFiles),
        selectedAuthProfile,
        { requestMode: requestState.requestMode }
      );
    } catch {
      return undefined;
    }
  }, [requestBodyFiles, requestState, selectedAuthProfile, selectedBaseUrl, selectedOperation]);
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
    projectAuthProfiles,
    selectedAuthProfile,
    selectedBaseUrl,
    selectedFile,
    operationGroups,
    qualityFindings,
    requestBodyExample,
    requestBodyFields,
    requestBodyFiles,
    builtRequest,
    displayedExchange,
    displayedContext,
    curlPreview: builtRequest ? generateCurl(redactRequestForPreview(builtRequest)) : ""
  };
};
