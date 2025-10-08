import React, { useCallback, useMemo, useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { RGBAColor } from '@/types';
import './ColorPicker.css';

interface ColorPickerProps {
  currentColor: RGBAColor;
  onColorChange: (color: RGBAColor) => void;
  disabled?: boolean;
  showPalette?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  disabled = false,
  showPalette = true,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Convert RGBAColor to react-color format
  const reactColorValue = useMemo(() => ({
    r: currentColor.r,
    g: currentColor.g,
    b: currentColor.b,
    a: currentColor.a,
  }), [currentColor]);

  // Handle color change from react-color picker
  const handleColorChange = useCallback((color: ColorResult) => {
    const newColor: RGBAColor = {
      r: Math.round(color.rgb.r),
      g: Math.round(color.rgb.g),
      b: Math.round(color.rgb.b),
      a: color.rgb.a || 1,
    };
    console.log('[ColorPicker] handleColorChange', newColor);
    onColorChange(newColor);
  }, [onColorChange]);

  // Toggle picker visibility
  const togglePicker = useCallback(() => {
    if (!disabled) {
      setIsPickerOpen(!isPickerOpen);
    }
  }, [disabled, isPickerOpen]);

  // Close picker when clicking outside
  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  // Format color for display
  const colorDisplayValue = useMemo(() => 
    `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${currentColor.a.toFixed(2)})`,
    [currentColor]
  );

  const hexDisplayValue = useMemo(() => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(currentColor.r)}${toHex(currentColor.g)}${toHex(currentColor.b)}`;
  }, [currentColor]);

  // Predefined color palette for quick selection
  const colorPalette = useMemo(() => [
    { r: 255, g: 255, b: 255, a: 1 }, // White
    { r: 0, g: 0, b: 0, a: 1 },       // Black
    { r: 255, g: 0, b: 0, a: 1 },     // Red
    { r: 0, g: 255, b: 0, a: 1 },     // Green
    { r: 0, g: 0, b: 255, a: 1 },     // Blue
    { r: 255, g: 255, b: 0, a: 1 },   // Yellow
    { r: 255, g: 0, b: 255, a: 1 },   // Magenta
    { r: 0, g: 255, b: 255, a: 1 },   // Cyan
    { r: 128, g: 128, b: 128, a: 1 }, // Gray
    { r: 255, g: 165, b: 0, a: 1 },   // Orange
    { r: 128, g: 0, b: 128, a: 1 },   // Purple
    { r: 165, g: 42, b: 42, a: 1 },   // Brown
  ], []);

  return (
    <div className="color-picker-container">
      <div className="color-picker-header">
        <h3>Color Picker</h3>
      </div>

      {/* Current Color Display */}
      <div className="current-color-section">
        <div className="current-color-label">Current Color:</div>
        <div className="current-color-display">
          <div 
            className={`current-color-swatch ${disabled ? 'disabled' : ''}`}
            style={{ backgroundColor: colorDisplayValue }}
            onClick={togglePicker}
            title={colorDisplayValue}
          />
          <div className="current-color-info">
            <div className="color-value">{hexDisplayValue}</div>
            <div className="color-value-small">{colorDisplayValue}</div>
          </div>
        </div>
      </div>

      {/* Quick Color Palette */}
      {showPalette && (
        <div className="color-palette-section">
          <div className="color-palette-label">Quick Colors:</div>
          <div className="color-palette">
            {colorPalette.map((color, index) => (
              <div
                key={index}
                className="palette-color"
                style={{
                  backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                }}
                onClick={() => {
                  if (!disabled) {
                    console.log('[ColorPicker] Quick palette color selected', color);
                    onColorChange(color);
                  }
                }}
                title={`RGB(${color.r}, ${color.g}, ${color.b})`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Picker Popup */}
      {isPickerOpen && (
        <div className="color-picker-overlay" onClick={closePicker}>
          <div className="color-picker-popup" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-header">
              <span>Choose Color</span>
              <button 
                className="close-button"
                onClick={closePicker}
                type="button"
              >
                ×
              </button>
            </div>
            <SketchPicker
              color={reactColorValue}
              onChange={handleColorChange}
              disableAlpha={false}
              presetColors={colorPalette.map(color => 
                `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
              )}
            />
          </div>
        </div>
      )}

      {/* Color Information Panel */}
      <div className="color-info-section">
        <div className="color-info-row">
          <span className="color-info-label">R:</span>
          <span className="color-info-value">{currentColor.r}</span>
        </div>
        <div className="color-info-row">
          <span className="color-info-label">G:</span>
          <span className="color-info-value">{currentColor.g}</span>
        </div>
        <div className="color-info-row">
          <span className="color-info-label">B:</span>
          <span className="color-info-value">{currentColor.b}</span>
        </div>
        <div className="color-info-row">
          <span className="color-info-label">A:</span>
          <span className="color-info-value">{currentColor.a.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;