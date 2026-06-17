import { useCallback, useEffect, useRef, useState } from "react";
import { readLocalJson, writeLocalJson } from "./local-storage.js";
import { panelLayoutStorageKey } from "./storage-keys.js";

export type PanelColumnId = "import" | "explorer" | "workspace";
export type PanelDropPosition = "before" | "after";
export type PanelMoveDirection = -1 | 1;
export type PanelId =
  | "local-projects"
  | "import"
  | "endpoints"
  | "operation"
  | "request"
  | "response"
  | "generate"
  | "generated-files";

export type PanelLayout = Record<PanelColumnId, PanelId[]>;

export const defaultPanelLayout: PanelLayout = {
  import: ["local-projects", "import"],
  explorer: ["endpoints", "operation"],
  workspace: ["request", "response", "generate", "generated-files"]
};

export const usePanelLayout = () => {
  const [layout, setLayout] = useState<PanelLayout>(() =>
    normalizePanelLayout(readLocalJson<Partial<PanelLayout>>(panelLayoutStorageKey, defaultPanelLayout))
  );
  const [draggingPanelId, setDraggingPanelId] = useState<PanelId | undefined>();
  const draggingPanelRef = useRef<PanelId | undefined>(undefined);

  useEffect(() => writeLocalJson(panelLayoutStorageKey, layout), [layout]);

  const movePanel = useCallback((panelId: PanelId, direction: PanelMoveDirection) => {
    setLayout((current) => {
      const columnId = findPanelColumn(current, panelId);
      if (!columnId) return current;

      const nextColumn = moveInColumn(current[columnId], panelId, direction);
      return nextColumn === current[columnId] ? current : { ...current, [columnId]: nextColumn };
    });
  }, []);

  const startDragging = useCallback((panelId: PanelId) => {
    draggingPanelRef.current = panelId;
    setDraggingPanelId(panelId);
  }, []);

  const stopDragging = useCallback(() => {
    draggingPanelRef.current = undefined;
    setDraggingPanelId(undefined);
  }, []);

  const dropPanel = useCallback((targetPanelId: PanelId, position: PanelDropPosition) => {
    setLayout((current) => {
      const draggedPanelId = draggingPanelRef.current;
      if (!draggedPanelId || draggedPanelId === targetPanelId) return current;

      const sourceColumn = findPanelColumn(current, draggedPanelId);
      const targetColumn = findPanelColumn(current, targetPanelId);
      if (!sourceColumn || sourceColumn !== targetColumn) return current;

      return {
        ...current,
        [sourceColumn]: reorderInColumn(current[sourceColumn], draggedPanelId, targetPanelId, position)
      };
    });
  }, []);

  return {
    layout,
    draggingPanelId,
    startDragging,
    stopDragging,
    dropPanel,
    movePanel
  };
};

export const orderPanelIds = <T extends PanelId>(defaultIds: readonly T[], savedIds: PanelId[]): T[] => {
  const knownIds = new Set<PanelId>(defaultIds);
  const orderedIds = savedIds.filter((id): id is T => knownIds.has(id));
  const missingIds = defaultIds.filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...missingIds];
};

const normalizePanelLayout = (savedLayout: Partial<PanelLayout>): PanelLayout => ({
  import: orderPanelIds(defaultPanelLayout.import, savedLayout.import ?? []),
  explorer: orderPanelIds(defaultPanelLayout.explorer, savedLayout.explorer ?? []),
  workspace: orderPanelIds(defaultPanelLayout.workspace, savedLayout.workspace ?? [])
});

const findPanelColumn = (layout: PanelLayout, panelId: PanelId): PanelColumnId | undefined => {
  return (Object.keys(layout) as PanelColumnId[]).find((columnId) =>
    layout[columnId].includes(panelId)
  );
};

const moveInColumn = (
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

const reorderInColumn = (
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
