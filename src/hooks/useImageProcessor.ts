import { useState, useCallback } from 'react';
import {
  ImageData,
  GridData,
  ProcessingResult,
  UploadError,
} from '@/types';
import { processImageToGrid } from '@/utils/imageProcessing';

interface UseImageProcessorState {
  processing: boolean;
  imageData: ImageData | null;
  gridData: GridData | null;
  error: UploadError | null;
}

interface UseImageProcessorActions {
  processImage: (file: File, gridSize?: number) => Promise<void>;
  resetProcessor: () => void;
  clearError: () => void;
}

export type UseImageProcessorReturn = UseImageProcessorState & UseImageProcessorActions;

/**
 * Custom hook for handling image processing operations
 * Manages the entire workflow from file upload to grid data generation
 */
export function useImageProcessor(): UseImageProcessorReturn {
  const [state, setState] = useState<UseImageProcessorState>({
    processing: false,
    imageData: null,
    gridData: null,
    error: null,
  });

  const processImage = useCallback(async (file: File, gridSize?: number) => {
    setState(prev => ({
      ...prev,
      processing: true,
      error: null,
    }));

    try {
      const result: ProcessingResult = await processImageToGrid(file, gridSize);

      if (result.success && result.imageData && result.gridData) {
        setState(prev => ({
          ...prev,
          processing: false,
          imageData: result.imageData!,
          gridData: result.gridData!,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          processing: false,
          error: result.error || {
            type: 'processing',
            message: 'Unknown processing error',
            file,
          },
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        processing: false,
        error: {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Processing failed',
          file,
        },
      }));
    }
  }, []);

  const resetProcessor = useCallback(() => {
    setState({
      processing: false,
      imageData: null,
      gridData: null,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    processImage,
    resetProcessor,
    clearError,
  };
}