import React, { useCallback, useState } from 'react';
import Layout from '@/components/Layout';
import ImageUploader from '@/components/ImageUploader';
import ImageCanvas from '@/components/ImageCanvas';
import PixelGrid from '@/components/PixelGrid';
import PixelGridCanvas from '@/components/PixelGrid/PixelGridCanvas';
import ColorPicker from '@/components/ColorPicker';
import GridSizeSelector from '@/components/GridSizeSelector';
import RGBATable from '@/components/RGBATable';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { usePixelGrid } from '@/hooks/usePixelGrid';
import { RGBAColor, GridSize, GRID_SIZE } from '@/types';
import './App.css';

const App: React.FC = () => {
  const {
    processing,
    imageData,
    gridData,
    error,
    processImage,
    clearError,
  } = useImageProcessor();

  const {
    gridData: pixelGridData,
    selectedPixel,
    zoomLevel,
    scrollPosition,
    setGridData,
    updatePixel,
    selectPixel,
    setZoomLevel,
    setScrollPosition,
    selectedPixelData,
  } = usePixelGrid();

  // Current color for the color picker - default to white
  const [currentColor, setCurrentColor] = useState<RGBAColor>({ r: 255, g: 255, b: 255, a: 1 });
  
  // Grid size state
  const [selectedGridSize, setSelectedGridSize] = useState<GridSize>(GRID_SIZE as GridSize);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setCurrentFile(file);
    await processImage(file, selectedGridSize);
  }, [processImage, selectedGridSize]);

  // Handle pixel click - select pixel and update current color
  const handlePixelClick = useCallback((position: { x: number; y: number }) => {
    selectPixel(position);
    // Update current color to selected pixel's color
    if (pixelGridData && pixelGridData.pixels[position.y] && pixelGridData.pixels[position.y][position.x]) {
      const pixelColor = pixelGridData.pixels[position.y][position.x].rgba;
      setCurrentColor(pixelColor);
    }
  }, [selectPixel, pixelGridData, setCurrentColor]);

  // Handle color change from color picker
  const handleColorChange = useCallback((color: RGBAColor) => {
    setCurrentColor(color);
    // If a pixel is selected, update it with the new color
    if (selectedPixel) {
      updatePixel(selectedPixel.x, selectedPixel.y, color);
    }
  }, [setCurrentColor, selectedPixel, updatePixel]);

  // Handle pixel update (when clicking on grid with current color)
  const handlePixelUpdate = useCallback((x: number, y: number, rgba: RGBAColor) => {
    updatePixel(x, y, rgba);
  }, [updatePixel]);

  // Handle scroll position changes
  const handleScrollChange = useCallback((position: { x: number; y: number }) => {
    setScrollPosition(position);
  }, [setScrollPosition]);

  // Handle grid size change
  const handleGridSizeChange = useCallback(async (newSize: GridSize) => {
    setSelectedGridSize(newSize);
    // Reprocess current image with new grid size if an image is loaded
    if (currentFile) {
      await processImage(currentFile, newSize);
    }
  }, [currentFile, processImage]);

  // Update grid data when image processing completes
  React.useEffect(() => {
    if (gridData) {
      setGridData(gridData);
    }
  }, [gridData, setGridData]);

  return (
    <Layout>
      <div className="app-content">
        {!imageData ? (
          <div className="upload-section">
            <div className="upload-controls">
              <GridSizeSelector
                selectedSize={selectedGridSize}
                onSizeChange={handleGridSizeChange}
                disabled={processing}
              />
            </div>
            <ImageUploader
              onImageUpload={handleImageUpload}
              processing={processing}
              error={error?.message || null}
              onClearError={clearError}
            />
          </div>
        ) : (
          <div className="editor-section">
            <div className="editor-header">
              <h2>Image Editor</h2>
              <div className="editor-controls">
                <GridSizeSelector
                  selectedSize={selectedGridSize}
                  onSizeChange={handleGridSizeChange}
                  disabled={processing}
                />
                <div className="zoom-controls">
                  <button 
                    onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
                    disabled={zoomLevel <= 0.25}
                  >
                    Zoom Out
                  </button>
                  <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                  <button 
                    onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}
                    disabled={zoomLevel >= 4}
                  >
                    Zoom In
                  </button>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="new-image-btn"
                >
                  Load New Image
                </button>
              </div>
            </div>
            
            <div className="editor-workspace">
              <div className="image-panel">
                <h3>Original Image</h3>
                <ImageCanvas imageData={imageData} />
                
                <div className="image-info">
                  <p>
                    <strong>Dimensions:</strong> {imageData.width} × {imageData.height}
                  </p>
                  <p>
                    <strong>File:</strong> {imageData.file?.name}
                  </p>
                  <p>
                    <strong>Size:</strong> {imageData.file ? 
                      `${(imageData.file.size / (1024 * 1024)).toFixed(2)} MB` : 
                      'Unknown'
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid-panel">
                <h3>Pixel Grid Editor ({selectedGridSize}×{selectedGridSize})</h3>
                {/* Use Canvas mode for large grids (>100x100) for better performance */}
                {pixelGridData && pixelGridData.width > 100 ? (
                  <PixelGridCanvas
                    gridData={pixelGridData}
                    selectedPixel={selectedPixel}
                    onPixelClick={handlePixelClick}
                    onPixelUpdate={handlePixelUpdate}
                    zoomLevel={zoomLevel}
                    scrollPosition={scrollPosition}
                    onScrollChange={handleScrollChange}
                  />
                ) : (
                  <PixelGrid
                    gridData={pixelGridData}
                    selectedPixel={selectedPixel}
                    onPixelClick={handlePixelClick}
                    onPixelUpdate={handlePixelUpdate}
                    zoomLevel={zoomLevel}
                    scrollPosition={scrollPosition}
                    onScrollChange={handleScrollChange}
                  />
                )}
              </div>

              <div className="color-panel">
                <ColorPicker
                  currentColor={currentColor}
                  onColorChange={handleColorChange}
                  disabled={!selectedPixel}
                />
                
                {selectedPixelData && (
                  <div className="pixel-info">
                    <h4>Selected Pixel Info</h4>
                    <p><strong>Position:</strong> ({selectedPixelData.x}, {selectedPixelData.y})</p>
                    <p><strong>Color:</strong> rgba({selectedPixelData.rgba.r}, {selectedPixelData.rgba.g}, {selectedPixelData.rgba.b}, {selectedPixelData.rgba.a.toFixed(2)})</p>
                    <p><strong>Modified:</strong> {selectedPixelData.modified ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* RGBA Table Section */}
            <RGBATable gridData={pixelGridData} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;