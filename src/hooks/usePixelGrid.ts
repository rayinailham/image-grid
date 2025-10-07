import { useState, useCallback, useMemo } from 'react';
import {
  GridData,
  PixelState,
  RGBAColor,
  GridPosition,
  GridSelection,
  GRID_SIZE,
} from '@/types';
import {
  updatePixelAt,
  updatePixelsInSelection,
  getPixelAt,
  cloneGridData,
  resetGridModifications,
  getModifiedPixels,
  createEmptyGrid,
} from '@/utils/gridMapping';

interface UsePixelGridState {
  gridData: GridData | null;
  selectedPixel: GridPosition | null;
  selection: GridSelection;
  zoomLevel: number;
  scrollPosition: { x: number; y: number };
  history: GridData[];
  historyIndex: number;
}

interface UsePixelGridActions {
  setGridData: (gridData: GridData | null) => void;
  updatePixel: (x: number, y: number, rgba: RGBAColor) => void;
  updateSelectedPixels: (rgba: RGBAColor) => void;
  selectPixel: (position: GridPosition | null) => void;
  setSelection: (selection: GridSelection) => void;
  setZoomLevel: (level: number) => void;
  setScrollPosition: (position: { x: number; y: number }) => void;
  resetGrid: () => void;
  undo: () => void;
  redo: () => void;
  clearGrid: () => void;
}

export type UsePixelGridReturn = UsePixelGridState & UsePixelGridActions & {
  canUndo: boolean;
  canRedo: boolean;
  modifiedPixelsCount: number;
  selectedPixelData: PixelState | null;
};

const MAX_HISTORY_SIZE = 50;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

/**
 * Custom hook for managing pixel grid state and operations
 * Handles grid manipulation, selection, zooming, and history
 */
export function usePixelGrid(): UsePixelGridReturn {
  const [state, setState] = useState<UsePixelGridState>({
    gridData: null,
    selectedPixel: null,
    selection: {
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
      active: false,
    },
    zoomLevel: 1,
    scrollPosition: { x: 0, y: 0 },
    history: [],
    historyIndex: -1,
  });

  // Add to history helper
  const addToHistory = useCallback((gridData: GridData) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(cloneGridData(gridData));

      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const setGridData = useCallback((gridData: GridData | null) => {
    setState(prev => ({
      ...prev,
      gridData,
      history: gridData ? [cloneGridData(gridData)] : [],
      historyIndex: gridData ? 0 : -1,
    }));
  }, []);

  const updatePixel = useCallback((x: number, y: number, rgba: RGBAColor) => {
    setState(prev => {
      if (!prev.gridData) return prev;

      const newGridData = updatePixelAt(prev.gridData, x, y, { rgba });
      addToHistory(newGridData);

      return {
        ...prev,
        gridData: newGridData,
      };
    });
  }, [addToHistory]);

  const updateSelectedPixels = useCallback((rgba: RGBAColor) => {
    setState(prev => {
      if (!prev.gridData || !prev.selection.active) return prev;

      const newGridData = updatePixelsInSelection(prev.gridData, prev.selection, { rgba });
      addToHistory(newGridData);

      return {
        ...prev,
        gridData: newGridData,
      };
    });
  }, [addToHistory]);

  const selectPixel = useCallback((position: GridPosition | null) => {
    setState(prev => ({
      ...prev,
      selectedPixel: position,
    }));
  }, []);

  const setSelection = useCallback((selection: GridSelection) => {
    setState(prev => ({
      ...prev,
      selection,
    }));
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    setState(prev => ({
      ...prev,
      zoomLevel: clampedLevel,
    }));
  }, []);

  const setScrollPosition = useCallback((position: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      scrollPosition: position,
    }));
  }, []);

  const resetGrid = useCallback(() => {
    setState(prev => {
      if (!prev.gridData) return prev;

      const resetGridData = resetGridModifications(prev.gridData);
      addToHistory(resetGridData);

      return {
        ...prev,
        gridData: resetGridData,
      };
    });
  }, [addToHistory]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;

      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        gridData: cloneGridData(prev.history[newIndex]),
        historyIndex: newIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;

      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        gridData: cloneGridData(prev.history[newIndex]),
        historyIndex: newIndex,
      };
    });
  }, []);

  const clearGrid = useCallback(() => {
    const emptyGrid = createEmptyGrid(GRID_SIZE, GRID_SIZE);
    setState(prev => ({
      ...prev,
      gridData: emptyGrid,
      history: [cloneGridData(emptyGrid)],
      historyIndex: 0,
    }));
  }, []);

  // Computed values
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  
  const modifiedPixelsCount = useMemo(() => {
    if (!state.gridData) return 0;
    return getModifiedPixels(state.gridData).length;
  }, [state.gridData]);

  const selectedPixelData = useMemo(() => {
    if (!state.gridData || !state.selectedPixel) return null;
    return getPixelAt(state.gridData, state.selectedPixel.x, state.selectedPixel.y);
  }, [state.gridData, state.selectedPixel]);

  return {
    ...state,
    setGridData,
    updatePixel,
    updateSelectedPixels,
    selectPixel,
    setSelection,
    setZoomLevel,
    setScrollPosition,
    resetGrid,
    undo,
    redo,
    clearGrid,
    canUndo,
    canRedo,
    modifiedPixelsCount,
    selectedPixelData,
  };
}