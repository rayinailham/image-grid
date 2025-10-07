# Image Grid Editor

🎨 **Aplikasi editor gambar interaktif dengan system grid 500×500 pixel**

Aplikasi web modern untuk mengedit gambar secara pixel-by-pixel dengan interface grid yang intuitif. Dibangun dengan React, TypeScript, dan Vite untuk performa optimal.

![Image Grid Editor](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue) ![Vite](https://img.shields.io/badge/Vite-5.3.4-green) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fitur Utama

### 🖼️ **Image Processing**
- Upload gambar dengan drag & drop interface
- Support format: JPEG, PNG, WebP (max 10MB)
- Automatic resize dengan aspect ratio preservation
- Konversi otomatis ke grid 500×500 pixel

### 🎯 **Interactive Grid Editor**
- Grid 500×500 pixel dengan viewport virtualization
- Zoom controls (25% - 400%) untuk editing presisi
- Visual feedback real-time:
  - 🔵 Biru: Pixel terpilih
  - 🟢 Hijau: Pixel hover
  - 🟡 Kuning: Pixel yang dimodifikasi
- Real-time display koordinat dan nilai warna pixel

### 🎨 **Advanced Color Picker**
- Professional color picker dengan React-color
- Color palette dengan preset colors
- RGBA value editing
- Real-time color preview

### ⚡ **Performance & UX**
- Viewport virtualization untuk performa optimal
- Undo/redo system (50 history items)
- Responsive design untuk berbagai ukuran layar
- Loading states dan comprehensive error handling

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 atau lebih baru)
- npm atau yarn

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/image-grid-editor.git
   cd image-grid-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## 📖 Cara Penggunaan

### 1. Upload Gambar
- Drag & drop gambar ke area upload, atau
- Klik untuk memilih file dari komputer
- Format yang didukung: JPEG, PNG, WebP (max 10MB)

### 2. View & Navigate
- Gambar otomatis diproses ke grid 500×500
- Gunakan zoom controls untuk memperbesar/memperkecil
- Scroll untuk navigasi area grid yang besar

### 3. Edit Pixel
- **Klik pixel** di grid untuk memilih
- **Gunakan color picker** untuk memilih warna baru
- **Lihat info pixel** real-time di panel samping
- **Undo/Redo** untuk membatalkan/mengulangi perubahan

### 4. Zoom & Navigation
- **Zoom In/Out**: Gunakan tombol zoom atau scroll wheel
- **Pan**: Drag untuk menggeser view area
- **Reset**: Tombol "Load New Image" untuk memulai editing baru

## 🏗️ Tech Stack

### Frontend Framework
- **React 18.3.1** - Modern React dengan hooks
- **TypeScript 5.2.2** - Type safety dan developer experience
- **Vite 5.3.4** - Fast build tool dan development server

### UI Libraries
- **react-dropzone** - Drag & drop file upload
- **react-color** - Professional color picker component

### Development Tools
- **ESLint + Prettier** - Code quality dan formatting
- **Vitest** - Fast unit testing
- **@testing-library** - React component testing

### Performance Optimizations
- **Viewport Virtualization** - Render hanya pixel yang visible
- **React.memo** - Prevent unnecessary re-renders
- **useCallback/useMemo** - Optimize expensive computations

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ImageUploader/   # File upload with drag & drop
│   ├── ImageCanvas/     # Image display component
│   ├── PixelGrid/      # Main 500×500 grid editor
│   ├── ColorPicker/    # Color selection interface
│   └── Layout/         # App layout structure
├── hooks/              # Custom React hooks
│   ├── useImageProcessor.ts  # Image processing logic
│   ├── usePixelGrid.ts      # Grid state management
│   └── useColorManagement.ts # Color utilities
├── utils/              # Utility functions
│   ├── imageProcessing.ts   # Image resize & grid mapping
│   ├── gridMapping.ts       # Grid coordinate utilities
│   └── colorConversion.ts   # Color format conversions
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🧪 Testing

Proyek ini menggunakan Vitest dan React Testing Library untuk testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🎯 Development Roadmap

### ✅ Phase 1 & 2 (Completed)
- ✅ Core infrastructure & image processing
- ✅ Interactive grid system & user interface
- ✅ Professional color picker integration
- ✅ Complete state management with undo/redo

### 🚀 Phase 3 (Coming Soon)
- 🔄 Export system (PNG, JPEG, WebP)
- 🔄 Advanced drawing tools (brush, line, rectangle)
- 🔄 Layer system untuk editing kompleks
- 🔄 Filter effects dan transformations
- 🔄 Mobile touch optimization

## 🤝 Contributing

Kontribusi sangat diterima! Untuk berkontribusi:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Project ini menggunakan MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [react-color](https://casesandberg.github.io/react-color/) - Color picker
- [react-dropzone](https://react-dropzone.js.org/) - File upload

## 📧 Contact

Jika ada pertanyaan atau saran, silakan buat issue di repository ini.

---

**Made with ❤️ for pixel-perfect image editing**