import type {
  ApiOperation,
  GeneratedFile,
  GenerateOptions,
  OpenApiProject,
  RequestState
} from "@specdock/core";
import type { ApiRequest, ResponseViewModel } from "../request.js";

export type GenerateApiResponse = {
  files: GeneratedFile[];
  meta: {
    fileCount: number;
    generatedAt: string;
    generatorVersion: string;
  };
};

export type GenerateMeta = GenerateApiResponse["meta"];

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type RequestStateMap = Record<string, RequestState>;
export type ProjectBaseUrlMap = Record<string, string>;
export type ResponseScope = "operation" | "latest";
export type ThemeMode = "dark" | "light";
export type ExchangeMap = Record<string, StoredExchange>;
export type OperationGroup = [string, ApiOperation[]];

export type StoredExchange = {
  projectId: string;
  operationId: string;
  request: ApiRequest;
  response: ResponseViewModel;
  createdAt: string;
};

export type ExchangeContext = {
  projectName: string;
  operationLabel: string;
};

export type GenerateState = {
  files: GeneratedFile[];
  meta?: GenerateMeta;
  options: GenerateOptions;
  selectedFile?: GeneratedFile;
};

export type ActiveSelection = {
  project?: OpenApiProject;
  operation?: ApiOperation;
  operationKey?: string;
  requestState?: RequestState;
  baseUrl: string;
};
