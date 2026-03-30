/**
 * Upload Form Component
 *
 * Where contributors drop their data files
 * Shows real-time validation feedback
 */

import React, { useState } from 'react';

export function UploadForm({ boomerangId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setError(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/boomerangs/${boomerangId}/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'x-user-id': localStorage.getItem('userId') || 'anonymous',
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFeedback({
          status: data.summary.invalidRows === 0 ? 'success' : 'warning',
          message: data.message,
          ...data,
        });
        setFile(null);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>📤 Upload Your Data</h2>

      <form onSubmit={handleSubmit}>
        <div
          style={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <p style={styles.dropText}>
            Drag & drop your CSV or Excel file here
          </p>
          <p style={styles.orText}>or</p>
          <label style={styles.fileInput}>
            Select File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {file && (
          <div style={styles.fileInfo}>
            📁 {file.name}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            ...styles.button,
            opacity: !file || uploading ? 0.5 : 1,
            cursor: !file || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Validating...' : 'Submit & Validate'}
        </button>
      </form>

      {feedback && (
        <div style={{
          ...styles.feedback,
          borderColor: feedback.status === 'success' ? '#2ecc71' : '#f39c12',
          backgroundColor: feedback.status === 'success' ? '#f0fdf4' : '#fffbf0',
        }}>
          <h3>{feedback.message}</h3>

          <div style={styles.summary}>
            <p>Total Rows: {feedback.summary.totalRows}</p>
            <p style={{ color: '#2ecc71' }}>✓ Valid: {feedback.summary.validRows}</p>
            {feedback.summary.invalidRows > 0 && (
              <p style={{ color: '#e74c3c' }}>✗ Invalid: {feedback.summary.invalidRows}</p>
            )}
          </div>

          {feedback.feedback.sampleErrors.length > 0 && (
            <div style={styles.errors}>
              <h4>Issues Found:</h4>
              {feedback.feedback.sampleErrors.map((err, i) => (
                <p key={i} style={{ color: '#e74c3c', marginBottom: '8px' }}>
                  Row {err.rowIndex}, {err.field}: {err.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  dropZone: {
    border: '2px dashed #3498db',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  dropText: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 10px 0',
  },
  orText: {
    color: '#7f8c8d',
    margin: '10px 0',
  },
  fileInput: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  fileInfo: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    fontSize: '14px',
  },
  error: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fadbd8',
    color: '#c0392b',
    borderRadius: '4px',
    border: '1px solid #e74c3c',
  },
  button: {
    marginTop: '20px',
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
  },
  feedback: {
    marginTop: '20px',
    padding: '20px',
    border: '2px solid',
    borderRadius: '8px',
  },
  summary: {
    marginTop: '15px',
    fontSize: '14px',
  },
  errors: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: '4px',
  },
};
