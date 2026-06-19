export type PanelColumnId = "import" | "explorer" | "workspace";
export type PanelDropPosition = "before" | "after";
export type PanelMoveDirection = -1 | 1;
export type PanelId =
  | "local-projects"
  | "import"
  | "quality"
  | "contract-diff"
  | "endpoints"
  | "operation"
  | "request"
  | "mock-server"
  | "response"
  | "generate"
  | "generated-files";

export type PanelLayout = Record<PanelColumnId, PanelId[]>;
export type StoredPanelLayout = Partial<PanelLayout> | {
  layout?: Partial<PanelLayout>;
  hiddenPanelIds?: PanelId[];
};

export const defaultPanelLayout: PanelLayout = {
  import: ["local-projects", "import"],
  explorer: ["quality", "contract-diff", "endpoints", "operation"],
  workspace: ["request", "mock-server", "response", "generate", "generated-files"]
};

export const panelLabels: Record<PanelId, string> = {
  "local-projects": "Local projects",
  import: "Import",
  quality: "Contract quality",
  "contract-diff": "Contract diff",
  endpoints: "Endpoints",
  operation: "Operation",
  request: "Request",
  "mock-server": "Mock server",
  response: "Response",
  generate: "Generate",
  "generated-files": "Generated files"
};

export const orderPanelIds = <T extends PanelId>(defaultIds: readonly T[], savedIds: PanelId[]): T[] => {
  const knownIds = new Set<PanelId>(defaultIds);
  const orderedIds = savedIds.filter((id): id is T => knownIds.has(id));
  const missingIds = defaultIds.filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...missingIds];
};

export const readStoredPanelLayout = (stored: StoredPanelLayout): {
  layout: PanelLayout;
  hiddenPanelIds: PanelId[];
} => {
  const rawLayout = isPanelLayoutConfig(stored) ? stored.layout : stored;
  const rawHiddenPanelIds = isPanelLayoutConfig(stored) ? stored.hiddenPanelIds : [];

  return {
    layout: normalizePanelLayout(rawLayout ?? {}),
    hiddenPanelIds: normalizePanelIds(rawHiddenPanelIds ?? [])
  };
};

export const normalizePanelIds = (panelIds: PanelId[]): PanelId[] => {
  const knownIds = new Set(Object.keys(panelLabels));
  return panelIds.filter((panelId) => knownIds.has(panelId));
};

export const findPanelColumn = (
  layout: PanelLayout,
  panelId: PanelId
): PanelColumnId | undefined => {
  return (Object.keys(layout) as PanelColumnId[]).find((columnId) =>
    layout[columnId].includes(panelId)
  );
};

export const moveInColumn = (
  ids: PanelId[],
  panelId: PanelId,
  direction: PanelMoveDirection
): PanelId[] => {
  const index = ids.indexOf(panelId);
  const nextIndex = index + direction;

  if (index === -1 || nextIndex < 0 || nextIndex >= ids.length) return ids;

  const nextIds = [...ids];
  const currentPanelId = nextIds[index];
  const nextPanelId = nextIds[nextIndex];
  if (!currentPanelId || !nextPanelId) return ids;

  nextIds[index] = nextPanelId;
  nextIds[nextIndex] = currentPanelId;
  return nextIds;
};

export const reorderInColumn = (
  ids: PanelId[],
  draggedPanelId: PanelId,
  targetPanelId: PanelId,
  position: PanelDropPosition
): PanelId[] => {
  const withoutDragged = ids.filter((id) => id !== draggedPanelId);
  const targetIndex = withoutDragged.indexOf(targetPanelId);
  if (targetIndex === -1) return ids;

  const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
  return [
    ...withoutDragged.slice(0, insertIndex),
    draggedPanelId,
    ...withoutDragged.slice(insertIndex)
  ];
};

export const insertInColumn = (
  ids: PanelId[],
  draggedPanelId: PanelId,
  targetPanelId: PanelId,
  position: PanelDropPosition
): PanelId[] => {
  const targetIndex = ids.indexOf(targetPanelId);
  if (targetIndex === -1) return ids;

  const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
  return [
    ...ids.slice(0, insertIndex),
    draggedPanelId,
    ...ids.slice(insertIndex)
  ];
};

const normalizePanelLayout = (savedLayout: Partial<PanelLayout>): PanelLayout => {
  const nextLayout: PanelLayout = { import: [], explorer: [], workspace: [] };
  const knownIds = new Set(Object.values(defaultPanelLayout).flat());
  const seenIds = new Set<PanelId>();

  (Object.keys(defaultPanelLayout) as PanelColumnId[]).forEach((columnId) => {
    (savedLayout[columnId] ?? []).forEach((panelId) => {
      if (!knownIds.has(panelId) || seenIds.has(panelId)) return;

      nextLayout[columnId].push(panelId);
      seenIds.add(panelId);
    });
  });

  (Object.keys(defaultPanelLayout) as PanelColumnId[]).forEach((columnId) => {
    defaultPanelLayout[columnId].forEach((panelId) => {
      if (seenIds.has(panelId)) return;

      nextLayout[columnId].push(panelId);
      seenIds.add(panelId);
    });
  });

  return nextLayout;
};

const isPanelLayoutConfig = (
  value: StoredPanelLayout
): value is { layout?: Partial<PanelLayout>; hiddenPanelIds?: PanelId[] } =>
  "layout" in value || "hiddenPanelIds" in value;
