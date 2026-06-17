import { useEffect, useMemo, useState } from "react";
import { readLocalString, writeLocalString } from "./local-storage.js";
import { panelCollapsedStoragePrefix } from "./storage-keys.js";

export const usePanelCollapse = (panelId?: string) => {
  const storageKey = useMemo(
    () => panelId ? `${panelCollapsedStoragePrefix}:${panelId}` : undefined,
    [panelId]
  );
  const [isCollapsed, setIsCollapsed] = useState(() =>
    storageKey ? readLocalString(storageKey) === "true" : false
  );

  useEffect(() => {
    if (!storageKey) return;

    writeLocalString(storageKey, isCollapsed ? "true" : undefined);
  }, [isCollapsed, storageKey]);

  return {
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed((current) => !current)
  };
};
