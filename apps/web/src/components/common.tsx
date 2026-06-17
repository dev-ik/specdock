import { FileCode2 } from "lucide-react";
import type React from "react";

export const Panel = ({
  title,
  action,
  children
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="panel">
    <div className="panel-header">
      <h2>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

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
