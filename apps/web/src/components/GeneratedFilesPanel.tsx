import type { GeneratedFile } from "@specdock/core";
import { EmptyState, FileIcon, Panel } from "./common.js";

export const GeneratedFilesPanel = ({
  files,
  selectedFile,
  onSelectPath
}: {
  files: GeneratedFile[];
  selectedFile?: GeneratedFile;
  onSelectPath(path: string): void;
}) => (
  <Panel title="Generated files" action={<span className="meta-text">{files.length} files</span>}>
    <div className="generated-grid">
      <div className="generated-list">
        {files.length === 0 ? (
          <EmptyState>No SDK files generated yet</EmptyState>
        ) : (
          files.map((file) => (
            <button
              key={file.path}
              className={`file-item ${selectedFile?.path === file.path ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectPath(file.path)}
            >
              <FileIcon />
              <span className="truncate">{file.path}</span>
            </button>
          ))
        )}
      </div>
      <pre className="code-block generated-code">
        <code>{selectedFile?.content ?? "Generated SDK files will appear here."}</code>
      </pre>
    </div>
  </Panel>
);
