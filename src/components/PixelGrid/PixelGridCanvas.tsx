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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPixel, setHoveredPixel] = useState<GridPosition | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Calculate cell size based on zoom level and grid size
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
    } else {
      baseSize = 2;
    }
    
    return Math.max(1, Math.floor(baseSize * zoomLevel));
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

  // Draw grid on canvas
  useEffect(() => {
    if (!gridData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size to match viewport
    const viewportWidth = containerSize.width || 800;
    const viewportHeight = containerSize.height || 600;
    
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Calculate visible range
    const startX = Math.max(0, Math.floor(scrollPosition.x / cellSize));
    const endX = Math.min(gridData.width - 1, Math.ceil((scrollPosition.x + viewportWidth) / cellSize) + 1);
    const startY = Math.max(0, Math.floor(scrollPosition.y / cellSize));
    const endY = Math.min(gridData.height - 1, Math.ceil((scrollPosition.y + viewportHeight) / cellSize) + 1);

    // Draw pixels
    const offsetX = scrollPosition.x % cellSize;
    const offsetY = scrollPosition.y % cellSize;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (!gridData.pixels[y] || !gridData.pixels[y][x]) continue;

        const pixel = gridData.pixels[y][x];
        const { rgba } = pixel;
        
        const canvasX = (x - startX) * cellSize - offsetX;
        const canvasY = (y - startY) * cellSize - offsetY;

        // Fill pixel color
        ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
        ctx.fillRect(canvasX, canvasY, cellSize, cellSize);

        // Draw border
        ctx.strokeStyle = pixel.modified ? '#ffc107' : '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);

        // Draw RGB text for larger cells
        if (cellSize >= 25) {
          const brightness = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
          ctx.fillStyle = brightness > 128 ? '#000000' : '#FFFFFF';
          ctx.font = `bold ${Math.max(8, cellSize / 8)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const centerX = canvasX + cellSize / 2;
          const textY = canvasY + cellSize / 3.5;
          
          ctx.fillText(`R:${rgba.r}`, centerX, textY);
          ctx.fillText(`G:${rgba.g}`, centerX, textY + cellSize / 3.5);
          ctx.fillText(`B:${rgba.b}`, centerX, textY + (cellSize / 3.5) * 2);
        } else if (cellSize >= 8) {
          const brightness = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
          ctx.fillStyle = brightness > 128 ? '#000000' : '#FFFFFF';
          ctx.font = `bold ${Math.max(6, cellSize / 10)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.fillText(`${rgba.r},${rgba.g},${rgba.b}`, canvasX + cellSize / 2, canvasY + cellSize / 2);
        }
      }
    }

    // Draw selected pixel highlight
    if (selectedPixel && selectedPixel.x >= startX && selectedPixel.x <= endX && 
        selectedPixel.y >= startY && selectedPixel.y <= endY) {
      const canvasX = (selectedPixel.x - startX) * cellSize - offsetX;
      const canvasY = (selectedPixel.y - startY) * cellSize - offsetY;
      
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);
    }

    // Draw hovered pixel highlight
    if (hoveredPixel && hoveredPixel.x >= startX && hoveredPixel.x <= endX && 
        hoveredPixel.y >= startY && hoveredPixel.y <= endY) {
      const canvasX = (hoveredPixel.x - startX) * cellSize - offsetX;
      const canvasY = (hoveredPixel.y - startY) * cellSize - offsetY;
      
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 1;
      ctx.strokeRect(canvasX, canvasY, cellSize, cellSize);
    }
  }, [gridData, cellSize, scrollPosition, containerSize, selectedPixel, hoveredPixel]);

  // Handle mouse click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + scrollPosition.x;
    const mouseY = e.clientY - rect.top + scrollPosition.y;

    const gridX = Math.floor(mouseX / cellSize);
    const gridY = Math.floor(mouseY / cellSize);

    if (gridX >= 0 && gridX < gridData.width && gridY >= 0 && gridY < gridData.height) {
      onPixelClick({ x: gridX, y: gridY });
    }
  }, [gridData, cellSize, scrollPosition, onPixelClick]);

  // Handle mouse move
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + scrollPosition.x;
    const mouseY = e.clientY - rect.top + scrollPosition.y;

    const gridX = Math.floor(mouseX / cellSize);
    const gridY = Math.floor(mouseY / cellSize);

    if (gridX >= 0 && gridX < gridData.width && gridY >= 0 && gridY < gridData.height) {
      setHoveredPixel({ x: gridX, y: gridY });
    } else {
      setHoveredPixel(null);
    }
  }, [gridData, cellSize, scrollPosition]);

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
    <div className="pixel-grid-container">
      <div className="pixel-grid-info">
        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        <span>Grid: {gridData.width}×{gridData.height}</span>
        {selectedPixel && (
          <span>
            Selected: ({selectedPixel.x}, {selectedPixel.y})
          </span>
        )}
        {hoveredPixel && (
          <span>
            Hover: ({hoveredPixel.x}, {hoveredPixel.y})
          </span>
        )}
        <span className="canvas-mode-badge">🚀 Canvas Mode (Fast)</span>
      </div>
      
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
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'pointer',
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>
      </div>
    </div>
  );
};

export default PixelGridCanvas;
