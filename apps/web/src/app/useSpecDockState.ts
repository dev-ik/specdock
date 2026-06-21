import { useEffect, useMemo, useState } from "react";
import type { AuthProfile, GeneratedFile, GenerateOptions, OpenApiDiffReport, OpenApiProject, OpenApiSource, RequestState } from "@specdock/core";
import { createRequestState } from "../request.js";
import { createWorkspaceStorage } from "../workspace.js";
import { readLocalJson, readLocalString, removeLocalValue, writeLocalJson, writeLocalString } from "./local-storage.js";
import { sampleSpec } from "./sample-spec.js";
import {
  baseUrlsStorageKey,
  exchangesStorageKey,
  generateOptionsStorageKey,
  latestExchangeKeyStorageKey,
  requestStatesStorageKey,
  responseScopeStorageKey
} from "./storage-keys.js";
import {
  hydrateStoredRequestStates,
  sanitizeRequestStatesForStorage
} from "./request-state-storage.js";
import type { GeneratedFilesDiff, GeneratedFilesTarget } from "./sdk-diff.js";
import { applyProjectBaseUrl } from "./base-url.js";
import { hydrateGenerateOptions } from "./generate-options.js";
import { useMockRouteHydration } from "./mock-route-hydration.js";
import { useAppConfig } from "./useAppConfig.js";
import { useSpecDockDerivedState } from "./useSpecDockDerivedState.js";
import type {
  ExchangeMap,
  GenerateMeta,
  MockServerState,
  ProjectBaseUrlMap,
  RequestBodyFileMap,
  RequestStateMap,
  ResponseScope,
  ThemeMode
} from "./types.js";

export const useSpecDockState = () => {
  const storageAdapter = useMemo(() => createWorkspaceStorage(), []);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    storageAdapter.getSettings().theme === "light" ? "light" : "dark"
  );
  const [specText, setSpecText] = useState(sampleSpec);
  const [projects, setProjects] = useState<OpenApiProject[]>(() =>
    storageAdapter.getProjects()
  );
  const [historyCount, setHistoryCount] = useState(() => storageAdapter.getHistory().length);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    () => storageAdapter.getActiveProjectId()
  );
  const [currentSource, setCurrentSource] = useState<OpenApiSource>({ type: "raw" });
  const [urlInput, setUrlInput] = useState("");
  const [curlInput, setCurlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState<string>();
  const [requestStates, setRequestStates] = useState<RequestStateMap>(() =>
    hydrateStoredRequestStates(readLocalJson(requestStatesStorageKey, {}))
  );
  const [requestBodyFilesByOperation, setRequestBodyFilesByOperation] = useState<RequestBodyFileMap>({});
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>(() =>
    storageAdapter.getAuthProfiles()
  );
  const [defaultRequestMode, setDefaultRequestMode] = useState<
    RequestState["requestMode"]
  >(() => storageAdapter.getSettings().defaultRequestMode);
  const [baseUrlsByProject, setBaseUrlsByProject] = useState<ProjectBaseUrlMap>(
    () => readLocalJson(baseUrlsStorageKey, {})
  );
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [generatedDiff, setGeneratedDiff] = useState<GeneratedFilesDiff>();
  const [contractDiffReport, setContractDiffReport] = useState<OpenApiDiffReport>();
  const [generatedFilesTarget, setGeneratedFilesTarget] = useState<GeneratedFilesTarget>();
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [generateMeta, setGenerateMeta] = useState<GenerateMeta | undefined>();
  const [exchangesByOperation, setExchangesByOperation] = useState<ExchangeMap>({});
  const [latestExchangeKey, setLatestExchangeKey] = useState<string | undefined>();
  const [responseScope, setResponseScope] = useState<ResponseScope>(() =>
    readLocalString(responseScopeStorageKey) === "latest" ? "latest" : "operation"
  );
  const [mockServerState, setMockServerState] = useState<MockServerState>({});
  const appConfig = useAppConfig();
  const [status, setStatus] = useState(() =>
    storageAdapter.getDiagnostics().some((diagnostic) => diagnostic.code !== "missing-key")
      ? "Recovered local workspace storage. Some invalid saved data was reset."
      : "Ready"
  );
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>(() =>
    hydrateGenerateOptions(
      storageAdapter.getSettings().defaultClient,
      readLocalJson<Partial<GenerateOptions>>(generateOptionsStorageKey, {})
    )
  );

  const derived = useSpecDockDerivedState({
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
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    storageAdapter.saveSettings({
      ...storageAdapter.getSettings(),
      theme: themeMode
    });
  }, [storageAdapter, themeMode]);
  useEffect(() => {
    const activeProject = derived.activeProject;

    if (!activeProject) return;

    setBaseUrlsByProject((current) => applyProjectBaseUrl(current, activeProject, "preserve"));
    setSelectedOperationId((current) =>
      current &&
      activeProject.operations.some((operation) => operation.id === current)
        ? current
        : activeProject.operations[0]?.id
    );
  }, [derived.activeProject]);
  useMockRouteHydration({
    activeProject: derived.activeProject,
    appConfig,
    mockServerState,
    setMockServerState
  });
  useEffect(() => {
    const selectedOperation = derived.selectedOperation;
    const operationKey = derived.operationKey;

    if (!selectedOperation || !operationKey) return;

    setRequestStates((current) => ({
      ...current,
      [operationKey]:
        current[operationKey] ??
        createRequestState(selectedOperation, defaultRequestMode)
    }));
  }, [derived.selectedOperation, derived.operationKey, defaultRequestMode]);
  useEffect(
    () =>
      writeLocalJson(
        requestStatesStorageKey,
        sanitizeRequestStatesForStorage(requestStates)
      ),
    [requestStates]
  );
  useEffect(
    () => writeLocalJson(baseUrlsStorageKey, baseUrlsByProject),
    [baseUrlsByProject]
  );
  useEffect(() => {
    removeLocalValue(exchangesStorageKey);
    removeLocalValue(latestExchangeKeyStorageKey);
  }, []);
  useEffect(
    () => writeLocalString(responseScopeStorageKey, responseScope),
    [responseScope]
  );
  useEffect(() => {
    writeLocalJson(generateOptionsStorageKey, generateOptions);
    storageAdapter.saveSettings({
      ...storageAdapter.getSettings(),
      defaultClient: generateOptions.client
    });
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
    curlInput,
    setCurlInput,
    searchQuery,
    setSearchQuery,
    setSelectedOperationId,
    requestStates,
    setRequestStates,
    requestBodyFilesByOperation,
    setRequestBodyFilesByOperation,
    authProfiles,
    setAuthProfiles,
    defaultRequestMode,
    setDefaultRequestMode,
    baseUrlsByProject,
    setBaseUrlsByProject,
    files,
    setFiles,
    generatedDiff,
    setGeneratedDiff,
    contractDiffReport,
    setContractDiffReport,
    generatedFilesTarget,
    setGeneratedFilesTarget,
    selectedPath,
    setSelectedPath,
    generateMeta,
    setGenerateMeta,
    setExchangesByOperation,
    setLatestExchangeKey,
    latestExchangeKey,
    responseScope,
    setResponseScope,
    mockServerState,
    setMockServerState,
    appConfig,
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
    ...derived
  };
};
