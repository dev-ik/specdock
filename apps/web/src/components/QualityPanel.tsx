import { AlertTriangle, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { OpenApiQualityFinding, OpenApiQualitySeverity } from "@specdock/core";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";

type SeverityFilter = OpenApiQualitySeverity | "all";

const severityLabels: Record<OpenApiQualitySeverity, string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info"
};

export const QualityPanel = ({
  findings,
  hasProject,
  reorder
}: {
  findings: OpenApiQualityFinding[];
  hasProject: boolean;
  reorder: PanelReorderProps;
}) => {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const counts = useMemo(() => countFindings(findings), [findings]);
  const visibleFindings = useMemo(
    () => findings.filter((finding) => filter === "all" || finding.severity === filter),
    [filter, findings]
  );

  return (
    <Panel
      title="Contract quality"
      panelId="quality"
      reorder={reorder}
      action={<span className="meta-text">{findings.length} findings</span>}
    >
      {!hasProject ? (
        <EmptyState>Import a spec to inspect contract quality</EmptyState>
      ) : findings.length === 0 ? (
        <div className="quality-empty">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>No contract quality findings</span>
        </div>
      ) : (
        <div className="quality-panel">
          <div className="quality-summary" aria-label="Quality findings summary">
            <QualityMetric label="Errors" severity="error" value={counts.error} />
            <QualityMetric label="Warnings" severity="warning" value={counts.warning} />
            <QualityMetric label="Info" severity="info" value={counts.info} />
          </div>

          <div className="quality-filters" aria-label="Filter quality findings">
            <QualityFilter label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {(["error", "warning", "info"] as const).map((severity) => (
              <QualityFilter
                key={severity}
                label={severityLabels[severity]}
                active={filter === severity}
                onClick={() => setFilter(severity)}
              />
            ))}
          </div>

          <div className="quality-list">
            {visibleFindings.length === 0 ? (
              <EmptyState>No findings in this filter</EmptyState>
            ) : (
              visibleFindings.map((finding, index) => (
                <QualityFindingRow key={`${finding.location}-${finding.code}-${index}`} finding={finding} />
              ))
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};

const QualityMetric = ({
  label,
  severity,
  value
}: {
  label: string;
  severity: OpenApiQualitySeverity;
  value: number;
}) => (
  <div className={`quality-metric quality-${severity}`}>
    <span className="quality-metric-value">{value}</span>
    <span className="quality-metric-label">{label}</span>
  </div>
);

const QualityFilter = ({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick(): void;
}) => (
  <button className={`quality-filter ${active ? "is-active" : ""}`} type="button" onClick={onClick}>
    {label}
  </button>
);

const QualityFindingRow = ({ finding }: { finding: OpenApiQualityFinding }) => (
  <article className={`quality-finding quality-${finding.severity}`}>
    <div className="quality-finding-icon">{getSeverityIcon(finding.severity)}</div>
    <div className="quality-finding-body">
      <div className="quality-finding-message">{finding.message}</div>
      <div className="quality-finding-meta">
        {finding.method && finding.path ? (
          <>
            <MethodBadge method={finding.method} />
            <span>{finding.path}</span>
          </>
        ) : (
          <span>{finding.location}</span>
        )}
      </div>
    </div>
  </article>
);

const getSeverityIcon = (severity: OpenApiQualitySeverity) => {
  if (severity === "error") return <CircleAlert size={16} aria-hidden="true" />;
  if (severity === "warning") return <AlertTriangle size={16} aria-hidden="true" />;
  return <Info size={16} aria-hidden="true" />;
};

const countFindings = (findings: OpenApiQualityFinding[]) => {
  return findings.reduce(
    (counts, finding) => ({
      ...counts,
      [finding.severity]: counts[finding.severity] + 1
    }),
    { error: 0, warning: 0, info: 0 }
  );
};
