import {
  ImageData,
  GridData,
  PixelState,
  RGBAColor,
  ImageProcessingOptions,
  ProcessingResult,
  GRID_SIZE,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
} from '@/types';

/**
 * Validates if the uploaded file is a supported image format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Creates an image element from a file and returns promise with image data
 */
export function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const imageData: ImageData = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: url,
        file,
      };
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculates the resize dimensions to fit image within target size while maintaining aspect ratio
 */
export function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number; offsetX: number; offsetY: number } {
  const aspectRatio = originalWidth / originalHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  let newWidth: number;
  let newHeight: number;

  if (aspectRatio > targetAspectRatio) {
    // Image is wider than target aspect ratio
    newWidth = targetWidth;
    newHeight = targetWidth / aspectRatio;
  } else {
    // Image is taller than target aspect ratio
    newHeight = targetHeight;
    newWidth = targetHeight * aspectRatio;
  }

  // Calculate offsets to center the image
  const offsetX = (targetWidth - newWidth) / 2;
  const offsetY = (targetHeight - newHeight) / 2;

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
  };
}

/**
 * Resizes an image to fit within the target dimensions using canvas
 */
export function resizeImageToCanvas(
  imageData: ImageData,
  options: ImageProcessingOptions
): Promise<CanvasRenderingContext2D> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = options.targetWidth;
      canvas.height = options.targetHeight;

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (options.maintainAspectRatio) {
        const dimensions = calculateResizeDimensions(
          img.naturalWidth,
          img.naturalHeight,
          options.targetWidth,
          options.targetHeight
        );

        const drawX = options.centerImage ? dimensions.offsetX : 0;
        const drawY = options.centerImage ? dimensions.offsetY : 0;

        ctx.drawImage(img, drawX, drawY, dimensions.width, dimensions.height);
      } else {
        // Stretch to fill entire canvas
        ctx.drawImage(img, 0, 0, options.targetWidth, options.targetHeight);
      }

      resolve(ctx);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = imageData.src;
  });
}

/**
 * Extracts RGBA values from canvas context and creates a grid data structure
 */
export function extractGridFromCanvas(ctx: CanvasRenderingContext2D): GridData {
  const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
  const pixels: PixelState[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    pixels[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const index = (y * GRID_SIZE + x) * 4;
      
      const rgba: RGBAColor = {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3] / 255, // Convert to 0-1 range
      };

      pixels[y][x] = {
        x,
        y,
        rgba,
        modified: false,
        originalRgba: { ...rgba },
      };
    }
  }

  return {
    pixels,
    width: GRID_SIZE,
    height: GRID_SIZE,
  };
}

/**
 * Main function to process an uploaded image into grid data
 */
export async function processImageToGrid(file: File): Promise<ProcessingResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          type: 'format',
          message: validation.error!,
          file,
        },
      };
    }

    // Load image
    const imageData = await loadImageFromFile(file);

    // Resize to grid dimensions
    const ctx = await resizeImageToCanvas(imageData, {
      targetWidth: GRID_SIZE,
      targetHeight: GRID_SIZE,
      maintainAspectRatio: true,
      centerImage: true,
      fillTransparent: true,
    });

    // Extract grid data
    const gridData = extractGridFromCanvas(ctx);

    return {
      success: true,
      imageData,
      gridData,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'processing',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        file,
      },
    };
  }
}

/**
 * Converts RGBA color to CSS color string
 */
export function rgbaToString(rgba: RGBAColor): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

/**
 * Converts hex color string to RGBA object
 */
export function hexToRgba(hex: string): RGBAColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1,
  };
}

/**
 * Converts RGBA to hex string
 */
export function rgbaToHex(rgba: RGBAColor): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
}