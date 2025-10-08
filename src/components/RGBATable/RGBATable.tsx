import React, { useMemo, useState } from 'react';
import { GridData, RGBAColor } from '@/types';
import './RGBATable.css';

interface RGBATableProps {
  gridData: GridData | null;
  maxDisplayRows?: number;
}

interface TableRow {
  position: string;
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  hexColor: string;
  modified: boolean;
}

const RGBATable: React.FC<RGBATableProps> = ({ 
  gridData, 
  maxDisplayRows = 100 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(maxDisplayRows);
  const [sortField, setSortField] = useState<keyof TableRow>('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterModified, setFilterModified] = useState(false);

  // Convert RGBA to hex color
  const rgbaToHex = (rgba: RGBAColor): string => {
    const toHex = (value: number) => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  // Flatten grid data to table rows
  const tableData = useMemo(() => {
    if (!gridData) return [];

    const rows: TableRow[] = [];
    
    for (let y = 0; y < gridData.height; y++) {
      for (let x = 0; x < gridData.width; x++) {
        const pixel = gridData.pixels[y]?.[x];
        if (pixel) {
          rows.push({
            position: `(${x}, ${y})`,
            x,
            y,
            r: pixel.rgba.r,
            g: pixel.rgba.g,
            b: pixel.rgba.b,
            a: pixel.rgba.a,
            hexColor: rgbaToHex(pixel.rgba),
            modified: pixel.modified
          });
        }
      }
    }

    return rows;
  }, [gridData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData;
    
    // Apply modified filter
    if (filterModified) {
      filtered = filtered.filter(row => row.modified);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue);
      const bStr = String(bValue);
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [tableData, sortField, sortDirection, filterModified]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: keyof TableRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export functions
  const exportToCSV = () => {
    if (!filteredAndSortedData.length) return;

    const headers = ['Position', 'X', 'Y', 'Red', 'Green', 'Blue', 'Alpha', 'Hex Color', 'Modified'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(row => 
        [row.position, row.x, row.y, row.r, row.g, row.b, row.a, row.hexColor, row.modified].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rgba-mapping.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!filteredAndSortedData.length) return;

    const jsonContent = JSON.stringify(filteredAndSortedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rgba-mapping.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!gridData) {
    return (
      <div className="rgba-table-container">
        <div className="rgba-table-empty">
          <p>Tidak ada data grid untuk ditampilkan. Silakan upload gambar terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rgba-table-container">
      <div className="rgba-table-header">
        <h3>Tabel Mapping RGBA</h3>
        <div className="rgba-table-stats">
          <span>Total Pixel: {tableData.length}</span>
          <span>Modified: {tableData.filter(row => row.modified).length}</span>
          <span>Menampilkan: {paginatedData.length} dari {filteredAndSortedData.length}</span>
        </div>
      </div>

      <div className="rgba-table-controls">
        <div className="filter-controls">
          <label>
            <input
              type="checkbox"
              checked={filterModified}
              onChange={(e) => setFilterModified(e.target.checked)}
            />
            Tampilkan hanya pixel yang dimodifikasi
          </label>
        </div>
        
        <div className="export-controls">
          <button onClick={exportToCSV} className="export-btn">
            Export CSV
          </button>
          <button onClick={exportToJSON} className="export-btn">
            Export JSON
          </button>
        </div>
      </div>

      <div className="rgba-table-wrapper">
        <table className="rgba-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('position')} className="sortable">
                Posisi {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('x')} className="sortable">
                X {sortField === 'x' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('y')} className="sortable">
                Y {sortField === 'y' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('r')} className="sortable">
                Red {sortField === 'r' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('g')} className="sortable">
                Green {sortField === 'g' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('b')} className="sortable">
                Blue {sortField === 'b' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('a')} className="sortable">
                Alpha {sortField === 'a' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Color Preview</th>
              <th onClick={() => handleSort('hexColor')} className="sortable">
                Hex {sortField === 'hexColor' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('modified')} className="sortable">
                Modified {sortField === 'modified' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={`${row.x}-${row.y}`} className={row.modified ? 'modified' : ''}>
                <td>{row.position}</td>
                <td>{row.x}</td>
                <td>{row.y}</td>
                <td>{row.r}</td>
                <td>{row.g}</td>
                <td>{row.b}</td>
                <td>{(row.a * 100).toFixed(1)}%</td>
                <td>
                  <div 
                    className="color-preview"
                    style={{ 
                      backgroundColor: `rgba(${row.r}, ${row.g}, ${row.b}, ${row.a})`,
                      border: row.a < 1 ? '1px solid #ccc' : 'none'
                    }}
                  ></div>
                </td>
                <td>{row.hexColor}</td>
                <td>
                  <span className={`status-badge ${row.modified ? 'modified' : 'original'}`}>
                    {row.modified ? '✓' : '○'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="rgba-table-pagination">
          <button 
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
          >
            First
          </button>
          <button 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Next
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default RGBATable;