import { Trash2, X } from "lucide-react";

type SettingsDialogProps = {
  open: boolean;
  projectCount: number;
  historyCount: number;
  onClose(): void;
  onClearHistory(): void;
};

export const SettingsDialog = ({
  open,
  projectCount,
  historyCount,
  onClose,
  onClearHistory
}: SettingsDialogProps) => {
  if (!open) return null;

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button className="button button-ghost button-small" type="button" aria-label="Close settings" onClick={onClose}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="settings-body">
          <div className="settings-metrics">
            <Metric label="Projects" value={projectCount} />
            <Metric label="History" value={historyCount} />
          </div>
          <button className="button button-secondary w-full" type="button" onClick={onClearHistory}>
            <Trash2 size={16} aria-hidden="true" />
            Clear history
          </button>
        </div>
      </section>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="settings-metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
