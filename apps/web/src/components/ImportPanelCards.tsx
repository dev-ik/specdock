import { Link, Terminal, Trash2, Upload, Wand2 } from "lucide-react";
import type React from "react";
import type { OpenApiProject } from "@specdock/core";
import type { PanelId } from "../app/usePanelLayout.js";
import { EmptyState, Panel, type PanelReorderProps } from "./common.js";

export type ImportPanelCardsProps = {
  projects: OpenApiProject[];
  activeProjectId?: string;
  specText: string;
  urlInput: string;
  curlInput: string;
  isImportingUrl: boolean;
  onOpenProject(project: OpenApiProject): void;
  onDeleteProject(project: OpenApiProject): void;
  onSpecTextChange(value: string): void;
  onUrlInputChange(value: string): void;
  onCurlInputChange(value: string): void;
  onUrlImport(): void;
  onCurlImport(): void;
  onRawImport(): void;
  onUpload(event: React.ChangeEvent<HTMLInputElement>): void;
  getPanelReorderProps(panelId: PanelId): PanelReorderProps;
};

export const renderImportPanelCard = (
  panelId: PanelId,
  props: ImportPanelCardsProps
): React.ReactNode | undefined => {
  if (panelId === "local-projects") return <LocalProjectsPanel key={panelId} {...props} />;
  if (panelId === "import") return <ImportSpecPanel key={panelId} {...props} />;

  return undefined;
};

const LocalProjectsPanel = ({
  projects,
  activeProjectId,
  onOpenProject,
  onDeleteProject,
  getPanelReorderProps
}: ImportPanelCardsProps) => (
  <Panel
    title="Local projects"
    panelId="local-projects"
    reorder={getPanelReorderProps("local-projects")}
    action={<span className="meta-text">{projects.length}/10</span>}
  >
    <div className="project-list">
      {projects.length === 0 ? (
        <EmptyState>No saved projects</EmptyState>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className={`project-row ${activeProjectId === project.id ? "is-active" : ""}`}
          >
            <button className="project-item" type="button" onClick={() => onOpenProject(project)}>
              <span className="project-name">{project.name}</span>
              <span className="project-meta">
                {project.operations.length} operations - {project.schemas.length} schemas
              </span>
            </button>
            {activeProjectId === project.id ? <span className="project-active-badge">Active</span> : null}
            <button
              className="project-delete-button"
              type="button"
              aria-label={`Delete ${project.name}`}
              title={`Delete ${project.name}`}
              onClick={() => onDeleteProject(project)}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))
      )}
    </div>
  </Panel>
);

const ImportSpecPanel = ({
  specText,
  urlInput,
  curlInput,
  isImportingUrl,
  onSpecTextChange,
  onUrlInputChange,
  onCurlInputChange,
  onUrlImport,
  onCurlImport,
  onRawImport,
  onUpload,
  getPanelReorderProps
}: ImportPanelCardsProps) => (
  <Panel
    title="Import"
    panelId="import"
    reorder={getPanelReorderProps("import")}
    action={
      <label className="button button-secondary cursor-pointer">
        <Upload size={16} aria-hidden="true" />
        Upload
        <input className="sr-only" type="file" accept=".yaml,.yml,.json" onChange={onUpload} />
      </label>
    }
  >
    <div className="panel-body">
      <div className="input-row">
        <input
          className="field min-w-0 flex-1"
          placeholder="https://example.com/openapi.yaml"
          value={urlInput}
          onChange={(event) => onUrlInputChange(event.target.value)}
        />
        <button className="button button-secondary" type="button" disabled={isImportingUrl} onClick={onUrlImport}>
          <Link size={16} aria-hidden="true" />
          URL
        </button>
      </div>
      <div className="section-label-row">
        <span className="field-label">cURL request</span>
        <button
          className="button button-secondary button-small"
          type="button"
          disabled={!curlInput.trim()}
          onClick={onCurlImport}
        >
          <Terminal size={15} aria-hidden="true" />
          Import cURL
        </button>
      </div>
      <textarea
        className="field code-field curl-editor"
        spellCheck={false}
        placeholder="curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' --data '{&quot;name&quot;:&quot;Ada&quot;}'"
        value={curlInput}
        onChange={(event) => onCurlInputChange(event.target.value)}
      />
      <button className="button button-secondary w-full justify-center" type="button" onClick={onRawImport}>
        <Wand2 size={16} aria-hidden="true" />
        Import raw
      </button>
      <textarea
        className="field code-field spec-editor"
        spellCheck={false}
        value={specText}
        onChange={(event) => onSpecTextChange(event.target.value)}
      />
    </div>
  </Panel>
);
