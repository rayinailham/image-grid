import React, { useRef, useEffect, useCallback } from 'react';
import { ImageData } from '@/types';

interface ImageCanvasProps {
  imageData: ImageData | null;
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageData,
  width = 500,
  height = 500,
  className = '',
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    contextRef.current = ctx;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create and load image
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions to fit image within canvas while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / img.naturalWidth,
        canvas.height / img.naturalHeight
      );

      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;

      // Center the image
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Call callback if provided
      if (onCanvasReady) {
        onCanvasReady(canvas, ctx);
      }
    };

    img.src = imageData.src;
  }, [imageData, onCanvasReady]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Redraw when dimensions change
    drawImage();
  }, [width, height, drawImage]);

  return (
    <div className={`image-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        className="image-canvas"
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f5f5f5',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      
      {!imageData && (
        <div className="canvas-placeholder">
          <p>No image loaded</p>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;