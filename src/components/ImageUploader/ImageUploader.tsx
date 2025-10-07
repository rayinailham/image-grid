import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from '@/types';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  processing: boolean;
  error: string | null;
  onClearError: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  processing,
  error,
  onClearError,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onClearError();
        onImageUpload(acceptedFiles[0]);
      }
    },
    [onImageUpload, onClearError]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': SUPPORTED_FORMATS,
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="image-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${
          isDragReject ? 'reject' : ''
        } ${processing ? 'processing' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="upload-content">
          {processing ? (
            <div className="upload-state processing">
              <div className="spinner"></div>
              <p>Processing image...</p>
            </div>
          ) : (
            <div className="upload-state idle">
              <div className="upload-icon">📁</div>
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <>
                  <p>Drag & drop an image here, or click to select</p>
                  <p className="upload-info">
                    Supported formats: JPEG, PNG, WebP
                    <br />
                    Maximum size: {formatFileSize(MAX_FILE_SIZE)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button onClick={onClearError} className="clear-error">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;