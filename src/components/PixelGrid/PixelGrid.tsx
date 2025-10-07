import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { GridData, GridPosition, RGBAColor, PixelState } from '@/types';
import './PixelGrid.css';

interface PixelGridProps {
  gridData: GridData | null;
  selectedPixel: GridPosition | null;
  onPixelClick: (position: GridPosition) => void;
  onPixelUpdate: (x: number, y: number, rgba: RGBAColor) => void;
  zoomLevel: number;
  scrollPosition: { x: number; y: number };
  onScrollChange: (position: { x: number; y: number }) => void;
}

interface PixelCellProps {
  pixel: PixelState;
  isSelected: boolean;
  isHovered: boolean;
  cellSize: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PixelCell: React.FC<PixelCellProps> = ({
  pixel,
  isSelected,
  isHovered,
  cellSize,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { rgba, modified } = pixel;
  
  const style = useMemo(() => ({
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    backgroundColor: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
    border: isSelected ? '2px solid #007bff' : 
            isHovered ? '1px solid #28a745' :
            modified ? '1px solid #ffc107' : '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'border-color 0.1s ease',
  }), [rgba, isSelected, isHovered, modified, cellSize]);

  // Show RGB values if cell is large enough
  // For very small cells (< 15px), don't show text
  // For medium cells (15-40px), show compact format
  // For large cells (>= 40px), show full format
  const showRgbText = cellSize >= 15;
  const useCompactFormat = cellSize < 40;
  
  // Calculate text color for contrast
  const brightness = (rgba.r * 299 + rgba.g * 587 + rgba.b * 114) / 1000;
  const textColor = brightness > 128 ? '#000000' : '#FFFFFF';
  
  const textStyle = useMemo(() => ({
    fontSize: `${Math.max(6, cellSize / (useCompactFormat ? 10 : 8))}px`,
    color: textColor,
    textAlign: 'center' as const,
    lineHeight: useCompactFormat ? `${cellSize / 4}px` : `${cellSize / 3.5}px`,
    padding: '1px',
    fontFamily: 'monospace',
    fontWeight: 'bold' as const,
    textShadow: brightness > 128 
      ? '0 0 2px rgba(255, 255, 255, 0.8)' 
      : '0 0 2px rgba(0, 0, 0, 0.8)',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  }), [cellSize, textColor, brightness, useCompactFormat]);

  return (
    <div
      className="pixel-cell"
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-x={pixel.x}
      data-y={pixel.y}
    >
      {showRgbText && (
        <div style={textStyle}>
          {useCompactFormat ? (
            // Compact format for smaller cells: show as "R,G,B"
            <div>{rgba.r},{rgba.g},{rgba.b}</div>
          ) : (
            // Full format for larger cells: show each value on separate line
            <>
              <div>R:{rgba.r}</div>
              <div>G:{rgba.g}</div>
              <div>B:{rgba.b}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const PixelGrid: React.FC<PixelGridProps> = ({
  gridData,
  selectedPixel,
  onPixelClick,
  zoomLevel,
  scrollPosition,
  onScrollChange,
}) => {
  const [hoveredPixel, setHoveredPixel] = useState<GridPosition | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate cell size based on zoom level
  const cellSize = useMemo(() => {
    const baseSize = 30; // Base pixel size in pixels (increased for 20x20 grid)
    return Math.max(15, Math.floor(baseSize * zoomLevel));
  }, [zoomLevel]);

  // Calculate grid dimensions (20x20 grid)
  const gridWidth = useMemo(() => 20 * cellSize, [cellSize]);
  const gridHeight = useMemo(() => 20 * cellSize, [cellSize]);

  // Update container dimensions when mounted or gridData changes
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollContainerRef.current) {
        setContainerDimensions({
          width: scrollContainerRef.current.clientWidth,
          height: scrollContainerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    
    // Also update dimensions after a short delay to ensure layout is complete
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [gridData]);

  // Handle scroll changes
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    onScrollChange({
      x: target.scrollLeft,
      y: target.scrollTop,
    });
  }, [onScrollChange]);

  // Sync scroll position
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollPosition.x;
      scrollContainerRef.current.scrollTop = scrollPosition.y;
    }
  }, [scrollPosition]);

  const handlePixelClick = useCallback((x: number, y: number) => {
    onPixelClick({ x, y });
  }, [onPixelClick]);

  const handlePixelHover = useCallback((x: number, y: number) => {
    setHoveredPixel({ x, y });
  }, []);

  const handlePixelLeave = useCallback(() => {
    setHoveredPixel(null);
  }, []);

  // Virtualization: Only render visible pixels
  const visiblePixels = useMemo(() => {
    if (!gridData || cellSize < 1) return [];

    // Use containerDimensions state instead of directly accessing DOM
    const viewportWidth = containerDimensions.width || 800; // Fallback to reasonable default
    const viewportHeight = containerDimensions.height || 600;
    
    // If dimensions are still 0, render all pixels (failsafe)
    if (viewportWidth === 0 && viewportHeight === 0) {
      const pixels: Array<{
        pixel: PixelState;
        x: number;
        y: number;
        left: number;
        top: number;
      }> = [];

      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
          if (gridData.pixels[y] && gridData.pixels[y][x]) {
            pixels.push({
              pixel: gridData.pixels[y][x],
              x,
              y,
              left: x * cellSize,
              top: y * cellSize,
            });
          }
        }
      }
      return pixels;
    }
    
    const startX = Math.max(0, Math.floor(scrollPosition.x / cellSize));
    const endX = Math.min(19, Math.ceil((scrollPosition.x + viewportWidth) / cellSize));
    const startY = Math.max(0, Math.floor(scrollPosition.y / cellSize));
    const endY = Math.min(19, Math.ceil((scrollPosition.y + viewportHeight) / cellSize));

    const pixels: Array<{
      pixel: PixelState;
      x: number;
      y: number;
      left: number;
      top: number;
    }> = [];

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (gridData.pixels[y] && gridData.pixels[y][x]) {
          pixels.push({
            pixel: gridData.pixels[y][x],
            x,
            y,
            left: x * cellSize,
            top: y * cellSize,
          });
        }
      }
    }

    return pixels;
  }, [gridData, cellSize, scrollPosition, containerDimensions]);

  if (!gridData) {
    return (
      <div className="pixel-grid-container">
        <div className="pixel-grid-placeholder">
          <p>No image loaded. Please upload an image to start editing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-grid-container">
      <div className="pixel-grid-info">
        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        <span>Grid: 20×20</span>
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
      </div>
      
      <div
        ref={scrollContainerRef}
        className="pixel-grid-scroll-container"
        onScroll={handleScroll}
      >
        <div
          ref={gridRef}
          className="pixel-grid"
          style={{
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            position: 'relative',
          }}
        >
          {visiblePixels.map(({ pixel, x, y, left, top }) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
              }}
            >
              <PixelCell
                pixel={pixel}
                isSelected={selectedPixel?.x === x && selectedPixel?.y === y}
                isHovered={hoveredPixel?.x === x && hoveredPixel?.y === y}
                cellSize={cellSize}
                onClick={() => handlePixelClick(x, y)}
                onMouseEnter={() => handlePixelHover(x, y)}
                onMouseLeave={handlePixelLeave}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PixelGrid;