import { GridData, PixelState, GridPosition, GridSelection } from '@/types';

/**
 * Converts pixel coordinates to canvas coordinates
 */
export function gridToCanvasCoordinates(
  gridX: number,
  gridY: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: (gridX / gridSize) * canvasWidth,
    y: (gridY / gridSize) * canvasHeight,
  };
}

/**
 * Converts canvas coordinates to grid coordinates
 */
export function canvasToGridCoordinates(
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number
): GridPosition {
  return {
    x: Math.floor((canvasX / canvasWidth) * gridSize),
    y: Math.floor((canvasY / canvasHeight) * gridSize),
  };
}

/**
 * Checks if a grid position is within bounds
 */
export function isValidGridPosition(position: GridPosition, gridSize: number): boolean {
  return (
    position.x >= 0 &&
    position.x < gridSize &&
    position.y >= 0 &&
    position.y < gridSize
  );
}

/**
 * Gets a pixel from grid data at specified coordinates
 */
export function getPixelAt(gridData: GridData, x: number, y: number): PixelState | null {
  if (!isValidGridPosition({ x, y }, gridData.width)) {
    return null;
  }
  return gridData.pixels[y][x];
}

/**
 * Updates a pixel in grid data at specified coordinates
 */
export function updatePixelAt(
  gridData: GridData,
  x: number,
  y: number,
  pixelState: Partial<PixelState>
): GridData {
  if (!isValidGridPosition({ x, y }, gridData.width)) {
    return gridData;
  }

  const newGridData = { ...gridData };
  newGridData.pixels = gridData.pixels.map((row, rowIndex) =>
    row.map((pixel, colIndex) => {
      if (rowIndex === y && colIndex === x) {
        return {
          ...pixel,
          ...pixelState,
          modified: true,
        };
      }
      return pixel;
    })
  );

  return newGridData;
}

/**
 * Gets all pixels within a selection rectangle
 */
export function getPixelsInSelection(
  gridData: GridData,
  selection: GridSelection
): PixelState[] {
  if (!selection.active) {
    return [];
  }

  const pixels: PixelState[] = [];
  const startX = Math.min(selection.start.x, selection.end.x);
  const endX = Math.max(selection.start.x, selection.end.x);
  const startY = Math.min(selection.start.y, selection.end.y);
  const endY = Math.max(selection.start.y, selection.end.y);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const pixel = getPixelAt(gridData, x, y);
      if (pixel) {
        pixels.push(pixel);
      }
    }
  }

  return pixels;
}

/**
 * Updates all pixels within a selection with new properties
 */
export function updatePixelsInSelection(
  gridData: GridData,
  selection: GridSelection,
  updates: Partial<PixelState>
): GridData {
  if (!selection.active) {
    return gridData;
  }

  let newGridData = gridData;
  const startX = Math.min(selection.start.x, selection.end.x);
  const endX = Math.max(selection.start.x, selection.end.x);
  const startY = Math.min(selection.start.y, selection.end.y);
  const endY = Math.max(selection.start.y, selection.end.y);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      newGridData = updatePixelAt(newGridData, x, y, updates);
    }
  }

  return newGridData;
}

/**
 * Calculates the visible grid area based on viewport and zoom
 */
export function calculateVisibleGridArea(
  viewportWidth: number,
  viewportHeight: number,
  scrollX: number,
  scrollY: number,
  zoomLevel: number,
  gridSize: number
): {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
} {
  const pixelSize = zoomLevel;
  const visibleCols = Math.ceil(viewportWidth / pixelSize);
  const visibleRows = Math.ceil(viewportHeight / pixelSize);

  const startX = Math.max(0, Math.floor(scrollX / pixelSize));
  const startY = Math.max(0, Math.floor(scrollY / pixelSize));
  const endX = Math.min(gridSize - 1, startX + visibleCols);
  const endY = Math.min(gridSize - 1, startY + visibleRows);

  return { startX, endX, startY, endY };
}

/**
 * Creates a new empty grid with transparent pixels
 */
export function createEmptyGrid(width: number, height: number): GridData {
  const pixels: PixelState[][] = [];

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      pixels[y][x] = {
        x,
        y,
        rgba: { r: 255, g: 255, b: 255, a: 0 }, // Transparent white
        modified: false,
        originalRgba: { r: 255, g: 255, b: 255, a: 0 },
      };
    }
  }

  return {
    pixels,
    width,
    height,
  };
}

/**
 * Clones grid data to avoid mutations
 */
export function cloneGridData(gridData: GridData): GridData {
  return {
    ...gridData,
    pixels: gridData.pixels.map(row =>
      row.map(pixel => ({
        ...pixel,
        rgba: { ...pixel.rgba },
        originalRgba: pixel.originalRgba ? { ...pixel.originalRgba } : undefined,
      }))
    ),
  };
}

/**
 * Gets all modified pixels from grid data
 */
export function getModifiedPixels(gridData: GridData): PixelState[] {
  const modifiedPixels: PixelState[] = [];

  for (let y = 0; y < gridData.height; y++) {
    for (let x = 0; x < gridData.width; x++) {
      const pixel = gridData.pixels[y][x];
      if (pixel.modified) {
        modifiedPixels.push(pixel);
      }
    }
  }

  return modifiedPixels;
}

/**
 * Resets all modifications in grid data
 */
export function resetGridModifications(gridData: GridData): GridData {
  const newGridData = cloneGridData(gridData);

  for (let y = 0; y < newGridData.height; y++) {
    for (let x = 0; x < newGridData.width; x++) {
      const pixel = newGridData.pixels[y][x];
      if (pixel.originalRgba) {
        pixel.rgba = { ...pixel.originalRgba };
        pixel.modified = false;
      }
    }
  }

  return newGridData;
}