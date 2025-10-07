// Core data structures for the image grid editor

export interface RGBAColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export interface ImageData {
  width: number;
  height: number;
  src: string;
  file?: File;
}

export interface PixelState {
  x: number;
  y: number;
  rgba: RGBAColor;
  modified: boolean;
  originalRgba?: RGBAColor;
}

export interface GridData {
  pixels: PixelState[][];
  width: number; // 20
  height: number; // 20
}

export interface ImageProcessingOptions {
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  centerImage: boolean;
  fillTransparent: boolean;
}

export interface UploadError {
  type: 'format' | 'size' | 'processing' | 'network';
  message: string;
  file?: File;
}

export interface ProcessingResult {
  success: boolean;
  imageData?: ImageData;
  gridData?: GridData;
  error?: UploadError;
}

// Canvas and rendering types
export interface CanvasContextData {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSelection {
  start: GridPosition;
  end: GridPosition;
  active: boolean;
}

// Supported image formats
export type SupportedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export const SUPPORTED_FORMATS: SupportedImageFormat[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

// Constants
export const GRID_SIZE = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const PIXEL_SCALE_FACTOR = 1; // For grid visualization scaling