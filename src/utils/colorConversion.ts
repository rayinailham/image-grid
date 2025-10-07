import { RGBAColor } from '@/types';

/**
 * Color space conversion utilities for the image grid editor
 */

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/**
 * Converts RGBA to HSL color space
 */
export function rgbaToHsl(rgba: RGBAColor): HSLColor {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;
  const l = sum / 2;

  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - sum) : diff / sum;

    switch (max) {
      case r:
        h = ((g - b) / diff) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL to RGBA color space
 */
export function hslToRgba(hsl: HSLColor, alpha: number = 1): RGBAColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: alpha,
  };
}

/**
 * Converts RGBA to HSV color space
 */
export function rgbaToHsv(rgba: RGBAColor): HSVColor {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  const v = max;
  const s = max === 0 ? 0 : diff / max;

  let h = 0;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Converts HSV to RGBA color space
 */
export function hsvToRgba(hsv: HSVColor, alpha: number = 1): RGBAColor {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h >= 1/6 && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h >= 2/6 && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h >= 3/6 && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h >= 4/6 && h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a: alpha,
  };
}

/**
 * Adjusts brightness of an RGBA color
 */
export function adjustBrightness(rgba: RGBAColor, factor: number): RGBAColor {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgba.r * factor))),
    g: Math.max(0, Math.min(255, Math.round(rgba.g * factor))),
    b: Math.max(0, Math.min(255, Math.round(rgba.b * factor))),
    a: rgba.a,
  };
}

/**
 * Adjusts contrast of an RGBA color
 */
export function adjustContrast(rgba: RGBAColor, factor: number): RGBAColor {
  const adjust = (value: number): number => {
    return Math.max(0, Math.min(255, Math.round((value - 128) * factor + 128)));
  };

  return {
    r: adjust(rgba.r),
    g: adjust(rgba.g),
    b: adjust(rgba.b),
    a: rgba.a,
  };
}

/**
 * Adjusts saturation of an RGBA color
 */
export function adjustSaturation(rgba: RGBAColor, factor: number): RGBAColor {
  const hsl = rgbaToHsl(rgba);
  hsl.s = Math.max(0, Math.min(100, hsl.s * factor));
  return hslToRgba(hsl, rgba.a);
}

/**
 * Blends two RGBA colors using alpha compositing
 */
export function blendColors(bottom: RGBAColor, top: RGBAColor): RGBAColor {
  const alpha = top.a;
  const invAlpha = 1 - alpha;

  return {
    r: Math.round(top.r * alpha + bottom.r * invAlpha),
    g: Math.round(top.g * alpha + bottom.g * invAlpha),
    b: Math.round(top.b * alpha + bottom.b * invAlpha),
    a: Math.min(1, top.a + bottom.a * (1 - top.a)),
  };
}

/**
 * Calculates the luminance of an RGBA color
 */
export function getLuminance(rgba: RGBAColor): number {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  // Apply gamma correction
  const linearR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const linearG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const linearB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate luminance using ITU-R BT.709 coefficients
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Calculates the contrast ratio between two colors
 */
export function getContrastRatio(color1: RGBAColor, color2: RGBAColor): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines if a color is considered "light" based on its luminance
 */
export function isLightColor(rgba: RGBAColor): boolean {
  return getLuminance(rgba) > 0.5;
}

/**
 * Gets the complementary color
 */
export function getComplementaryColor(rgba: RGBAColor): RGBAColor {
  return {
    r: 255 - rgba.r,
    g: 255 - rgba.g,
    b: 255 - rgba.b,
    a: rgba.a,
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
 * Converts color to grayscale using luminance
 */
export function toGrayscale(rgba: RGBAColor): RGBAColor {
  const gray = Math.round(getLuminance(rgba) * 255);
  return {
    r: gray,
    g: gray,
    b: gray,
    a: rgba.a,
  };
}