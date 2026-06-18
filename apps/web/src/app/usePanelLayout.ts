import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readLocalJson, writeLocalJson } from "./local-storage.js";
import {
  defaultPanelLayout,
  findPanelColumn,
  insertInColumn,
  moveInColumn,
  normalizePanelIds,
  readStoredPanelLayout,
  reorderInColumn,
  type PanelColumnId,
  type PanelDropPosition,
  type PanelId,
  type PanelLayout,
  type PanelMoveDirection,
  type StoredPanelLayout
} from "./panel-layout-model.js";
import { panelLayoutStorageKey } from "./storage-keys.js";

export {
  defaultPanelLayout,
  orderPanelIds,
  panelLabels
} from "./panel-layout-model.js";
export type {
  PanelColumnId,
  PanelDropPosition,
  PanelId,
  PanelLayout,
  PanelMoveDirection
} from "./panel-layout-model.js";

export const usePanelLayout = () => {
  const storedLayout = useMemo(
    () => readStoredPanelLayout(readLocalJson<StoredPanelLayout>(panelLayoutStorageKey, defaultPanelLayout)),
    []
  );
  const [layout, setLayout] = useState<PanelLayout>(storedLayout.layout);
  const [hiddenPanelIds, setHiddenPanelIds] = useState<PanelId[]>(
    storedLayout.hiddenPanelIds
  );
  const [draggingPanelId, setDraggingPanelId] = useState<PanelId | undefined>();
  const draggingPanelRef = useRef<PanelId | undefined>(undefined);

  useEffect(
    () => writeLocalJson(panelLayoutStorageKey, { layout, hiddenPanelIds }),
    [hiddenPanelIds, layout]
  );

  const visibleLayout = useMemo<PanelLayout>(
    () => ({
      import: layout.import.filter((panelId) => !hiddenPanelIds.includes(panelId)),
      explorer: layout.explorer.filter((panelId) => !hiddenPanelIds.includes(panelId)),
      workspace: layout.workspace.filter((panelId) => !hiddenPanelIds.includes(panelId))
    }),
    [hiddenPanelIds, layout]
  );

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
      if (!sourceColumn || !targetColumn) return current;

      if (sourceColumn === targetColumn) {
        return {
          ...current,
          [sourceColumn]: reorderInColumn(current[sourceColumn], draggedPanelId, targetPanelId, position)
        };
      }

      return {
        ...current,
        [sourceColumn]: current[sourceColumn].filter((id) => id !== draggedPanelId),
        [targetColumn]: insertInColumn(
          current[targetColumn],
          draggedPanelId,
          targetPanelId,
          position
        )
      };
    });
  }, []);

  const dropPanelToColumn = useCallback((columnId: PanelColumnId) => {
    setLayout((current) => {
      const draggedPanelId = draggingPanelRef.current;
      if (!draggedPanelId) return current;

      const sourceColumn = findPanelColumn(current, draggedPanelId);
      if (!sourceColumn) return current;

      const sourceIds = current[sourceColumn];
      if (sourceColumn === columnId && sourceIds[sourceIds.length - 1] === draggedPanelId) {
        return current;
      }

      return {
        ...current,
        [sourceColumn]: sourceIds.filter((id) => id !== draggedPanelId),
        [columnId]: [...current[columnId].filter((id) => id !== draggedPanelId), draggedPanelId]
      };
    });
  }, []);

  const setPanelVisibility = useCallback((panelId: PanelId, visible: boolean) => {
    setHiddenPanelIds((current) =>
      visible
        ? current.filter((hiddenPanelId) => hiddenPanelId !== panelId)
        : current.includes(panelId)
          ? current
          : [...current, panelId]
    );
  }, []);

  const setHiddenPanels = useCallback((panelIds: PanelId[]) => {
    setHiddenPanelIds(normalizePanelIds(panelIds));
  }, []);

  return {
    layout,
    visibleLayout,
    hiddenPanelIds,
    draggingPanelId,
    startDragging,
    stopDragging,
    dropPanel,
    dropPanelToColumn,
    movePanel,
    setPanelVisibility,
    setHiddenPanels
  };
};
