import type { OpenApiProject } from "./types.js";
import {
  diffOpenApiProjects,
  type OpenApiDiffFinding,
  type OpenApiDiffSeverity
} from "./openapi-diff.js";

export type OpenApiDiffCounts = Record<OpenApiDiffSeverity, number> & {
  total: number;
};

export type OpenApiDiffReportSpec = {
  name: string;
  version?: string;
};

export type OpenApiDiffReport = {
  previous: OpenApiDiffReportSpec;
  current: OpenApiDiffReportSpec;
  generatedAt: string;
  counts: OpenApiDiffCounts;
  findings: OpenApiDiffFinding[];
};

export const createOpenApiDiffReport = (
  previous: OpenApiProject,
  current: OpenApiProject,
  generatedAt = new Date().toISOString()
): OpenApiDiffReport => {
  const findings = diffOpenApiProjects(previous, current);

  return {
    previous: reportSpec(previous),
    current: reportSpec(current),
    generatedAt,
    counts: countOpenApiDiffFindings(findings),
    findings
  };
};

export const countOpenApiDiffFindings = (
  findings: OpenApiDiffFinding[]
): OpenApiDiffCounts => ({
  total: findings.length,
  breaking: findings.filter((finding) => finding.severity === "breaking").length,
  "non-breaking": findings.filter((finding) => finding.severity === "non-breaking").length,
  info: findings.filter((finding) => finding.severity === "info").length
});

export const renderOpenApiDiffMarkdown = (
  report: OpenApiDiffReport
): string => {
  const lines = [
    `# Contract diff: ${report.previous.name} -> ${report.current.name}`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    `| Breaking | ${report.counts.breaking} |`,
    `| Non-breaking | ${report.counts["non-breaking"]} |`,
    `| Info | ${report.counts.info} |`,
    `| Total | ${report.counts.total} |`,
    "",
    "## Findings",
    ""
  ];

  if (report.findings.length === 0) {
    return [...lines, "No contract changes detected.", ""].join("\n");
  }

  return [
    ...lines,
    ...report.findings.flatMap((finding) => [
      `- **${severityLabel(finding.severity)}** \`${finding.code}\` ${finding.location}`,
      `  ${finding.message}`
    ]),
    ""
  ].join("\n");
};

export const renderOpenApiDiffJson = (report: OpenApiDiffReport): string =>
  JSON.stringify(report, null, 2);

const reportSpec = (project: OpenApiProject): OpenApiDiffReportSpec => {
  const info =
    project.spec && typeof project.spec === "object" && !Array.isArray(project.spec)
      ? (project.spec as Record<string, unknown>).info
      : undefined;
  const version =
    info && typeof info === "object" && !Array.isArray(info)
      ? (info as Record<string, unknown>).version
      : undefined;

  return {
    name: project.name,
    version: typeof version === "string" ? version : undefined
  };
};

const severityLabel = (severity: OpenApiDiffSeverity): string => {
  if (severity === "breaking") return "Breaking";
  if (severity === "non-breaking") return "Non-breaking";
  return "Info";
};
