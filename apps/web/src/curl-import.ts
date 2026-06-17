import type { RequestState } from "@specdock/core";
import { parseCurlCommand } from "./curl-import-parser.js";
import { createCurlImportSpec, createOperationId } from "./curl-import-spec.js";
import { CurlImportError, type CurlImportResult } from "./curl-import-types.js";

export { CurlImportError };

export const importCurlCommand = (
  command: string,
  requestMode: RequestState["requestMode"] = "direct"
): CurlImportResult => {
  const parsed = parseCurlCommand(command);
  const baseUrl = parsed.url.origin;
  const path = parsed.url.pathname || "/";
  const operationId = createOperationId(parsed.method, path);
  const queryParams = Object.fromEntries(parsed.url.searchParams.entries());
  const spec = createCurlImportSpec(parsed, operationId, baseUrl, path);

  return {
    specText: JSON.stringify(spec, null, 2),
    baseUrl,
    operationId,
    requestState: {
      operationId,
      pathParams: {},
      queryParams,
      headers: parsed.headers,
      body: parsed.body,
      requestMode
    }
  };
};
