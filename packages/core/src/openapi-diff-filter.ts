import type { ApiOperation } from "./types.js";
import type {
  OpenApiDiffFinding,
  OpenApiDiffSeverity
} from "./openapi-diff.js";

export type OpenApiDiffFilter = {
  severity?: OpenApiDiffSeverity | "all";
  method?: ApiOperation["method"] | "all";
  path?: string;
  tag?: string;
};

export const filterOpenApiDiffFindings = (
  findings: OpenApiDiffFinding[],
  filter: OpenApiDiffFilter
): OpenApiDiffFinding[] =>
  findings.filter((finding) => {
    if (
      filter.severity &&
      filter.severity !== "all" &&
      finding.severity !== filter.severity
    ) {
      return false;
    }

    if (
      filter.method &&
      filter.method !== "all" &&
      finding.method !== filter.method
    ) {
      return false;
    }

    if (filter.path && !finding.path?.includes(filter.path)) {
      return false;
    }

    if (filter.tag && !(finding.tags ?? []).includes(filter.tag)) {
      return false;
    }

    return true;
  });
