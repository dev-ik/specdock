import { useEffect, useMemo, useState } from "react";
import {
  type AuthProfile,
  defaultGenerateOptions,
  type GeneratedFile,
  type GenerateOptions,
  type OpenApiProject,
  type OpenApiSource,
  type RequestState
} from "@specdock/core";
import { createRequestState } from "../request.js";
import { createWorkspaceStorage } from "../workspace.js";
import {
  readLocalJson,
  readLocalString,
  removeLocalValue,
  writeLocalJson,
  writeLocalString
} from "./local-storage.js";
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
import type { GeneratedFilesDiff } from "./sdk-diff.js";
import { useSpecDockDerivedState } from "./useSpecDockDerivedState.js";
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
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    storageAdapter.getSettings().theme === "light" ? "light" : "dark"
  );
  const [specText, setSpecText] = useState(sampleSpec);
  const [projects, setProjects] = useState<OpenApiProject[]>(() =>
    storageAdapter.getProjects()
  );
  const [previousProjectForDiff, setPreviousProjectForDiff] =
    useState<OpenApiProject>();
  const [historyCount, setHistoryCount] = useState(
    () => storageAdapter.getHistory().length
  );
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    () => storageAdapter.getActiveProjectId()
  );
  const [currentSource, setCurrentSource] = useState<OpenApiSource>({
    type: "raw"
  });
  const [urlInput, setUrlInput] = useState("");
  const [curlInput, setCurlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState<
    string | undefined
  >();
  const [requestStates, setRequestStates] = useState<RequestStateMap>(() =>
    hydrateStoredRequestStates(readLocalJson(requestStatesStorageKey, {}))
  );
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
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [generateMeta, setGenerateMeta] = useState<GenerateMeta | undefined>();
  const [exchangesByOperation, setExchangesByOperation] = useState<ExchangeMap>(
    {}
  );
  const [latestExchangeKey, setLatestExchangeKey] = useState<
    string | undefined
  >();
  const [responseScope, setResponseScope] = useState<ResponseScope>(() =>
    readLocalString(responseScopeStorageKey) === "latest"
      ? "latest"
      : "operation"
  );
  const [status, setStatus] = useState("Ready");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>(
    () => ({
      ...defaultGenerateOptions,
      client: storageAdapter.getSettings().defaultClient,
      ...readLocalJson<Partial<GenerateOptions>>(generateOptionsStorageKey, {})
    })
  );

  const derived = useSpecDockDerivedState({
    projects,
    previousProjectForDiff,
    activeProjectId,
    selectedOperationId,
    requestStates,
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

    setBaseUrlsByProject((current) => ({
      ...current,
      [activeProject.id]:
        current[activeProject.id] ??
        activeProject.servers[0]?.url ??
        "https://api.example.com"
    }));
    setSelectedOperationId((current) =>
      current &&
      activeProject.operations.some((operation) => operation.id === current)
        ? current
        : activeProject.operations[0]?.id
    );
  }, [derived.activeProject]);
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
    previousProjectForDiff,
    setPreviousProjectForDiff,
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
    authProfiles,
    setAuthProfiles,
    defaultRequestMode,
    setDefaultRequestMode,
    setBaseUrlsByProject,
    files,
    setFiles,
    generatedDiff,
    setGeneratedDiff,
    selectedPath,
    setSelectedPath,
    generateMeta,
    setGenerateMeta,
    setExchangesByOperation,
    setLatestExchangeKey,
    latestExchangeKey,
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
    ...derived
  };
};
