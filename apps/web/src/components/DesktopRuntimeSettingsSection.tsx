import type { DesktopRuntimeSettings, RequestState } from "@specdock/core";

export const DesktopRuntimeSettingsSection = ({
  settings,
  defaultRequestMode,
  onDefaultRequestModeChange,
  onChange
}: {
  settings: DesktopRuntimeSettings;
  defaultRequestMode: RequestState["requestMode"];
  onDefaultRequestModeChange(mode: RequestState["requestMode"]): void;
  onChange(patch: Partial<DesktopRuntimeSettings>): void;
}) => (
  <div className="settings-section">
    <div className="settings-section-toggle settings-section-static">
      <div>
        <h3>Desktop runtime</h3>
        <p>Enable local-only desktop services.</p>
      </div>
    </div>
    <label className="block">
      <span className="field-label">Default request mode</span>
      <select
        className="field"
        value={defaultRequestMode}
        onChange={(event) =>
          onDefaultRequestModeChange(
            event.currentTarget.value === "proxy" ? "proxy" : "direct"
          )
        }
      >
        <option value="direct">Direct browser requests</option>
        <option value="proxy">Desktop proxy</option>
      </select>
    </label>
    <RuntimeToggle
      label="Mock server"
      checked={settings.mockServerEnabled}
      onChange={(mockServerEnabled) => onChange({ mockServerEnabled })}
    />
    <RuntimeToggle
      label="Proxy mode"
      checked={settings.proxyEnabled}
      onChange={(proxyEnabled) => onChange({ proxyEnabled })}
    />
    <label className="block">
      <span className="field-label">Proxy allowed hosts</span>
      <textarea
        className="field code-field"
        rows={3}
        placeholder="api.example.com, staging.example.com"
        value={settings.proxyAllowedHosts}
        onChange={(event) =>
          onChange({ proxyAllowedHosts: event.currentTarget.value })
        }
      />
    </label>
    <div className="settings-field-grid">
      <IntegerField
        label="Proxy timeout, ms"
        value={settings.proxyTimeoutMs}
        onChange={(proxyTimeoutMs) => onChange({ proxyTimeoutMs })}
      />
      <IntegerField
        label="Proxy max response, bytes"
        value={settings.proxyMaxResponseBytes}
        onChange={(proxyMaxResponseBytes) => onChange({ proxyMaxResponseBytes })}
      />
      <IntegerField
        label="Mock max response, bytes"
        value={settings.mockMaxResponseBytes}
        onChange={(mockMaxResponseBytes) => onChange({ mockMaxResponseBytes })}
      />
    </div>
    <RuntimeToggle
      label="Allow private targets"
      checked={settings.proxyAllowPrivateTargets}
      onChange={(proxyAllowPrivateTargets) =>
        onChange({ proxyAllowPrivateTargets })
      }
    />
  </div>
);

const IntegerField = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) => (
  <label className="block">
    <span className="field-label">{label}</span>
    <input
      className="field"
      min={1}
      type="number"
      value={value}
      onChange={(event) => onChange(readPositiveInteger(event.currentTarget.value))}
    />
  </label>
);

const RuntimeToggle = ({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}) => (
  <label className="settings-block-toggle is-visible">
    <span className="settings-block-name">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  </label>
);

const readPositiveInteger = (value: string): number => {
  const parsed = Number.parseInt(value, 10);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};
