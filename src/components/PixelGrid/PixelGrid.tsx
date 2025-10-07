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

  return (
    <div
      className="pixel-cell"
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-x={pixel.x}
      data-y={pixel.y}
    />
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
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate cell size based on zoom level
  const cellSize = useMemo(() => {
    const baseSize = 4; // Base pixel size in pixels
    return Math.max(1, Math.floor(baseSize * zoomLevel));
  }, [zoomLevel]);

  // Calculate grid dimensions
  const gridWidth = useMemo(() => 500 * cellSize, [cellSize]);
  const gridHeight = useMemo(() => 500 * cellSize, [cellSize]);

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

    const container = scrollContainerRef.current;
    if (!container) return [];

    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    
    const startX = Math.max(0, Math.floor(scrollPosition.x / cellSize));
    const endX = Math.min(499, Math.ceil((scrollPosition.x + viewportWidth) / cellSize));
    const startY = Math.max(0, Math.floor(scrollPosition.y / cellSize));
    const endY = Math.min(499, Math.ceil((scrollPosition.y + viewportHeight) / cellSize));

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
  }, [gridData, cellSize, scrollPosition]);

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
        <span>Grid: 500×500</span>
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