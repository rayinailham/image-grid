import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { GridData, GridPosition, RGBAColor } from '@/types';
import './PixelGrid.css';

interface PixelGridCanvasProps {
  gridData: GridData | null;
  selectedPixel: GridPosition | null;
  onPixelClick: (position: GridPosition) => void;
  onPixelUpdate: (x: number, y: number, rgba: RGBAColor) => void;
  zoomLevel: number;
  scrollPosition: { x: number; y: number };
  onScrollChange: (position: { x: number; y: number }) => void;
}

const PixelGridCanvas: React.FC<PixelGridCanvasProps> = ({
  gridData,
  selectedPixel,
  onPixelClick,
  zoomLevel,
  scrollPosition,
  onScrollChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPixel, setHoveredPixel] = useState<GridPosition | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [lastGridRender, setLastGridRender] = useState<string>('');

  // Calculate cell size based on zoom level and grid size with better scaling
  const cellSize = useMemo(() => {
    if (!gridData) return 2;
    
    let baseSize: number;
    if (gridData.width <= 20) {
      baseSize = 30;
    } else if (gridData.width <= 50) {
      baseSize = 12;
    } else if (gridData.width <= 100) {
      baseSize = 6;
    } else if (gridData.width <= 250) {
      baseSize = 3;
    } else if (gridData.width <= 500) {
      baseSize = 2; // Optimized for 500x500
    } else {
      baseSize = 1; // For very large grids
    }
    
    const scaledSize = Math.max(1, Math.floor(baseSize * zoomLevel));
    
    // For very large grids, limit minimum size to maintain performance
    if (gridData.width * gridData.height > 250000 && scaledSize < 2) {
      return 2;
    }
    
    return scaledSize;
  }, [zoomLevel, gridData]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Draw grid on canvas with optimizations (separated from hover effects)
  useEffect(() => {
    if (!gridData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true, // Better performance for frequent updates
      willReadFrequently: false // We don't read from canvas
    });
    if (!ctx) return;

    // Create render signature to avoid unnecessary redraws
    const renderSignature = `${gridData.width}-${gridData.height}-${cellSize}-${scrollPosition.x}-${scrollPosition.y}-${containerSize.width}-${containerSize.height}`;
    if (renderSignature === lastGridRender) return;
    setLastGridRender(renderSignature);

    // Set canvas size to match full grid size for proper coordinate mapping
    const gridWidth = gridData.width * cellSize;
    const gridHeight = gridData.height * cellSize;
    
    canvas.width = gridWidth;
    canvas.height = gridHeight;

    // Clear canvas with solid background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, gridWidth, gridHeight);

    // Calculate visible range with buffer for smooth scrolling
    const viewportWidth = containerSize.width || 800;
    const viewportHeight = containerSize.height || 600;
    const buffer = Math.ceil(Math.max(viewportWidth, viewportHeight) / cellSize * 0.1); // 10% buffer
    
    const startX = Math.max(0, Math.floor(scrollPosition.x / cellSize) - buffer);
    const endX = Math.min(gridData.width - 1, Math.ceil((scrollPosition.x + viewportWidth) / cellSize) + buffer);
    const startY = Math.max(0, Math.floor(scrollPosition.y / cellSize) - buffer);
    const endY = Math.min(gridData.height - 1, Math.ceil((scrollPosition.y + viewportHeight) / cellSize) + buffer);

    // Batch similar operations for better performance
    const pixelsToDraw: Array<{x: number, y: number, color: string, modified: boolean}> = [];
    
    // Collect all pixels to draw
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (!gridData.pixels[y] || !gridData.pixels[y][x]) continue;

        const pixel = gridData.pixels[y][x];
        const { rgba } = pixel;
        
        pixelsToDraw.push({
          x,
          y,
          color: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
          modified: pixel.modified || false
        });
      }
    }

    // Draw all pixels in batches
    pixelsToDraw.forEach(({x, y, color, modified}) => {
      const canvasX = x * cellSize;
      const canvasY = y * cellSize;

      // Fill pixel color
      ctx.fillStyle = color;
      ctx.fillRect(canvasX, canvasY, cellSize, cellSize);

      // Draw border only if necessary (for larger cells or modified pixels)
      if (cellSize > 3 || modified) {
        ctx.strokeStyle = modified ? '#ffc107' : '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);
      }
    });

    // Only draw text for larger cells to avoid clutter
    if (cellSize >= 8) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      pixelsToDraw.forEach(({x, y}) => {
        const pixel = gridData.pixels[y][x];
        const { rgba } = pixel;
        const canvasX = x * cellSize;
        const canvasY = y * cellSize;
        
        // Draw RGB text for larger cells
        if (cellSize >= 25) {
          const brightness = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
          ctx.fillStyle = brightness > 128 ? '#000000' : '#FFFFFF';
          ctx.font = `bold ${Math.max(8, cellSize / 8)}px monospace`;
          
          const centerX = canvasX + cellSize / 2;
          const textY = canvasY + cellSize / 3.5;
          
          ctx.fillText(`R:${rgba.r}`, centerX, textY);
          ctx.fillText(`G:${rgba.g}`, centerX, textY + cellSize / 3.5);
          ctx.fillText(`B:${rgba.b}`, centerX, textY + (cellSize / 3.5) * 2);
        } else if (cellSize >= 8) {
          const brightness = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
          ctx.fillStyle = brightness > 128 ? '#000000' : '#FFFFFF';
          ctx.font = `bold ${Math.max(6, cellSize / 10)}px monospace`;
          
          ctx.fillText(`${rgba.r},${rgba.g},${rgba.b}`, canvasX + cellSize / 2, canvasY + cellSize / 2);
        }
      });
    }
  }, [gridData, cellSize, scrollPosition, containerSize, lastGridRender, setLastGridRender]);

  // Separate effect for hover and selection highlights (no full redraw)
  useEffect(() => {
    if (!gridData || !overlayCanvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas.getContext('2d', { alpha: true });
    if (!overlayCtx) return;

    // Set overlay canvas size to match main canvas
    const gridWidth = gridData.width * cellSize;
    const gridHeight = gridData.height * cellSize;
    
    overlayCanvas.width = gridWidth;
    overlayCanvas.height = gridHeight;

    // Clear overlay
    overlayCtx.clearRect(0, 0, gridWidth, gridHeight);

    // Draw selected pixel highlight
    if (selectedPixel && selectedPixel.x >= 0 && selectedPixel.x < gridData.width && 
        selectedPixel.y >= 0 && selectedPixel.y < gridData.height) {
      const canvasX = selectedPixel.x * cellSize;
      const canvasY = selectedPixel.y * cellSize;
      
      overlayCtx.strokeStyle = '#007bff';
      overlayCtx.lineWidth = 3;
      overlayCtx.strokeRect(canvasX, canvasY, cellSize, cellSize);
    }

    // Draw hovered pixel highlight
    if (hoveredPixel && hoveredPixel.x >= 0 && hoveredPixel.x < gridData.width && 
        hoveredPixel.y >= 0 && hoveredPixel.y < gridData.height) {
      const canvasX = hoveredPixel.x * cellSize;
      const canvasY = hoveredPixel.y * cellSize;
      
      overlayCtx.strokeStyle = '#28a745';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(canvasX, canvasY, cellSize, cellSize);
    }
  }, [gridData, cellSize, selectedPixel, hoveredPixel]);

  // Handle mouse click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor(mouseX / cellSize);
    const gridY = Math.floor(mouseY / cellSize);

    if (gridX >= 0 && gridX < gridData.width && gridY >= 0 && gridY < gridData.height) {
      onPixelClick({ x: gridX, y: gridY });
    }
  }, [gridData, cellSize, onPixelClick]);

  // Handle mouse move with throttling for better performance
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !overlayCanvasRef.current) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor(mouseX / cellSize);
    const gridY = Math.floor(mouseY / cellSize);

    if (gridX >= 0 && gridX < gridData.width && gridY >= 0 && gridY < gridData.height) {
      // Only update if hover position actually changed
      if (!hoveredPixel || hoveredPixel.x !== gridX || hoveredPixel.y !== gridY) {
        setHoveredPixel({ x: gridX, y: gridY });
      }
    } else if (hoveredPixel) {
      setHoveredPixel(null);
    }
  }, [gridData, cellSize, hoveredPixel]);

  // Handle mouse leave
  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredPixel(null);
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    onScrollChange({
      x: target.scrollLeft,
      y: target.scrollTop,
    });
  }, [onScrollChange]);

  if (!gridData) {
    return (
      <div className="pixel-grid-container">
        <div className="pixel-grid-placeholder">
          <p>No image loaded. Please upload an image to start editing.</p>
        </div>
      </div>
    );
  }

  const gridWidth = gridData.width * cellSize;
  const gridHeight = gridData.height * cellSize;

  return (
    <>
      <div className="canvas-mode-badge">
        🚀 Canvas Mode - Dual Layer (Anti-Blink) 
        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
          Grid: {gridData.width}×{gridData.height} | No more hover blinking!
        </div>
        {gridData.width * gridData.height > 100000 && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            💡 Tip: Zoom in untuk detail yang lebih baik, zoom out untuk overview
          </div>
        )}
        
        {/* Grid Info - Moved outside of grid container */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          fontSize: '12px', 
          color: '#555',
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          flexWrap: 'wrap'
        }}>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
          <span>Grid: {gridData.width}×{gridData.height}</span>
          <span>Cell Size: {cellSize}px</span>
          {selectedPixel && (
            <span style={{ color: '#007bff', fontWeight: 'bold' }}>
              Selected: ({selectedPixel.x}, {selectedPixel.y})
            </span>
          )}
          {hoveredPixel && (
            <span style={{ color: '#28a745' }}>
              Hover: ({hoveredPixel.x}, {hoveredPixel.y})
            </span>
          )}
        </div>
      </div>
      
      <div className="pixel-grid-container">
      
      <div
        ref={containerRef}
        className="pixel-grid-scroll-container"
        onScroll={handleScroll}
      >
        <div
          style={{
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            position: 'relative',
          }}
        >
          {/* Main grid canvas - redraws only when grid changes */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />
          {/* Overlay canvas for hover/selection - redraws only for interactions */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'pointer',
              zIndex: 2,
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default PixelGridCanvas;
