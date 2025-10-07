import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ImageData, GridData, RGBAColor, UploadError } from '@/types';

// Application state interface
interface AppState {
  imageData: ImageData | null;
  gridData: GridData | null;
  processing: boolean;
  error: UploadError | null;
  currentColor: RGBAColor;
  selectedPixel: { x: number; y: number } | null;
  zoomLevel: number;
  showGrid: boolean;
  modified: boolean;
}

// Action types
type AppAction =
  | { type: 'SET_IMAGE_DATA'; payload: ImageData | null }
  | { type: 'SET_GRID_DATA'; payload: GridData | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: UploadError | null }
  | { type: 'SET_CURRENT_COLOR'; payload: RGBAColor }
  | { type: 'SET_SELECTED_PIXEL'; payload: { x: number; y: number } | null }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_SHOW_GRID'; payload: boolean }
  | { type: 'SET_MODIFIED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  imageData: null,
  gridData: null,
  processing: false,
  error: null,
  currentColor: { r: 0, g: 0, b: 0, a: 1 },
  selectedPixel: null,
  zoomLevel: 1,
  showGrid: true,
  modified: false,
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_IMAGE_DATA':
      return { ...state, imageData: action.payload };
    
    case 'SET_GRID_DATA':
      return { ...state, gridData: action.payload };
    
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT_COLOR':
      return { ...state, currentColor: action.payload };
    
    case 'SET_SELECTED_PIXEL':
      return { ...state, selectedPixel: action.payload };
    
    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: Math.max(0.1, Math.min(10, action.payload)) };
    
    case 'SET_SHOW_GRID':
      return { ...state, showGrid: action.payload };
    
    case 'SET_MODIFIED':
      return { ...state, modified: action.payload };
    
    case 'RESET_STATE':
      return { ...initialState };
    
    default:
      return state;
  }
}

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Helper functions
  setImageData: (data: ImageData | null) => void;
  setGridData: (data: GridData | null) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: UploadError | null) => void;
  setCurrentColor: (color: RGBAColor) => void;
  setSelectedPixel: (pixel: { x: number; y: number } | null) => void;
  setZoomLevel: (level: number) => void;
  setShowGrid: (show: boolean) => void;
  setModified: (modified: boolean) => void;
  resetApp: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const setImageData = (data: ImageData | null) => {
    dispatch({ type: 'SET_IMAGE_DATA', payload: data });
  };

  const setGridData = (data: GridData | null) => {
    dispatch({ type: 'SET_GRID_DATA', payload: data });
  };

  const setProcessing = (processing: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: processing });
  };

  const setError = (error: UploadError | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setCurrentColor = (color: RGBAColor) => {
    dispatch({ type: 'SET_CURRENT_COLOR', payload: color });
  };

  const setSelectedPixel = (pixel: { x: number; y: number } | null) => {
    dispatch({ type: 'SET_SELECTED_PIXEL', payload: pixel });
  };

  const setZoomLevel = (level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level });
  };

  const setShowGrid = (show: boolean) => {
    dispatch({ type: 'SET_SHOW_GRID', payload: show });
  };

  const setModified = (modified: boolean) => {
    dispatch({ type: 'SET_MODIFIED', payload: modified });
  };

  const resetApp = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setImageData,
    setGridData,
    setProcessing,
    setError,
    setCurrentColor,
    setSelectedPixel,
    setZoomLevel,
    setShowGrid,
    setModified,
    resetApp,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;