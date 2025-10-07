import { describe, it, expect } from 'vitest';
import {
  gridToCanvasCoordinates,
  canvasToGridCoordinates,
  isValidGridPosition,
  createEmptyGrid,
  getPixelAt,
  updatePixelAt,
} from '@/utils/gridMapping';
// import { GRID_SIZE } from '@/types';

describe('Grid Mapping Utils', () => {
  describe('gridToCanvasCoordinates', () => {
    it('should convert grid coordinates to canvas coordinates', () => {
      const result = gridToCanvasCoordinates(250, 250, 1000, 1000, 500);
      
      expect(result.x).toBe(500);
      expect(result.y).toBe(500);
    });

    it('should handle edge coordinates', () => {
      const result = gridToCanvasCoordinates(0, 499, 1000, 1000, 500);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(998);
    });
  });

  describe('canvasToGridCoordinates', () => {
    it('should convert canvas coordinates to grid coordinates', () => {
      const result = canvasToGridCoordinates(500, 500, 1000, 1000, 500);
      
      expect(result.x).toBe(250);
      expect(result.y).toBe(250);
    });

    it('should floor the coordinates', () => {
      const result = canvasToGridCoordinates(501, 499, 1000, 1000, 500);
      
      expect(result.x).toBe(250);
      expect(result.y).toBe(249);
    });
  });

  describe('isValidGridPosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidGridPosition({ x: 0, y: 0 }, 500)).toBe(true);
      expect(isValidGridPosition({ x: 250, y: 250 }, 500)).toBe(true);
      expect(isValidGridPosition({ x: 499, y: 499 }, 500)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isValidGridPosition({ x: -1, y: 0 }, 500)).toBe(false);
      expect(isValidGridPosition({ x: 0, y: -1 }, 500)).toBe(false);
      expect(isValidGridPosition({ x: 500, y: 0 }, 500)).toBe(false);
      expect(isValidGridPosition({ x: 0, y: 500 }, 500)).toBe(false);
    });
  });

  describe('createEmptyGrid', () => {
    it('should create a grid with correct dimensions', () => {
      const grid = createEmptyGrid(10, 10);
      
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(10);
      expect(grid.pixels).toHaveLength(10);
      expect(grid.pixels[0]).toHaveLength(10);
    });

    it('should initialize pixels with transparent white', () => {
      const grid = createEmptyGrid(2, 2);
      const pixel = grid.pixels[0][0];
      
      expect(pixel.rgba.r).toBe(255);
      expect(pixel.rgba.g).toBe(255);
      expect(pixel.rgba.b).toBe(255);
      expect(pixel.rgba.a).toBe(0);
      expect(pixel.modified).toBe(false);
    });
  });

  describe('getPixelAt', () => {
    it('should return pixel at valid coordinates', () => {
      const grid = createEmptyGrid(5, 5);
      const pixel = getPixelAt(grid, 2, 2);
      
      expect(pixel).not.toBeNull();
      expect(pixel?.x).toBe(2);
      expect(pixel?.y).toBe(2);
    });

    it('should return null for invalid coordinates', () => {
      const grid = createEmptyGrid(5, 5);
      
      expect(getPixelAt(grid, -1, 0)).toBeNull();
      expect(getPixelAt(grid, 5, 0)).toBeNull();
      expect(getPixelAt(grid, 0, -1)).toBeNull();
      expect(getPixelAt(grid, 0, 5)).toBeNull();
    });
  });

  describe('updatePixelAt', () => {
    it('should update pixel color and mark as modified', () => {
      const grid = createEmptyGrid(3, 3);
      const newColor = { r: 255, g: 0, b: 0, a: 1 };
      
      const updatedGrid = updatePixelAt(grid, 1, 1, { rgba: newColor });
      const updatedPixel = getPixelAt(updatedGrid, 1, 1);
      
      expect(updatedPixel?.rgba).toEqual(newColor);
      expect(updatedPixel?.modified).toBe(true);
    });

    it('should not modify original grid', () => {
      const grid = createEmptyGrid(3, 3);
      const originalPixel = getPixelAt(grid, 1, 1);
      const newColor = { r: 255, g: 0, b: 0, a: 1 };
      
      updatePixelAt(grid, 1, 1, { rgba: newColor });
      
      expect(originalPixel?.rgba.r).toBe(255);
      expect(originalPixel?.rgba.g).toBe(255);
      expect(originalPixel?.rgba.b).toBe(255);
      expect(originalPixel?.modified).toBe(false);
    });

    it('should return original grid for invalid coordinates', () => {
      const grid = createEmptyGrid(3, 3);
      const newColor = { r: 255, g: 0, b: 0, a: 1 };
      
      const result = updatePixelAt(grid, -1, 0, { rgba: newColor });
      
      expect(result).toBe(grid);
    });
  });
});