import { useState, useCallback } from 'react';
import { RGBAColor } from '@/types';
import {
  rgbaToHsl,
  rgbaToHsv,
  adjustBrightness,
  adjustContrast,
  adjustSaturation,
  blendColors,
  rgbaToHex,
  hexToRgba,
} from '@/utils/colorConversion';

interface UseColorManagementState {
  currentColor: RGBAColor;
  colorHistory: RGBAColor[];
  colorPalette: RGBAColor[];
}

interface UseColorManagementActions {
  setCurrentColor: (color: RGBAColor) => void;
  setCurrentColorFromHex: (hex: string) => void;
  adjustCurrentBrightness: (factor: number) => void;
  adjustCurrentContrast: (factor: number) => void;
  adjustCurrentSaturation: (factor: number) => void;
  addToHistory: (color: RGBAColor) => void;
  addToPalette: (color: RGBAColor) => void;
  removeFromPalette: (index: number) => void;
  clearHistory: () => void;
  clearPalette: () => void;
  blendWithCurrent: (topColor: RGBAColor) => void;
}

export type UseColorManagementReturn = UseColorManagementState & UseColorManagementActions & {
  currentColorHex: string;
  currentColorHsl: { h: number; s: number; l: number };
  currentColorHsv: { h: number; s: number; v: number };
};

const MAX_HISTORY_SIZE = 20;
const MAX_PALETTE_SIZE = 32;

// Default color palette with common colors
const DEFAULT_PALETTE: RGBAColor[] = [
  { r: 0, g: 0, b: 0, a: 1 },       // Black
  { r: 255, g: 255, b: 255, a: 1 }, // White
  { r: 255, g: 0, b: 0, a: 1 },     // Red
  { r: 0, g: 255, b: 0, a: 1 },     // Green
  { r: 0, g: 0, b: 255, a: 1 },     // Blue
  { r: 255, g: 255, b: 0, a: 1 },   // Yellow
  { r: 255, g: 0, b: 255, a: 1 },   // Magenta
  { r: 0, g: 255, b: 255, a: 1 },   // Cyan
  { r: 128, g: 128, b: 128, a: 1 }, // Gray
  { r: 255, g: 165, b: 0, a: 1 },   // Orange
  { r: 128, g: 0, b: 128, a: 1 },   // Purple
  { r: 165, g: 42, b: 42, a: 1 },   // Brown
];

/**
 * Custom hook for managing color operations and state
 * Handles color conversion, adjustment, history, and palette management
 */
export function useColorManagement(): UseColorManagementReturn {
  const [state, setState] = useState<UseColorManagementState>({
    currentColor: { r: 0, g: 0, b: 0, a: 1 }, // Default to black
    colorHistory: [],
    colorPalette: [...DEFAULT_PALETTE],
  });

  const setCurrentColor = useCallback((color: RGBAColor) => {
    setState(prev => ({
      ...prev,
      currentColor: color,
    }));
  }, []);

  const setCurrentColorFromHex = useCallback((hex: string) => {
    try {
      const color = hexToRgba(hex);
      setCurrentColor(color);
    } catch (error) {
      console.warn('Invalid hex color:', hex);
    }
  }, [setCurrentColor]);

  const adjustCurrentBrightness = useCallback((factor: number) => {
    setState(prev => ({
      ...prev,
      currentColor: adjustBrightness(prev.currentColor, factor),
    }));
  }, []);

  const adjustCurrentContrast = useCallback((factor: number) => {
    setState(prev => ({
      ...prev,
      currentColor: adjustContrast(prev.currentColor, factor),
    }));
  }, []);

  const adjustCurrentSaturation = useCallback((factor: number) => {
    setState(prev => ({
      ...prev,
      currentColor: adjustSaturation(prev.currentColor, factor),
    }));
  }, []);

  const addToHistory = useCallback((color: RGBAColor) => {
    setState(prev => {
      // Don't add if it's the same as the last color
      if (prev.colorHistory.length > 0) {
        const lastColor = prev.colorHistory[prev.colorHistory.length - 1];
        if (
          lastColor.r === color.r &&
          lastColor.g === color.g &&
          lastColor.b === color.b &&
          lastColor.a === color.a
        ) {
          return prev;
        }
      }

      const newHistory = [...prev.colorHistory, color];
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      return {
        ...prev,
        colorHistory: newHistory,
      };
    });
  }, []);

  const addToPalette = useCallback((color: RGBAColor) => {
    setState(prev => {
      // Check if color already exists in palette
      const exists = prev.colorPalette.some(
        c => c.r === color.r && c.g === color.g && c.b === color.b && c.a === color.a
      );

      if (exists) return prev;

      const newPalette = [...prev.colorPalette, color];
      
      // Limit palette size
      if (newPalette.length > MAX_PALETTE_SIZE) {
        newPalette.shift();
      }

      return {
        ...prev,
        colorPalette: newPalette,
      };
    });
  }, []);

  const removeFromPalette = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      colorPalette: prev.colorPalette.filter((_, i) => i !== index),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      colorHistory: [],
    }));
  }, []);

  const clearPalette = useCallback(() => {
    setState(prev => ({
      ...prev,
      colorPalette: [...DEFAULT_PALETTE],
    }));
  }, []);

  const blendWithCurrent = useCallback((topColor: RGBAColor) => {
    setState(prev => ({
      ...prev,
      currentColor: blendColors(prev.currentColor, topColor),
    }));
  }, []);

  // Computed values
  const currentColorHex = rgbaToHex(state.currentColor);
  const currentColorHsl = rgbaToHsl(state.currentColor);
  const currentColorHsv = rgbaToHsv(state.currentColor);

  return {
    ...state,
    setCurrentColor,
    setCurrentColorFromHex,
    adjustCurrentBrightness,
    adjustCurrentContrast,
    adjustCurrentSaturation,
    addToHistory,
    addToPalette,
    removeFromPalette,
    clearHistory,
    clearPalette,
    blendWithCurrent,
    currentColorHex,
    currentColorHsl,
    currentColorHsv,
  };
}