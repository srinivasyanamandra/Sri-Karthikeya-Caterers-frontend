import React, { useRef, useState } from 'react';

const MAX_SIZE_MB = 5;
const ACCEPTED_PREFIX = 'image/';

/**
 * PhotoUpload — optional photo attachment with drag-or-click + preview.
 *
 * Concerns kept local:
 *   - File-type and size validation (image/*, ≤ 5 MB)
 *   - FileReader-driven preview (no upload happens here)
 *   - Replace and remove flows
 *   - Inline error display via the shared .form-error class
 *
 * The component is fully controlled — `value` is `{ file, preview }` or
 * `null`. The parent owns the data; this component only emits change events.
 */
const PhotoUpload = ({ name, value, onChange }) => {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const acceptFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith(ACCEPTED_PREFIX)) {
      setError('Please choose an image file (JPG, PNG, HEIC).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(name, { file, preview: event.target.result });
    };
    reader.onerror = () => setError('We could not read that file. Please try another.');
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event) => {
    acceptFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const removePhoto = () => {
    onChange(name, null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="photo-upload">
      <span className="photo-upload-label">Add a photo (optional)</span>

      {!value ? (
        <label
          className={`photo-upload-drop ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="photo-upload-input"
            aria-label="Attach a photo"
          />
          <i className="fas fa-cloud-arrow-up photo-upload-icon" aria-hidden="true" />
          <span className="photo-upload-prompt">Click or drop a photo here</span>
          <span className="photo-upload-meta">Up to {MAX_SIZE_MB} MB · JPG, PNG, HEIC</span>
        </label>
      ) : (
        <div className="photo-upload-preview">
          <img src={value.preview} alt="Preview" />
          <div className="photo-upload-info">
            <span className="photo-upload-filename" title={value.file.name}>
              {value.file.name}
            </span>
            <button
              type="button"
              className="photo-upload-remove"
              onClick={removePhoto}
              aria-label="Remove photo"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
};

export default PhotoUpload;
