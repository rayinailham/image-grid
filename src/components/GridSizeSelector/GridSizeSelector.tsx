import React from 'react';
import { AVAILABLE_GRID_SIZES, GridSize } from '@/types';
import './GridSizeSelector.css';

interface GridSizeSelectorProps {
  selectedSize: GridSize;
  onSizeChange: (size: GridSize) => void;
  disabled?: boolean;
}

const GridSizeSelector: React.FC<GridSizeSelectorProps> = ({
  selectedSize,
  onSizeChange,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(event.target.value) as GridSize;
    onSizeChange(size);
  };

  return (
    <div className="grid-size-selector">
      <label htmlFor="grid-size-select">Grid Size:</label>
      <select
        id="grid-size-select"
        value={selectedSize}
        onChange={handleChange}
        disabled={disabled}
        className="grid-size-select"
      >
        {AVAILABLE_GRID_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}×{size}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GridSizeSelector;
