import { UploadError } from '@/types';

/**
 * Error handling utilities for the image grid editor
 */

export class ImageProcessingError extends Error {
  public readonly type: UploadError['type'];
  public readonly file?: File;

  constructor(type: UploadError['type'], message: string, file?: File) {
    super(message);
    this.name = 'ImageProcessingError';
    this.type = type;
    this.file = file;
  }
}

/**
 * Creates a standardized error object
 */
export function createError(
  type: UploadError['type'],
  message: string,
  file?: File
): UploadError {
  return {
    type,
    message,
    file,
  };
}

/**
 * Handles different types of errors that can occur during image processing
 */
export function handleImageProcessingError(error: unknown, file?: File): UploadError {
  if (error instanceof ImageProcessingError) {
    return {
      type: error.type,
      message: error.message,
      file: error.file || file,
    };
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('format') || error.message.includes('type')) {
      return createError('format', error.message, file);
    }
    
    if (error.message.includes('size') || error.message.includes('large')) {
      return createError('size', error.message, file);
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createError('network', error.message, file);
    }
    
    return createError('processing', error.message, file);
  }

  return createError('processing', 'An unknown error occurred', file);
}

/**
 * Validates file before processing
 */
export function validateFile(file: File): void {
  // Check if file exists
  if (!file) {
    throw new ImageProcessingError('format', 'No file provided');
  }

  // Check file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new ImageProcessingError(
      'size',
      `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      file
    );
  }

  // Check file type
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    throw new ImageProcessingError(
      'format',
      `Unsupported file format. Supported formats: ${supportedTypes.join(', ')}`,
      file
    );
  }
}

/**
 * Wraps async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in async operation:', error);
      throw handleImageProcessingError(error);
    }
  };
}

/**
 * Logs errors for debugging
 */
export function logError(error: UploadError, context: string = 'Unknown'): void {
  console.error(`[${context}] ${error.type.toUpperCase()} Error:`, {
    message: error.message,
    type: error.type,
    file: error.file?.name,
    fileSize: error.file?.size,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Gets user-friendly error messages
 */
export function getErrorMessage(error: UploadError): string {
  switch (error.type) {
    case 'format':
      return `Invalid file format. Please select a JPEG, PNG, or WebP image.`;
    
    case 'size':
      return `File is too large. Please select an image smaller than 10MB.`;
    
    case 'processing':
      return `Failed to process the image. Please try again with a different image.`;
    
    case 'network':
      return `Network error occurred. Please check your connection and try again.`;
    
    default:
      return `An unexpected error occurred: ${error.message}`;
  }
}

/**
 * Error boundary helper for React components
 */
export interface ErrorInfo {
  componentStack: string;
}

export function logComponentError(error: Error, errorInfo: ErrorInfo): void {
  console.error('React component error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

/**
 * Debounced error reporter to prevent spam
 */
class DebouncedErrorReporter {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private delay = 1000; // 1 second

  report(errorKey: string, error: UploadError, context: string = 'Unknown'): void {
    // Clear existing timeout for this error key
    const existingTimeout = this.timeouts.get(errorKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      logError(error, context);
      this.timeouts.delete(errorKey);
    }, this.delay);

    this.timeouts.set(errorKey, timeout);
  }
}

export const debouncedErrorReporter = new DebouncedErrorReporter();