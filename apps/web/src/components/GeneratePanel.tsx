import { Download, FileDown, Wand2 } from "lucide-react";
import type { GenerateOptions } from "@specdock/core";
import type { GenerateMeta } from "../app/types.js";
import { GenerateToggle, Panel, type PanelReorderProps } from "./common.js";

export const GeneratePanel = ({
  options,
  meta,
  fileCount,
  canExportHttp,
  isGenerating,
  isDownloadingZip,
  onOptionsChange,
  onGenerate,
  onExportHttp,
  onDownloadZip,
  reorder
}: {
  options: GenerateOptions;
  meta?: GenerateMeta;
  fileCount: number;
  canExportHttp: boolean;
  isGenerating: boolean;
  isDownloadingZip: boolean;
  onOptionsChange(patch: Partial<GenerateOptions>): void;
  onGenerate(): void;
  onExportHttp(): void;
  onDownloadZip(): void;
  reorder?: PanelReorderProps;
}) => (
  <Panel
    title="Generate"
    panelId="generate"
    reorder={reorder}
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
        <SelectOption
          label="Language"
          value={options.language}
          options={languageOptions}
          hint={languageOptions.find((option) => option.value === options.language)?.target}
          onChange={(language) => onOptionsChange({ language })}
        />
        {options.language === "typescript" ? (
          <SegmentedOption
            label="Client"
            value={options.client}
            options={["fetch", "axios"]}
            onChange={(client) => onOptionsChange({ client })}
          />
        ) : undefined}
        <label className="block">
          <span className="field-label">Output path</span>
          <input
            className="field w-full"
            value={options.outputPath}
            onChange={(event) => onOptionsChange({ outputPath: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">SDK package</span>
          <input
            className="field w-full"
            value={options.packageName}
            onChange={(event) => onOptionsChange({ packageName: event.target.value })}
          />
          <span className="field-hint">Package/module metadata for generated SDK files.</span>
        </label>
        <label className="block">
          <span className="field-label">Client class</span>
          <input
            className="field w-full"
            value={options.clientName}
            onChange={(event) => onOptionsChange({ clientName: event.target.value })}
          />
          <span className="field-hint">Generated client type or class name.</span>
        </label>
        <SegmentedOption
          label="Naming"
          value={options.namingStyle}
          options={["operationId", "camelCase"]}
          labels={{ operationId: "operationId", camelCase: "camel" }}
          onChange={(namingStyle) => onOptionsChange({ namingStyle })}
        />
        <SegmentedOption
          label="Base URL strategy"
          value={options.baseUrlStrategy}
          options={["constructor", "perRequest"]}
          labels={{ constructor: "constructor", perRequest: "per request" }}
          onChange={(baseUrlStrategy) => onOptionsChange({ baseUrlStrategy })}
        />
      </div>

      {options.language === "typescript" ? (
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
      ) : undefined}

      <div className="request-actions">
        <div className="generate-summary">
          {meta
            ? `${meta.outputPlan.fileCount} files in ${meta.outputPlan.outputRoot} - ${formatBytes(meta.outputPlan.totalBytes)}`
            : fileCount > 0
              ? `${fileCount} generated files ready`
              : "Generate SDK files from the active OpenAPI spec"}
        </div>
        <div className="button-row">
          <button className="button button-primary" type="button" disabled={isGenerating} onClick={onGenerate}>
            <Wand2 size={16} aria-hidden="true" />
            Generate
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={!canExportHttp}
            onClick={onExportHttp}
          >
            <FileDown size={16} aria-hidden="true" />
            HTTP
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

const languageOptions = [
  { value: "typescript", label: "TypeScript", target: "TypeScript 5.x, Node.js 20+ or browsers" },
  { value: "python", label: "Python", target: "Python >=3.11, httpx >=0.27.0" },
  { value: "go", label: "Go", target: "Go 1.22, standard library" },
  { value: "java", label: "Java", target: "Java 17, Jackson 2.17.2" },
  { value: "csharp", label: "C#", target: ".NET 8.0, System.Text.Json" },
  { value: "php", label: "PHP", target: "PHP >=8.1, Guzzle ^7.0" }
] satisfies { value: GenerateOptions["language"]; label: string; target: string }[];

const formatBytes = (value: number): string => {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
};

const SelectOption = <T extends string>({
  label,
  value,
  options,
  hint,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string; target?: string }[];
  hint?: string;
  onChange(value: T): void;
}) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <select
      className="field w-full"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint ? <span className="field-hint">{hint}</span> : null}
  </label>
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
