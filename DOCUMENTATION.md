# Dokumentasi Image Grid Editor

## Daftar Isi
1. [Overview](#overview)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Cara Kerja Pixel Grid Editor](#cara-kerja-pixel-grid-editor)
4. [Cara Kerja RGBA Table](#cara-kerja-rgba-table)
5. [Komponen Utama](#komponen-utama)
6. [Hooks dan State Management](#hooks-dan-state-management)
7. [Utils dan Image Processing](#utils-dan-image-processing)
8. [Fitur-Fitur Utama](#fitur-fitur-utama)
9. [Contoh Penggunaan](#contoh-penggunaan)

## Overview

Image Grid Editor adalah aplikasi web React yang memungkinkan pengguna untuk:
- Upload gambar dalam format JPEG, PNG, atau WebP
- Mengkonversi gambar menjadi grid pixel dengan ukuran yang dapat dipilih
- Mengedit pixel secara individual menggunakan color picker
- Melihat dan menganalisis data pixel dalam format tabel
- Mengekspor data pixel ke file CSV atau JSON

### Teknologi yang Digunakan
- **Frontend**: React 18 dengan TypeScript
- **Styling**: CSS Modules
- **Build Tool**: Vite
- **Testing**: Jest + Vitest
- **Image Processing**: HTML5 Canvas API

## Arsitektur Sistem

```
src/
├── components/           # Komponen UI React
│   ├── ImageUploader/   # Upload dan validasi gambar
│   ├── ImageCanvas/     # Menampilkan gambar asli
│   ├── PixelGrid/       # Editor grid pixel (DOM mode)
│   ├── PixelGridCanvas/ # Editor grid pixel (Canvas mode)
│   ├── ColorPicker/     # Pemilih warna RGBA
│   ├── GridSizeSelector/# Pemilih ukuran grid
│   ├── RGBATable/       # Tabel data pixel
│   └── Layout/          # Layout aplikasi
├── hooks/               # Custom React hooks
│   ├── useImageProcessor.ts  # Processing gambar
│   ├── usePixelGrid.ts      # State management grid
│   └── useColorManagement.ts # Management warna
├── utils/               # Utility functions
│   ├── imageProcessing.ts   # Fungsi processing gambar
│   ├── gridMapping.ts       # Manipulasi data grid
│   ├── colorConversion.ts   # Konversi warna
│   └── errorHandling.ts     # Error handling
└── types/               # TypeScript type definitions
    └── index.ts         # Interface dan type definitions
```

## Cara Kerja Pixel Grid Editor

### 1. Image Upload dan Processing

#### Alur Proses:
```typescript
File Upload → Validation → Canvas Resize → Grid Extraction → Pixel Rendering
```

#### Detail Implementasi:

**A. File Validation**
```typescript
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validasi format file (JPEG, PNG, WebP)
  if (!SUPPORTED_FORMATS.includes(file.type as any)) {
    return { valid: false, error: "Format tidak didukung" };
  }
  
  // Validasi ukuran file (max 10MB)
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File terlalu besar" };
  }
  
  return { valid: true };
}
```

**B. Image Loading**
```typescript
export function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: url,
        file
      });
    };
    
    img.src = url;
  });
}
```

**C. Canvas Resizing**
```typescript
export function resizeImageToCanvas(
  imageData: ImageData,
  options: ImageProcessingOptions
): Promise<CanvasRenderingContext2D> {
  // Membuat canvas dengan ukuran grid yang dipilih
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = options.targetWidth;   // Ukuran grid (20, 50, 100, 250, 500)
  canvas.height = options.targetHeight;
  
  // Resize gambar dengan mempertahankan aspect ratio
  if (options.maintainAspectRatio) {
    const dimensions = calculateResizeDimensions(
      img.naturalWidth,
      img.naturalHeight,
      options.targetWidth,
      options.targetHeight
    );
    
    ctx.drawImage(img, 
      dimensions.offsetX, dimensions.offsetY,
      dimensions.width, dimensions.height
    );
  }
  
  return ctx;
}
```

**D. Grid Data Extraction**
```typescript
export function extractGridFromCanvas(ctx: CanvasRenderingContext2D, gridSize: number): GridData {
  const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
  const pixels: PixelState[][] = [];

  for (let y = 0; y < gridSize; y++) {
    pixels[y] = [];
    for (let x = 0; x < gridSize; x++) {
      const index = (y * gridSize + x) * 4;
      
      const rgba: RGBAColor = {
        r: imageData.data[index],     // Red (0-255)
        g: imageData.data[index + 1], // Green (0-255)
        b: imageData.data[index + 2], // Blue (0-255)
        a: imageData.data[index + 3] / 255 // Alpha (0-1)
      };

      pixels[y][x] = {
        x, y, rgba,
        modified: false,
        originalRgba: { ...rgba }
      };
    }
  }

  return { pixels, width: gridSize, height: gridSize };
}
```

### 2. Pixel Grid Rendering

#### Dua Mode Rendering:

**A. DOM Mode (untuk grid ≤ 100x100)**
- Setiap pixel dirender sebagai div element
- Menampilkan nilai RGB dalam cell (jika ukuran cukup besar)
- Menggunakan virtualization untuk performa
- Interactive hover dan click events

```typescript
const PixelCell: React.FC<PixelCellProps> = ({
  pixel, isSelected, isHovered, cellSize, onClick
}) => {
  const style = {
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    backgroundColor: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
    boxShadow: isSelected ? 'inset 0 0 0 2px #007bff' : 
               isHovered ? 'inset 0 0 0 1px #28a745' :
               modified ? 'inset 0 0 0 1px #ffc107' : 
               'inset 0 0 0 1px #e0e0e0'
  };

  const showRgbText = cellSize >= 8;
  const useCompactFormat = cellSize < 25;
  
  return (
    <div style={style} onClick={onClick}>
      {showRgbText && (
        <div>
          {useCompactFormat ? 
            `${rgba.r},${rgba.g},${rgba.b}` :
            <>
              <div>R:{rgba.r}</div>
              <div>G:{rgba.g}</div>
              <div>B:{rgba.b}</div>
            </>
          }
        </div>
      )}
    </div>
  );
};
```

**B. Canvas Mode (untuk grid > 100x100)**
- Menggunakan HTML5 Canvas untuk performa tinggi
- Batch rendering untuk efisiensi
- Zoom dan pan support
- Event mapping untuk interaksi

#### Virtualization untuk Performa:
```typescript
const visiblePixels = useMemo(() => {
  if (!gridData || cellSize < 1) return [];
  
  // Hitung area yang terlihat
  const startX = Math.max(0, Math.floor(scrollPosition.x / cellSize));
  const endX = Math.min(gridData.width - 1, Math.ceil((scrollPosition.x + viewportWidth) / cellSize));
  const startY = Math.max(0, Math.floor(scrollPosition.y / cellSize));
  const endY = Math.min(gridData.height - 1, Math.ceil((scrollPosition.y + viewportHeight) / cellSize));

  // Hanya render pixel yang terlihat
  const pixels = [];
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (gridData.pixels[y] && gridData.pixels[y][x]) {
        pixels.push({
          pixel: gridData.pixels[y][x],
          x, y,
          left: x * cellSize,
          top: y * cellSize
        });
      }
    }
  }
  
  return pixels;
}, [gridData, cellSize, scrollPosition, containerDimensions]);
```

### 3. Pixel Editing

#### Alur Edit Pixel:
```
Click Pixel → Select Pixel → Update Color Picker → Apply Color → Update Grid Data
```

**A. Pixel Selection**
```typescript
const handlePixelClick = useCallback((position: { x: number; y: number }) => {
  selectPixel(position);
  
  // Update color picker dengan warna pixel yang dipilih
  if (pixelGridData && pixelGridData.pixels[position.y] && pixelGridData.pixels[position.y][position.x]) {
    const pixelColor = pixelGridData.pixels[position.y][position.x].rgba;
    setCurrentColor(pixelColor);
  }
}, [selectPixel, pixelGridData, setCurrentColor]);
```

**B. Color Update**
```typescript
const handleColorChange = useCallback((color: RGBAColor) => {
  setCurrentColor(color);
  
  // Update pixel yang dipilih dengan warna baru
  if (selectedPixel) {
    updatePixel(selectedPixel.x, selectedPixel.y, color);
  }
}, [setCurrentColor, selectedPixel, updatePixel]);
```

**C. Grid Data Update**
```typescript
export function updatePixelAt(
  gridData: GridData,
  x: number,
  y: number,
  rgba: RGBAColor
): GridData {
  const newGridData = cloneGridData(gridData);
  
  if (newGridData.pixels[y] && newGridData.pixels[y][x]) {
    newGridData.pixels[y][x] = {
      ...newGridData.pixels[y][x],
      rgba: { ...rgba },
      modified: true
    };
  }
  
  return newGridData;
}
```

### 4. Zoom dan Pan

```typescript
// Zoom controls
const handleZoomIn = () => setZoomLevel(Math.min(4, zoomLevel + 0.25));
const handleZoomOut = () => setZoomLevel(Math.max(0.25, zoomLevel - 0.25));

// Cell size calculation berdasarkan zoom
const cellSize = useMemo(() => {
  if (!gridData) return 2;
  
  let baseSize: number;
  if (gridData.width <= 20) baseSize = 30;
  else if (gridData.width <= 50) baseSize = 12;
  else if (gridData.width <= 100) baseSize = 6;
  else if (gridData.width <= 250) baseSize = 3;
  else baseSize = 2;
  
  return Math.max(1, Math.floor(baseSize * zoomLevel));
}, [zoomLevel, gridData]);

// Scroll handling
const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  const target = e.target as HTMLDivElement;
  onScrollChange({
    x: target.scrollLeft,
    y: target.scrollTop
  });
}, [onScrollChange]);
```

## Cara Kerja RGBA Table

### 1. Data Transformation

#### Konversi Grid 2D ke Format Tabel:
```typescript
const tableData = useMemo(() => {
  if (!gridData) return [];

  const rows: TableRow[] = [];
  
  for (let y = 0; y < gridData.height; y++) {
    for (let x = 0; x < gridData.width; x++) {
      const pixel = gridData.pixels[y]?.[x];
      if (pixel) {
        rows.push({
          position: `(${x}, ${y})`,
          x, y,
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
```

### 2. Sorting dan Filtering

```typescript
const filteredAndSortedData = useMemo(() => {
  let filtered = tableData;
  
  // Filter berdasarkan status modified
  if (filterModified) {
    filtered = filtered.filter(row => row.modified);
  }

  // Sorting berdasarkan field yang dipilih
  filtered.sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue);
    const bStr = String(bValue);
    
    return sortDirection === 'asc' ? 
      aStr.localeCompare(bStr) : 
      bStr.localeCompare(aStr);
  });

  return filtered;
}, [tableData, sortField, sortDirection, filterModified]);
```

### 3. Pagination

```typescript
const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
const paginatedData = filteredAndSortedData.slice(
  currentPage * itemsPerPage,
  (currentPage + 1) * itemsPerPage
);
```

### 4. Export Functionality

**CSV Export:**
```typescript
const exportToCSV = () => {
  const headers = ['Position', 'X', 'Y', 'Red', 'Green', 'Blue', 'Alpha', 'Hex Color', 'Modified'];
  const csvContent = [
    headers.join(','),
    ...filteredAndSortedData.map(row => 
      [row.position, row.x, row.y, row.r, row.g, row.b, row.a, row.hexColor, row.modified].join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, 'rgba-mapping.csv');
};
```

**JSON Export:**
```typescript
const exportToJSON = () => {
  const jsonContent = JSON.stringify(filteredAndSortedData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, 'rgba-mapping.json');
};
```

### 5. Visual Indicators

```typescript
// Color preview dalam tabel
<td>
  <div 
    className="color-preview"
    style={{ 
      backgroundColor: `rgba(${row.r}, ${row.g}, ${row.b}, ${row.a})`,
      border: row.a < 1 ? '1px solid #ccc' : 'none'
    }}
  />
</td>

// Status indicator
<td>
  <span className={`status-badge ${row.modified ? 'modified' : 'original'}`}>
    {row.modified ? '✓' : '○'}
  </span>
</td>
```

## Komponen Utama

### 1. App.tsx
- **Fungsi**: Komponen root yang mengatur state global dan orchestrasi antar komponen
- **State Management**: Menggunakan multiple hooks untuk different concerns
- **Conditional Rendering**: Upload section vs Editor section

### 2. ImageUploader
- **Fungsi**: Drag & drop file upload dengan validasi
- **Features**: Preview, error handling, progress indicator
- **Validasi**: Format file, ukuran file, error handling

### 3. PixelGrid
- **Fungsi**: Grid editor untuk editing pixel individual
- **Modes**: DOM mode (≤100x100) dan Canvas mode (>100x100)
- **Features**: Zoom, pan, virtualization, hover effects

### 4. ColorPicker
- **Fungsi**: Interface untuk memilih warna RGBA
- **Components**: RGB sliders, alpha slider, hex input, color preview
- **Integration**: Sync dengan selected pixel

### 5. RGBATable
- **Fungsi**: Menampilkan data pixel dalam format tabel
- **Features**: Sorting, filtering, pagination, export
- **Performance**: Lazy loading untuk dataset besar

### 6. GridSizeSelector
- **Fungsi**: Pemilihan ukuran grid (20, 50, 100, 250, 500)
- **Behavior**: Re-process image saat ukuran berubah

## Hooks dan State Management

### 1. useImageProcessor
```typescript
interface UseImageProcessorReturn {
  // State
  processing: boolean;
  imageData: ImageData | null;
  gridData: GridData | null;
  error: UploadError | null;
  
  // Actions
  processImage: (file: File, gridSize?: number) => Promise<void>;
  resetProcessor: () => void;
  clearError: () => void;
}
```

**Responsibilities:**
- File upload dan validation
- Image to grid conversion
- Error handling
- Loading states

### 2. usePixelGrid
```typescript
interface UsePixelGridReturn {
  // State
  gridData: GridData | null;
  selectedPixel: GridPosition | null;
  zoomLevel: number;
  scrollPosition: { x: number; y: number };
  history: GridData[];
  
  // Actions
  updatePixel: (x: number, y: number, rgba: RGBAColor) => void;
  selectPixel: (position: GridPosition | null) => void;
  setZoomLevel: (level: number) => void;
  undo: () => void;
  redo: () => void;
  
  // Computed
  canUndo: boolean;
  canRedo: boolean;
  modifiedPixelsCount: number;
  selectedPixelData: PixelState | null;
}
```

**Responsibilities:**
- Grid state management
- Pixel selection dan editing
- Zoom dan scroll state
- Undo/redo functionality
- History management

### 3. useColorManagement
```typescript
interface UseColorManagementReturn {
  currentColor: RGBAColor;
  colorHistory: RGBAColor[];
  
  setCurrentColor: (color: RGBAColor) => void;
  addToHistory: (color: RGBAColor) => void;
  clearHistory: () => void;
}
```

**Responsibilities:**
- Current color state
- Color history untuk quick access
- Color validation

## Utils dan Image Processing

### 1. imageProcessing.ts
- **validateImageFile**: Validasi format dan ukuran file
- **loadImageFromFile**: Load image dari file ke ImageData
- **resizeImageToCanvas**: Resize image ke ukuran grid target
- **extractGridFromCanvas**: Extract pixel data dari canvas
- **processImageToGrid**: Main processing pipeline

### 2. gridMapping.ts
- **updatePixelAt**: Update single pixel dalam grid
- **updatePixelsInSelection**: Batch update multiple pixels
- **getPixelAt**: Get pixel data di posisi tertentu
- **cloneGridData**: Deep clone grid data
- **resetGridModifications**: Reset semua modifikasi
- **getModifiedPixels**: Get list pixel yang telah dimodifikasi

### 3. colorConversion.ts
- **rgbaToHex**: Konversi RGBA ke hex string
- **hexToRgba**: Konversi hex string ke RGBA
- **rgbaToString**: Konversi RGBA ke CSS string
- **rgbaToHsl**: Konversi RGBA ke HSL
- **contrastColor**: Calculate contrasting color untuk text

### 4. errorHandling.ts
- **AppError**: Custom error class dengan context
- **handleImageError**: Specific error handling untuk image operations
- **validateInput**: Input validation utilities
- **logError**: Error logging dengan context

## Fitur-Fitur Utama

### 1. Multi-Format Image Support
- **JPEG**: Lossy compression, good untuk foto
- **PNG**: Lossless compression, support transparency
- **WebP**: Modern format dengan compression yang baik

### 2. Variable Grid Sizes
- **20x20**: Quick preview, large pixels
- **50x50**: Good balance untuk detail dan performance
- **100x100**: Detailed editing
- **250x250**: High detail untuk precision work
- **500x500**: Maximum detail untuk pixel art

### 3. Performance Optimizations
- **Virtualization**: Hanya render pixel yang terlihat
- **Canvas Mode**: Hardware acceleration untuk grid besar
- **Lazy Loading**: Load data on demand
- **Memoization**: Cache computed values
- **Debounced Updates**: Prevent excessive re-renders

### 4. Interactive Features
- **Click to Select**: Select pixel untuk editing
- **Color Picker Integration**: Real-time color updates
- **Zoom Controls**: 25% to 400% zoom levels
- **Pan Support**: Navigate large grids
- **Hover Effects**: Visual feedback saat hover

### 5. Data Export
- **CSV Format**: Spreadsheet-compatible untuk analysis
- **JSON Format**: Structured data untuk programming
- **Filtered Export**: Export hanya data yang difilter
- **Complete Dataset**: Export semua pixel data

### 6. Visual Indicators
- **Modified Pixels**: Visual indicator untuk pixel yang diedit
- **Selected Pixel**: Blue border untuk pixel yang dipilih
- **Hover State**: Green border untuk hover
- **Color Preview**: Actual color preview dalam tabel
- **Grid Info**: Real-time info tentang grid dan zoom

## Contoh Penggunaan

### 1. Basic Image Editing
```typescript
// 1. Upload image
const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
await processImage(file, 100); // Process sebagai 100x100 grid

// 2. Select pixel
selectPixel({ x: 50, y: 50 });

// 3. Change color
const newColor = { r: 255, g: 0, b: 0, a: 1 }; // Red
updatePixel(50, 50, newColor);

// 4. Export data
exportToCSV(); // Download CSV file
```

### 2. Batch Pixel Updates
```typescript
// Update multiple pixels dengan warna yang sama
const selection = {
  start: { x: 10, y: 10 },
  end: { x: 20, y: 20 },
  active: true
};

setSelection(selection);
updateSelectedPixels({ r: 0, g: 255, b: 0, a: 1 }); // Green area
```

### 3. Color Analysis
```typescript
// Get statistik warna dari grid
const stats = useMemo(() => {
  if (!gridData) return null;
  
  const colorCount = new Map<string, number>();
  const modifiedCount = { total: 0, modified: 0 };
  
  for (let y = 0; y < gridData.height; y++) {
    for (let x = 0; x < gridData.width; x++) {
      const pixel = gridData.pixels[y][x];
      const colorKey = `${pixel.rgba.r},${pixel.rgba.g},${pixel.rgba.b}`;
      
      colorCount.set(colorKey, (colorCount.get(colorKey) || 0) + 1);
      modifiedCount.total++;
      if (pixel.modified) modifiedCount.modified++;
    }
  }
  
  return { colorCount, modifiedCount };
}, [gridData]);
```

### 4. Custom Grid Processing
```typescript
// Proses gambar dengan options khusus
const customOptions: ImageProcessingOptions = {
  targetWidth: 200,
  targetHeight: 200,
  maintainAspectRatio: false, // Stretch to fill
  centerImage: false,
  fillTransparent: true
};

const ctx = await resizeImageToCanvas(imageData, customOptions);
const customGrid = extractGridFromCanvas(ctx, 200);
```

### 5. History Management
```typescript
// Undo/Redo operations
const canUndo = history.length > 0 && historyIndex > 0;
const canRedo = historyIndex < history.length - 1;

// Undo last change
if (canUndo) {
  undo();
}

// Redo change
if (canRedo) {
  redo();
}

// Reset ke original
resetGrid();
```

## Kesimpulan

Image Grid Editor adalah aplikasi yang comprehensive untuk editing gambar pada level pixel dengan fitur-fitur advanced seperti:

- **High Performance**: Optimized untuk handling grid besar dengan virtualization dan Canvas API
- **User Friendly**: Interface yang intuitif dengan real-time feedback
- **Data Rich**: Comprehensive pixel data analysis dan export capabilities
- **Extensible**: Modular architecture yang mudah untuk dikembangkan
- **Responsive**: Works well pada berbagai ukuran screen dan device

Aplikasi ini cocok untuk:
- **Pixel Art Creation**: Creating dan editing pixel art
- **Image Analysis**: Analyzing pixel-level image data
- **Educational Purposes**: Learning tentang image processing dan pixel manipulation
- **Data Visualization**: Converting images menjadi structured data
- **Color Research**: Studying color distribution dalam images