import { FileDown, GitCompareArrows } from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterOpenApiDiffFindings,
  type OpenApiDiffReport,
  type OpenApiDiffSeverity,
  type OpenApiProject
} from "@specdock/core";
import { projectSpecText } from "../app/contract-diff.js";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";

const SEVERITIES: (OpenApiDiffSeverity | "all")[] = ["all", "breaking", "non-breaking", "info"];
const METHODS = ["all", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export const ContractDiffPanel = ({
  projects,
  activeProject,
  report,
  reorder,
  onCompare,
  onExport
}: {
  projects: OpenApiProject[];
  activeProject?: OpenApiProject;
  report?: OpenApiDiffReport;
  reorder?: PanelReorderProps;
  onCompare(previousText: string, currentText: string): void;
  onExport(format: "markdown" | "json"): void;
}) => {
  const [previousText, setPreviousText] = useState("");
  const [currentText, setCurrentText] = useState(() =>
    activeProject ? projectSpecText(activeProject.spec) : ""
  );
  const [severity, setSeverity] = useState<OpenApiDiffSeverity | "all">("all");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("all");
  const [path, setPath] = useState("");
  const [tag, setTag] = useState("");
  const tags = useMemo(
    () => Array.from(new Set(report?.findings.flatMap((finding) => finding.tags ?? []) ?? [])),
    [report]
  );
  const visibleFindings = useMemo(
    () =>
      filterOpenApiDiffFindings(report?.findings ?? [], {
        severity,
        method,
        path: path.trim(),
        tag
      }),
    [method, path, report, severity, tag]
  );

  return (
    <Panel
      title="Contract diff"
      panelId="contract-diff"
      reorder={reorder}
      action={<span className="meta-text">{report?.counts.total ?? 0} changes</span>}
    >
      <div className="quality-panel">
        <div className="diff-input-grid">
          <DiffSlot
            label="Old spec"
            projects={projects}
            value={previousText}
            onChange={setPreviousText}
          />
          <DiffSlot
            label="New spec"
            projects={projects}
            value={currentText}
            onChange={setCurrentText}
          />
        </div>
        <div className="diff-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => onCompare(previousText, currentText)}
          >
            <GitCompareArrows size={16} aria-hidden="true" />
            <span>Compare</span>
          </button>
          <button className="button button-ghost" type="button" onClick={() => onExport("markdown")}>
            <FileDown size={16} aria-hidden="true" />
            <span>Markdown</span>
          </button>
          <button className="button button-ghost" type="button" onClick={() => onExport("json")}>
            <FileDown size={16} aria-hidden="true" />
            <span>JSON</span>
          </button>
        </div>
        {!report ? (
          <EmptyState>Choose old and new specs to compare contract changes</EmptyState>
        ) : (
          <>
            <div className="quality-context">
              Compared {report.previous.name} to {report.current.name}
            </div>
            <div className="quality-filters">
              <select value={severity} onChange={(event) => setSeverity(event.target.value as OpenApiDiffSeverity | "all")}>
                {SEVERITIES.map((value) => <option key={value}>{value}</option>)}
              </select>
              <select value={method} onChange={(event) => setMethod(event.target.value as (typeof METHODS)[number])}>
                {METHODS.map((value) => <option key={value}>{value}</option>)}
              </select>
              <input value={path} placeholder="Filter path" onChange={(event) => setPath(event.target.value)} />
              <select value={tag} onChange={(event) => setTag(event.target.value)}>
                <option value="">all tags</option>
                {tags.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <DiffFindings findings={visibleFindings} />
          </>
        )}
      </div>
    </Panel>
  );
};

const DiffSlot = ({
  label,
  projects,
  value,
  onChange
}: {
  label: string;
  projects: OpenApiProject[];
  value: string;
  onChange(value: string): void;
}) => (
  <label className="diff-slot">
    <span>{label}</span>
    <select
      defaultValue=""
      onChange={(event) => {
        const project = projects.find((candidate) => candidate.id === event.target.value);
        if (project) onChange(projectSpecText(project.spec));
      }}
    >
      <option value="">Raw text or file</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
    <input
      type="file"
      accept=".json,.yaml,.yml"
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        void file.text().then(onChange);
      }}
    />
    <textarea value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const DiffFindings = ({ findings }: { findings: OpenApiDiffReport["findings"] }) => (
  findings.length === 0 ? (
    <EmptyState>No contract changes match these filters</EmptyState>
  ) : (
    <div className="quality-list">
      {findings.map((finding, index) => (
        <article key={`${finding.code}-${finding.location}-${index}`} className={`quality-item diff-${finding.severity}`}>
          <div className="quality-item-topline">
            <span className={`quality-severity ${finding.severity}`}>{severityLabel(finding.severity)}</span>
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
  )
);

const severityLabel = (value: OpenApiDiffSeverity): string => {
  if (value === "breaking") return "Breaking";
  if (value === "non-breaking") return "Safe";
  return "Info";
};
