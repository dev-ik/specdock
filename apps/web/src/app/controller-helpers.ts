import type { ApiOperation, GenerateOptions } from "@specdock/core";
import { responseViewerMessageForError, type ResponseViewModel } from "../request.js";
import type { ApiErrorResponse, GenerateApiResponse, OperationGroup } from "./types.js";

export const groupOperations = (
  operations: ApiOperation[],
  searchQuery: string
): OperationGroup[] => {
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? operations.filter((operation) =>
        [
          operation.method,
          operation.path,
          operation.operationId ?? "",
          operation.summary ?? "",
          operation.tags.join(" ")
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : operations;
  const groups = new Map<string, ApiOperation[]>();

  for (const operation of filtered) {
    const tags = operation.tags.length > 0 ? operation.tags : ["Untagged"];
    for (const tag of tags) {
      groups.set(tag, [...(groups.get(tag) ?? []), operation]);
    }
  }

  return [...groups.entries()];
};

export const generateSdkFiles = async (
  spec: string,
  options: GenerateOptions
): Promise<GenerateApiResponse> => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spec, options })
  });
  const payload = (await response.json()) as GenerateApiResponse | ApiErrorResponse;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error.message : "Generation failed.");
  }

  return payload;
};

export const downloadSdkZip = async (spec: string, options: GenerateOptions) => {
  const response = await fetch("/api/generate/zip", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spec, options })
  });

  if (!response.ok) {
    const payload = (await response.json()) as ApiErrorResponse;
    throw new Error(payload.error.message);
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "specdock-generated.zip";
  link.click();
  URL.revokeObjectURL(url);
};

export const createFailedResponse = (error: unknown): ResponseViewModel => ({
  status: 0,
  statusText: "Request failed",
  headers: {},
  body: responseViewerMessageForError(error),
  durationMs: 0,
  bodyFormat: "raw"
});
