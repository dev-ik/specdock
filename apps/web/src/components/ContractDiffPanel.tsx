import { useMemo, useState } from "react";
import type { OpenApiDiffFinding, OpenApiDiffSeverity } from "@specdock/core";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";

const SEVERITIES: OpenApiDiffSeverity[] = ["breaking", "non-breaking", "info"];

export const ContractDiffPanel = ({
  findings,
  hasComparison,
  comparisonName,
  reorder
}: {
  findings: OpenApiDiffFinding[];
  hasComparison: boolean;
  comparisonName?: string;
  reorder?: PanelReorderProps;
}) => {
  const [activeSeverity, setActiveSeverity] = useState<OpenApiDiffSeverity | "all">("all");
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SEVERITIES.map((severity) => [
          severity,
          findings.filter((finding) => finding.severity === severity).length
        ])
      ) as Record<OpenApiDiffSeverity, number>,
    [findings]
  );
  const visibleFindings =
    activeSeverity === "all"
      ? findings
      : findings.filter((finding) => finding.severity === activeSeverity);

  return (
    <Panel
      title="Contract diff"
      panelId="contract-diff"
      reorder={reorder}
      action={<span className="meta-text">{findings.length} changes</span>}
    >
      {!hasComparison ? (
        <EmptyState>Import another version to compare contract changes</EmptyState>
      ) : findings.length === 0 ? (
        <EmptyState>No contract changes against {comparisonName}</EmptyState>
      ) : (
        <div className="quality-panel">
          <div className="quality-context">Compared against {comparisonName}</div>
          <div className="quality-filters">
            <button
              className={`quality-filter ${activeSeverity === "all" ? "is-active" : ""}`}
              type="button"
              onClick={() => setActiveSeverity("all")}
            >
              All
              <span>{findings.length}</span>
            </button>
            {SEVERITIES.map((severity) => (
              <button
                key={severity}
                className={`quality-filter ${activeSeverity === severity ? "is-active" : ""}`}
                type="button"
                onClick={() => setActiveSeverity(severity)}
              >
                {severityLabel(severity)}
                <span>{counts[severity]}</span>
              </button>
            ))}
          </div>
          <div className="quality-list">
            {visibleFindings.map((finding, index) => (
              <article
                key={`${finding.code}-${finding.location}-${index}`}
                className={`quality-item diff-${finding.severity}`}
              >
                <div className="quality-item-topline">
                  <span className={`quality-severity ${finding.severity}`}>
                    {severityLabel(finding.severity)}
                  </span>
                  <span className="quality-code">{finding.code}</span>
                </div>
                <div className="quality-message">{finding.message}</div>
                <div className="quality-location">
                  {finding.method ? <MethodBadge method={finding.method} /> : null}
                  <span>{finding.location}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

const severityLabel = (severity: OpenApiDiffSeverity): string => {
  if (severity === "breaking") return "Breaking";
  if (severity === "non-breaking") return "Safe";
  return "Info";
};
