import { Link, Upload, Wand2 } from "lucide-react";
import type React from "react";
import type { OpenApiProject } from "@specdock/core";
import { EmptyState, Panel } from "./common.js";

export const ProjectsImportPanel = ({
  projects,
  activeProjectId,
  specText,
  urlInput,
  isImportingUrl,
  onOpenProject,
  onSpecTextChange,
  onUrlInputChange,
  onUrlImport,
  onRawImport,
  onUpload
}: {
  projects: OpenApiProject[];
  activeProjectId?: string;
  specText: string;
  urlInput: string;
  isImportingUrl: boolean;
  onOpenProject(project: OpenApiProject): void;
  onSpecTextChange(value: string): void;
  onUrlInputChange(value: string): void;
  onUrlImport(): void;
  onRawImport(): void;
  onUpload(event: React.ChangeEvent<HTMLInputElement>): void;
}) => (
  <aside id="import" className="panel-stack scroll-target">
    <Panel title="Local projects" action={<span className="meta-text">{projects.length}/10</span>}>
      <div className="project-list">
        {projects.length === 0 ? (
          <EmptyState>No saved projects</EmptyState>
        ) : (
          projects.map((project) => (
            <button
              key={project.id}
              className={`project-item ${activeProjectId === project.id ? "is-active" : ""}`}
              type="button"
              onClick={() => onOpenProject(project)}
            >
              <span className="project-name">{project.name}</span>
              <span className="project-meta">
                {project.operations.length} operations - {project.schemas.length} schemas
              </span>
            </button>
          ))
        )}
      </div>
    </Panel>

    <Panel
      title="Import"
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
          <button
            className="button button-secondary"
            type="button"
            disabled={isImportingUrl}
            onClick={onUrlImport}
          >
            <Link size={16} aria-hidden="true" />
            URL
          </button>
        </div>
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
  </aside>
);
