import { ChevronDown, FileCode2, GripVertical } from "lucide-react";
import { useId } from "react";
import type React from "react";
import type { PanelDropPosition, PanelMoveDirection } from "../app/usePanelLayout.js";
import { usePanelCollapse } from "../app/usePanelCollapse.js";

export type PanelReorderProps = {
  isDragging: boolean;
  onDragStart(): void;
  onDragEnd(): void;
  onDrop(position: PanelDropPosition): void;
  onMove(direction: PanelMoveDirection): void;
};

export const Panel = ({
  title,
  panelId,
  action,
  reorder,
  children
}: {
  title: string;
  panelId?: string;
  action?: React.ReactNode;
  reorder?: PanelReorderProps;
  children: React.ReactNode;
}) => {
  const contentId = useId();
  const { isCollapsed, toggleCollapsed } = usePanelCollapse(panelId);
  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    if (!panelId || !reorder) return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", panelId);
    reorder.onDragStart();
  };
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (!reorder) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    reorder.onDrop(event.clientY > rect.top + rect.height / 2 ? "after" : "before");
  };
  const handleMoveKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!reorder) return;

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      reorder.onMove(-1);
    }

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      reorder.onMove(1);
    }
  };

  return (
    <section
      className={`panel ${reorder ? "is-draggable" : ""} ${isCollapsed ? "is-collapsed" : ""} ${reorder?.isDragging ? "is-dragging" : ""}`}
      onDragOver={reorder ? (event) => event.preventDefault() : undefined}
      onDrop={handleDrop}
    >
      <div className="panel-header">
        <div className="panel-title-row">
          {panelId && reorder ? (
            <button
              className="panel-drag-handle"
              type="button"
              draggable
              aria-label={`Drag ${title}. Use arrow keys to move.`}
              title="Drag to reorder. Use arrow keys to move."
              onDragStart={handleDragStart}
              onDragEnd={reorder.onDragEnd}
              onKeyDown={handleMoveKey}
            >
              <GripVertical size={18} aria-hidden="true" />
            </button>
          ) : null}
          <h2>{title}</h2>
        </div>
        <div className="panel-header-actions">
          {action ? <div className="panel-header-action">{action}</div> : null}
          {panelId ? (
            <button
              className="panel-collapse-toggle"
              type="button"
              aria-expanded={!isCollapsed}
              aria-controls={contentId}
              aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${title}`}
              title={isCollapsed ? "Expand" : "Collapse"}
              onClick={toggleCollapsed}
            >
              <ChevronDown size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      <div id={contentId} className="panel-content" hidden={isCollapsed}>
        {children}
      </div>
    </section>
  );
};

export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="empty-state">{children}</div>
);

export const MethodBadge = ({ method }: { method: string }) => {
  const classes: Record<string, string> = {
    GET: "method-get",
    POST: "method-post",
    PUT: "method-put",
    PATCH: "method-patch",
    DELETE: "method-delete"
  };

  return <span className={`method-badge ${classes[method] ?? ""}`}>{method}</span>;
};

export const GenerateToggle = ({
  checked,
  label,
  meta,
  onChange
}: {
  checked: boolean;
  label: string;
  meta: string;
  onChange(checked: boolean): void;
}) => (
  <label className="generate-toggle">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>
      <span className="generate-toggle-label">{label}</span>
      <span className="generate-toggle-meta">{meta}</span>
    </span>
  </label>
);

export const FileIcon = () => <FileCode2 size={16} aria-hidden="true" />;
