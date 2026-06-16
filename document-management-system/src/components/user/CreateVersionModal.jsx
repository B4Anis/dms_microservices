import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormGroup from '../common/FormGroup';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { documentService } from '../../services/documentService';

const CreateVersionModal = ({ isOpen, onClose, document, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate type matches
    const originalExt = document.fileType.toLowerCase();
    const newExt = selectedFile.name.split('.').pop().toLowerCase();
    
    if (originalExt !== newExt) {
      showError(`File type must match original (${originalExt.toUpperCase()})`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showError('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !notes.trim()) return;
    
    setIsUploading(true);
    let progress = 0;
    
    // Simulate upload
    const interval = setInterval(async () => {
      progress += 25;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        try {
          const nextVersionNumber = document.versions.length > 0 
            ? Math.max(...document.versions.map(v => v.versionNumber)) + 1 
            : 2;

          const newVersion = {
            versionNumber: nextVersionNumber,
            fileUrl: `/uploads/${file.name}`,
            fileSize: file.size,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString(),
            notes: notes.trim()
          };

          await documentService.createDocumentVersion(document.id, newVersion);
          showSuccess('New version uploaded successfully');
          onSuccess();
          onClose();
        } catch (err) {
          showError('Failed to upload new version');
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setFile(null);
          setNotes('');
        }
      }
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? undefined : onClose} title={`Create New Version - ${document?.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
          You are creating version <strong>v{document?.versions ? Math.max(...document.versions.map(v => v.versionNumber)) + 1 : 2}</strong>. 
          The file must be a <strong>{document?.fileType?.toUpperCase()}</strong>.
        </div>

        <FormGroup label="Select File" required>
          {!file ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                accept={`.${document?.fileType?.toLowerCase()}`}
              />
              <span className="text-blue-600 font-medium">Click to browse</span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
              <span className="text-sm font-medium truncate">{file.name}</span>
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
                disabled={isUploading}
              >
                Remove
              </button>
            </div>
          )}
        </FormGroup>

        <FormGroup label="Version Notes" required helperText="Briefly describe what changed in this version.">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUploading}
            placeholder="e.g., Updated financial figures for Q3"
          />
        </FormGroup>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!file || !notes.trim() || isUploading} loading={isUploading}>
            Upload Version
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateVersionModal;
