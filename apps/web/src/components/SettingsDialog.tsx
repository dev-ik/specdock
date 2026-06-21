import { ChevronRight, Eye, EyeOff, LayoutGrid, Trash2, X } from "lucide-react";
import { useState } from "react";
import type {
  AuthProfile,
  DesktopRuntimeSettings,
  RequestState
} from "@specdock/core";
import {
  defaultPanelLayout,
  panelLabels,
  type PanelColumnId,
  type PanelId
} from "../app/usePanelLayout.js";
import { AuthProfilesSection } from "./AuthProfilesSection.js";
import { DesktopRuntimeSettingsSection } from "./DesktopRuntimeSettingsSection.js";

type SettingsDialogProps = {
  open: boolean;
  activeProjectId?: string;
  projectCount: number;
  historyCount: number;
  authProfiles: AuthProfile[];
  hiddenPanelIds: PanelId[];
  desktopSettingsAvailable: boolean;
  desktopSettings: DesktopRuntimeSettings;
  defaultRequestMode: RequestState["requestMode"];
  onClose(): void;
  onClearHistory(): void;
  onPanelVisibilityChange(panelId: PanelId, visible: boolean): void;
  onHiddenPanelsChange(panelIds: PanelId[]): void;
  onAddAuthProfile(type: AuthProfile["type"]): void;
  onUpdateAuthProfile(
    profileId: string,
    patch: Partial<Pick<AuthProfile, "name" | "values">>
  ): void;
  onDeleteAuthProfile(profileId: string): void;
  onDesktopSettingsChange(patch: Partial<DesktopRuntimeSettings>): void;
  onDefaultRequestModeChange(mode: RequestState["requestMode"]): void;
};

export const SettingsDialog = ({
  open,
  activeProjectId,
  projectCount,
  historyCount,
  authProfiles,
  hiddenPanelIds,
  desktopSettingsAvailable,
  desktopSettings,
  defaultRequestMode,
  onClose,
  onClearHistory,
  onPanelVisibilityChange,
  onHiddenPanelsChange,
  onAddAuthProfile,
  onUpdateAuthProfile,
  onDeleteAuthProfile,
  onDesktopSettingsChange,
  onDefaultRequestModeChange
}: SettingsDialogProps) => {
  const [workspaceBlocksOpen, setWorkspaceBlocksOpen] = useState(false);

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
          {desktopSettingsAvailable ? (
            <DesktopRuntimeSettingsSection
              settings={desktopSettings}
              defaultRequestMode={defaultRequestMode}
              onChange={onDesktopSettingsChange}
              onDefaultRequestModeChange={onDefaultRequestModeChange}
            />
          ) : null}
          <div className="settings-section">
            <button
              className="settings-section-toggle"
              type="button"
              aria-expanded={workspaceBlocksOpen}
              onClick={() => setWorkspaceBlocksOpen((current) => !current)}
            >
              <div>
                <h3>Workspace blocks</h3>
                <p>Choose which panels stay on the workspace.</p>
              </div>
              <span className="settings-section-summary">
                {totalVisibleCount(hiddenPanelIds)} shown
                {hiddenPanelIds.length > 0 ? ` / ${hiddenPanelIds.length} hidden` : ""}
              </span>
              <ChevronRight
                className={workspaceBlocksOpen ? "is-open" : ""}
                size={17}
                aria-hidden="true"
              />
            </button>
            {workspaceBlocksOpen ? (
              <>
                <div className="settings-preset-row">
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    onClick={() => onHiddenPanelsChange([])}
                  >
                    <LayoutGrid size={14} aria-hidden="true" />
                    Show all
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    onClick={() => onHiddenPanelsChange(hiddenPanelsForEssentials())}
                  >
                    <Eye size={14} aria-hidden="true" />
                    Essentials
                  </button>
                </div>
                <div className="settings-block-list">
                  {(Object.keys(defaultPanelLayout) as PanelColumnId[]).map((columnId) => (
                    <div key={columnId} className="settings-block-group">
                      <div className="settings-block-group-header">
                        <span>{columnTitle(columnId)}</span>
                        <span>{visibleCount(defaultPanelLayout[columnId], hiddenPanelIds)}/{defaultPanelLayout[columnId].length}</span>
                      </div>
                      {defaultPanelLayout[columnId].map((panelId) => (
                        <PanelVisibilityButton
                          key={panelId}
                          panelId={panelId}
                          hidden={hiddenPanelIds.includes(panelId)}
                          onToggle={onPanelVisibilityChange}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <AuthProfilesSection
            projectId={activeProjectId}
            profiles={authProfiles}
            onAddProfile={onAddAuthProfile}
            onUpdateProfile={onUpdateAuthProfile}
            onDeleteProfile={onDeleteAuthProfile}
          />
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

const columnTitle = (columnId: PanelColumnId): string => {
  if (columnId === "import") return "Import";
  if (columnId === "explorer") return "Explorer";

  return "Workspace";
};

const PanelVisibilityButton = ({
  panelId,
  hidden,
  onToggle
}: {
  panelId: PanelId;
  hidden: boolean;
  onToggle(panelId: PanelId, visible: boolean): void;
}) => (
  <button
    className={`settings-block-toggle ${hidden ? "is-hidden" : "is-visible"}`}
    type="button"
    aria-pressed={!hidden}
    onClick={() => onToggle(panelId, hidden)}
  >
    <span className="settings-block-name">
      {hidden ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
      {panelLabels[panelId]}
    </span>
    <span>{hidden ? "Hidden" : "Shown"}</span>
  </button>
);

const visibleCount = (panelIds: PanelId[], hiddenPanelIds: PanelId[]): number =>
  panelIds.filter((panelId) => !hiddenPanelIds.includes(panelId)).length;

const totalVisibleCount = (hiddenPanelIds: PanelId[]): number =>
  Object.values(defaultPanelLayout).flat().length - hiddenPanelIds.length;

const hiddenPanelsForEssentials = (): PanelId[] => {
  const essentials = new Set<PanelId>([
    "local-projects",
    "import",
    "endpoints",
    "operation",
    "request",
    "response"
  ]);

  return Object.values(defaultPanelLayout)
    .flat()
    .filter((panelId) => !essentials.has(panelId));
};
