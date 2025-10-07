import { describe, it, expect } from 'vitest';
import {
  calculateResizeDimensions,
  validateImageFile,
  rgbaToString,
  hexToRgba,
  rgbaToHex,
} from '@/utils/imageProcessing';
import { MAX_FILE_SIZE } from '@/types';

describe('Image Processing Utils', () => {
  describe('calculateResizeDimensions', () => {
    it('should maintain aspect ratio when resizing', () => {
      const result = calculateResizeDimensions(1000, 800, 500, 500);
      
      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(50);
    });

    it('should center tall images', () => {
      const result = calculateResizeDimensions(400, 1000, 500, 500);
      
      expect(result.width).toBe(200);
      expect(result.height).toBe(500);
      expect(result.offsetX).toBe(150);
      expect(result.offsetY).toBe(0);
    });
  });

  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file types', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');
    });

    it('should reject files that are too large', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
      
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });
  });

  describe('rgbaToString', () => {
    it('should convert RGBA to string format', () => {
      const rgba = { r: 255, g: 128, b: 0, a: 0.5 };
      const result = rgbaToString(rgba);
      
      expect(result).toBe('rgba(255, 128, 0, 0.5)');
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to RGBA', () => {
      const result = hexToRgba('#FF8000');
      
      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(0);
      expect(result.a).toBe(1);
    });

    it('should handle hex without hash', () => {
      const result = hexToRgba('FF8000');
      
      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(0);
      expect(result.a).toBe(1);
    });

    it('should throw on invalid hex', () => {
      expect(() => hexToRgba('invalid')).toThrow('Invalid hex color');
    });
  });

  describe('rgbaToHex', () => {
    it('should convert RGBA to hex', () => {
      const rgba = { r: 255, g: 128, b: 0, a: 1 };
      const result = rgbaToHex(rgba);
      
      expect(result).toBe('#ff8000');
    });

    it('should handle edge values', () => {
      const rgba = { r: 0, g: 255, b: 15, a: 1 };
      const result = rgbaToHex(rgba);
      
      expect(result).toBe('#00ff0f');
    });
  });
});