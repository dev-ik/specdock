import { Download, Wand2 } from "lucide-react";
import type { GenerateOptions } from "@specdock/core";
import type { GenerateMeta } from "../app/types.js";
import { GenerateToggle, Panel } from "./common.js";

export const GeneratePanel = ({
  options,
  meta,
  fileCount,
  isGenerating,
  isDownloadingZip,
  onOptionsChange,
  onGenerate,
  onDownloadZip
}: {
  options: GenerateOptions;
  meta?: GenerateMeta;
  fileCount: number;
  isGenerating: boolean;
  isDownloadingZip: boolean;
  onOptionsChange(patch: Partial<GenerateOptions>): void;
  onGenerate(): void;
  onDownloadZip(): void;
}) => (
  <Panel
    title="Generate"
    action={
      meta ? (
        <span className="meta-text">
          {meta.fileCount} files - v{meta.generatorVersion}
        </span>
      ) : undefined
    }
  >
    <div className="panel-body">
      <div className="generate-options-grid">
        <SegmentedOption
          label="Client"
          value={options.client}
          options={["fetch", "axios"]}
          onChange={(client) => onOptionsChange({ client })}
        />
        <label className="block">
          <span className="field-label">Output path</span>
          <input
            className="field w-full"
            value={options.outputPath}
            onChange={(event) => onOptionsChange({ outputPath: event.target.value })}
          />
        </label>
        <SegmentedOption
          label="Naming"
          value={options.namingStyle}
          options={["operationId", "camelCase"]}
          labels={{ operationId: "operationId", camelCase: "camel" }}
          onChange={(namingStyle) => onOptionsChange({ namingStyle })}
        />
      </div>

      <div className="generate-toggle-list">
        <GenerateToggle
          checked={options.generateTypes}
          label="Types"
          meta="types.ts"
          onChange={(checked) => onOptionsChange({ generateTypes: checked })}
        />
        <GenerateToggle
          checked={options.generateReactQuery}
          label="React Query"
          meta="hooks.ts"
          onChange={(checked) => onOptionsChange({ generateReactQuery: checked })}
        />
        <GenerateToggle
          checked={options.generateZod}
          label="Zod"
          meta="schemas.ts"
          onChange={(checked) => onOptionsChange({ generateZod: checked })}
        />
      </div>

      <div className="request-actions">
        <div className="generate-summary">
          {fileCount > 0 ? `${fileCount} generated files ready` : "Generate SDK files from the active OpenAPI spec"}
        </div>
        <div className="button-row">
          <button className="button button-primary" type="button" disabled={isGenerating} onClick={onGenerate}>
            <Wand2 size={16} aria-hidden="true" />
            Generate
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={isDownloadingZip}
            onClick={onDownloadZip}
          >
            <Download size={16} aria-hidden="true" />
            ZIP
          </button>
        </div>
      </div>
    </div>
  </Panel>
);

const SegmentedOption = <T extends string>({
  label,
  value,
  options,
  labels = {},
  onChange
}: {
  label: string;
  value: T;
  options: T[];
  labels?: Partial<Record<T, string>>;
  onChange(value: T): void;
}) => (
  <div>
    <span className="field-label">{label}</span>
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option}
          className={value === option ? "is-active" : ""}
          type="button"
          onClick={() => onChange(option)}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  </div>
);
