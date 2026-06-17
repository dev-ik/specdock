import { useEffect, useMemo, useState } from "react";
import {
  defaultGenerateOptions,
  type GeneratedFile,
  type GenerateOptions,
  type OpenApiProject,
  type OpenApiSource
} from "@specdock/core";
import { buildApiRequest, createRequestState, generateCurl } from "../request.js";
import { createWorkspaceStorage } from "../workspace.js";
import { groupOperations } from "./controller-helpers.js";
import { readLocalJson, readLocalString, writeLocalJson, writeLocalString } from "./local-storage.js";
import { createOperationKey } from "./request-utils.js";
import { sampleSpec } from "./sample-spec.js";
import {
  baseUrlsStorageKey,
  exchangesStorageKey,
  generateOptionsStorageKey,
  latestExchangeKeyStorageKey,
  requestStatesStorageKey,
  responseScopeStorageKey
} from "./storage-keys.js";
import type {
  ExchangeMap,
  GenerateMeta,
  ProjectBaseUrlMap,
  RequestStateMap,
  ResponseScope,
  ThemeMode
} from "./types.js";

export const useSpecDockState = () => {
  const storageAdapter = useMemo(() => createWorkspaceStorage(), []);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => storageAdapter.getSettings().theme === "light" ? "light" : "dark");
  const [specText, setSpecText] = useState(sampleSpec);
  const [projects, setProjects] = useState<OpenApiProject[]>(() => storageAdapter.getProjects());
  const [historyCount, setHistoryCount] = useState(() => storageAdapter.getHistory().length);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(() => storageAdapter.getActiveProjectId());
  const [currentSource, setCurrentSource] = useState<OpenApiSource>({ type: "raw" });
  const [urlInput, setUrlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState<string | undefined>();
  const [requestStates, setRequestStates] = useState<RequestStateMap>(() => readLocalJson(requestStatesStorageKey, {}));
  const [baseUrlsByProject, setBaseUrlsByProject] = useState<ProjectBaseUrlMap>(() => readLocalJson(baseUrlsStorageKey, {}));
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [generateMeta, setGenerateMeta] = useState<GenerateMeta | undefined>();
  const [exchangesByOperation, setExchangesByOperation] = useState<ExchangeMap>(() => readLocalJson(exchangesStorageKey, {}));
  const [latestExchangeKey, setLatestExchangeKey] = useState<string | undefined>(() => readLocalString(latestExchangeKeyStorageKey));
  const [responseScope, setResponseScope] = useState<ResponseScope>(() => readLocalString(responseScopeStorageKey) === "latest" ? "latest" : "operation");
  const [status, setStatus] = useState("Ready");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>(() => ({
    ...defaultGenerateOptions,
    client: storageAdapter.getSettings().defaultClient,
    ...readLocalJson<Partial<GenerateOptions>>(generateOptionsStorageKey, {})
  }));

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId), [activeProjectId, projects]);
  const selectedOperation = useMemo(() => activeProject?.operations.find((operation) => operation.id === selectedOperationId), [activeProject, selectedOperationId]);
  const operationKey = activeProject && selectedOperation ? createOperationKey(activeProject.id, selectedOperation.id) : undefined;
  const requestState = operationKey ? requestStates[operationKey] : undefined;
  const selectedBaseUrl = activeProject ? (baseUrlsByProject[activeProject.id] ?? activeProject.servers[0]?.url ?? "") : "";
  const selectedFile = useMemo(() => files.find((file) => file.path === selectedPath) ?? files[0], [files, selectedPath]);
  const operationGroups = useMemo(() => groupOperations(activeProject?.operations ?? [], searchQuery), [activeProject, searchQuery]);
  const builtRequest = useMemo(() => {
    if (!selectedOperation || !requestState || !selectedBaseUrl.trim()) return undefined;
    try {
      return buildApiRequest(selectedOperation, requestState, selectedBaseUrl);
    } catch {
      return undefined;
    }
  }, [requestState, selectedBaseUrl, selectedOperation]);
  const displayedExchange = responseScope === "latest"
    ? exchangesByOperation[latestExchangeKey ?? ""]
    : exchangesByOperation[operationKey ?? ""];
  const displayedContext = useMemo(() => {
    if (!displayedExchange) return undefined;
    const project = projects.find((candidate) => candidate.id === displayedExchange.projectId);
    const operation = project?.operations.find((candidate) => candidate.id === displayedExchange.operationId);
    return {
      projectName: project?.name ?? "Unknown project",
      operationLabel: operation ? `${operation.method} ${operation.path}` : displayedExchange.operationId
    };
  }, [displayedExchange, projects]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    storageAdapter.saveSettings({ ...storageAdapter.getSettings(), theme: themeMode });
  }, [storageAdapter, themeMode]);
  useEffect(() => {
    if (!activeProject) return;
    setBaseUrlsByProject((current) => ({ ...current, [activeProject.id]: current[activeProject.id] ?? activeProject.servers[0]?.url ?? "https://api.example.com" }));
    setSelectedOperationId((current) => current && activeProject.operations.some((operation) => operation.id === current) ? current : activeProject.operations[0]?.id);
  }, [activeProject]);
  useEffect(() => {
    if (!selectedOperation || !operationKey) return;
    setRequestStates((current) => ({ ...current, [operationKey]: current[operationKey] ?? createRequestState(selectedOperation) }));
  }, [selectedOperation, operationKey]);
  useEffect(() => writeLocalJson(requestStatesStorageKey, requestStates), [requestStates]);
  useEffect(() => writeLocalJson(baseUrlsStorageKey, baseUrlsByProject), [baseUrlsByProject]);
  useEffect(() => writeLocalJson(exchangesStorageKey, exchangesByOperation), [exchangesByOperation]);
  useEffect(() => writeLocalString(latestExchangeKeyStorageKey, latestExchangeKey), [latestExchangeKey]);
  useEffect(() => writeLocalString(responseScopeStorageKey, responseScope), [responseScope]);
  useEffect(() => {
    writeLocalJson(generateOptionsStorageKey, generateOptions);
    storageAdapter.saveSettings({ ...storageAdapter.getSettings(), defaultClient: generateOptions.client });
  }, [generateOptions, storageAdapter]);

  return {
    storageAdapter,
    themeMode,
    setThemeMode,
    specText,
    setSpecText,
    projects,
    setProjects,
    historyCount,
    setHistoryCount,
    activeProjectId,
    setActiveProjectId,
    currentSource,
    setCurrentSource,
    urlInput,
    setUrlInput,
    searchQuery,
    setSearchQuery,
    setSelectedOperationId,
    requestStates,
    setRequestStates,
    setBaseUrlsByProject,
    files,
    setFiles,
    setSelectedPath,
    generateMeta,
    setGenerateMeta,
    setExchangesByOperation,
    setLatestExchangeKey,
    responseScope,
    setResponseScope,
    status,
    setStatus,
    isImportingUrl,
    setIsImportingUrl,
    isGenerating,
    setIsGenerating,
    isDownloadingZip,
    setIsDownloadingZip,
    isExecuting,
    setIsExecuting,
    generateOptions,
    setGenerateOptions,
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
