import type { GeneratedFile } from "@specdock/core";
import { useState } from "react";
import type { GeneratedFilesDiff, GeneratedFileDiffEntry } from "../app/sdk-diff.js";
import { diffTextLines } from "../app/text-diff.js";
import { EmptyState, FileIcon, Panel, type PanelReorderProps } from "./common.js";

export const GeneratedFilesPanel = ({
  files,
  selectedFile,
  selectedPath,
  diff,
  onSelectPath,
  reorder
}: {
  files: GeneratedFile[];
  selectedFile?: GeneratedFile;
  selectedPath?: string;
  diff?: GeneratedFilesDiff;
  onSelectPath(path: string): void;
  reorder?: PanelReorderProps;
}) => {
  const [viewMode, setViewMode] = useState<"diff" | "code">("diff");
  const selectedRemovedEntry =
    selectedPath && !selectedFile
      ? diff?.entries.find((entry) => entry.path === selectedPath && entry.status === "removed")
      : undefined;
  const rows = diff?.entries ?? files.map(fileToDiffEntry);
  const selectedEntry = selectedPath
    ? rows.find((entry) => entry.path === selectedPath)
    : undefined;
  const code =
    selectedFile?.content ??
    selectedRemovedEntry?.previousContent ??
    "Generated SDK files will appear here.";

  return (
    <Panel
      title="Generated files"
      panelId="generated-files"
      reorder={reorder}
      action={<span className="meta-text">{files.length} files</span>}
    >
      {diff ? (
        <div className="generated-diff-toolbar">
          <DiffSummary diff={diff} />
          <div className="segmented-control generated-view-toggle" aria-label="Generated file view">
            <button
              className={viewMode === "diff" ? "is-active" : ""}
              type="button"
              onClick={() => setViewMode("diff")}
            >
              Diff
            </button>
            <button
              className={viewMode === "code" ? "is-active" : ""}
              type="button"
              onClick={() => setViewMode("code")}
            >
              Code
            </button>
          </div>
        </div>
      ) : null}
      <div className="generated-grid">
        <div className="generated-list">
          {rows.length === 0 ? (
            <EmptyState>No SDK files generated yet</EmptyState>
          ) : (
            rows.map((entry) => (
              <button
                key={entry.path}
                className={`file-item file-item-${entry.status} ${
                  selectedPath === entry.path || selectedFile?.path === entry.path ? "is-active" : ""
                }`}
                type="button"
                onClick={() => onSelectPath(entry.path)}
              >
                <FileIcon />
                <span className="truncate">{entry.path}</span>
                <span className={`file-diff-badge file-diff-${entry.status}`}>{entry.status}</span>
              </button>
            ))
          )}
        </div>
        <GeneratedFilePreview entry={selectedEntry} fallbackCode={code} viewMode={viewMode} />
      </div>
    </Panel>
  );
};

const DiffSummary = ({ diff }: { diff: GeneratedFilesDiff }) => (
  <div className="generated-diff-summary" aria-label="Generated SDK diff summary">
    <DiffMetric label="Added" value={diff.summary.added} status="added" />
    <DiffMetric label="Changed" value={diff.summary.changed} status="changed" />
    <DiffMetric label="Removed" value={diff.summary.removed} status="removed" />
    <DiffMetric label="Same" value={diff.summary.unchanged} status="unchanged" />
  </div>
);

const DiffMetric = ({
  label,
  value,
  status
}: {
  label: string;
  value: number;
  status: GeneratedFileDiffEntry["status"];
}) => (
  <span className={`generated-diff-metric file-diff-${status}`}>
    {value} {label}
  </span>
);

const fileToDiffEntry = (file: GeneratedFile): GeneratedFileDiffEntry => ({
  path: file.path,
  status: "unchanged",
  currentContent: file.content
});

const GeneratedFilePreview = ({
  entry,
  fallbackCode,
  viewMode
}: {
  entry?: GeneratedFileDiffEntry;
  fallbackCode: string;
  viewMode: "diff" | "code";
}) => {
  if (!entry || entry.status === "unchanged" || viewMode === "code") {
    return (
      <pre className="code-block generated-code">
        <code>{fallbackCode}</code>
      </pre>
    );
  }

  return (
    <div className="code-block generated-code generated-diff-code" aria-label="Generated file changes">
      {diffTextLines(entry.previousContent, entry.currentContent).map((line, index) => (
        <div key={`${line.kind}-${index}`} className={`generated-diff-line generated-diff-line-${line.kind}`}>
          <span className="generated-diff-prefix">{prefixForLineKind(line.kind)}</span>
          <code>{line.value || " "}</code>
        </div>
      ))}
    </div>
  );
};

const prefixForLineKind = (kind: ReturnType<typeof diffTextLines>[number]["kind"]): string => {
  if (kind === "added") return "+";
  if (kind === "removed") return "-";
  return " ";
};
