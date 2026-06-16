import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import FormGroup from '../common/FormGroup';
import MultiSelect from '../common/MultiSelect';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { documentService } from '../../services/documentService';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 5;

const DocumentUploadModal = ({ isOpen, onClose, onSuccess, categories, departments }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    categoryId: '',
    departmentId: user?.departments?.[0] || '',
    status: 'draft',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const fileInputRef = useRef(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFiles([]);
      setMetadata({
        title: '',
        description: '',
        categoryId: '',
        departmentId: user?.departments?.[0] || '',
        status: 'draft',
        tags: []
      });
      setTagInput('');
      setValidationErrors({});
      setUploadProgress(0);
    }
  }, [isOpen]); // Only reset when the modal's open state changes, not on every prop update

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFiles = (incoming) => {
    const allowedExts = ['pdf', 'docx', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
    const merged = [...files];

    for (const f of incoming) {
      if (merged.length >= MAX_FILES) {
        showError(`You can upload at most ${MAX_FILES} files at once.`);
        break;
      }
      if (f.size > MAX_FILE_SIZE) {
        showError(`"${f.name}" exceeds the 100 MB limit.`);
        continue;
      }
      const ext = f.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
        showError(`"${f.name}" has an unsupported file type.`);
        continue;
      }
      if (!merged.find(existing => existing.name === f.name && existing.size === f.size)) {
        merged.push(f);
      }
    }

    if (merged.length > MAX_FILES) {
      showError(`You can upload at most ${MAX_FILES} files at once.`);
      merged.splice(MAX_FILES);
    }

    setFiles(merged);
    if (merged.length === 1) {
      setMetadata(prev => ({ ...prev, title: merged[0].name.split('.').slice(0, -1).join('.') }));
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e) => {
    validateAndSetFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (metadata.tags.length >= 10) {
        showError('Maximum 10 tags allowed.');
        return;
      }
      if (!metadata.tags.includes(tagInput.trim())) {
        setMetadata(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const validateMetadata = () => {
    const errors = {};
    if (!metadata.title.trim()) errors.title = 'Title is required.';
    if (metadata.title.length > 200) errors.title = 'Title must be less than 200 characters.';
    if (metadata.description.length > 1000) errors.description = 'Description must be less than 1000 characters.';
    if (!metadata.categoryId) errors.categoryId = 'Category is required.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const proceedToUpload = () => {
    if (validateMetadata()) {
      setStep(3);
      runUploads();
    }
  };

  const uploadOneFile = (file, label) => new Promise((resolve, reject) => {
    setUploadStatusMsg(label);
    setUploadProgress(0);
    let progress = 0;

    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setUploadStatusMsg('Saving...');
        try {
          const fileExt = file.name.split('.').pop().toLowerCase();
          const docRecord = {
            id: Math.random().toString(36).substr(2, 9),
            title: files.length === 1 ? metadata.title : file.name.split('.').slice(0, -1).join('.'),
            description: metadata.description,
            categoryId: metadata.categoryId,
            departmentId: metadata.departmentId,
            tags: metadata.tags,
            fileUrl: `/uploads/${file.name}`,
            fileName: file.name,
            fileType: fileExt,
            fileSize: file.size,
            status: metadata.status,
            uploadedBy: user.id,
            currentVersion: 1,
            versions: [{ versionNumber: 1, fileUrl: `/uploads/${file.name}`, uploadedBy: user.id, uploadedAt: new Date().toISOString(), notes: 'Initial upload' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: 0,
            downloadCount: 0
          };
          await documentService.createDocument(docRecord, file);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    }, 400);
  });

  const runUploads = async () => {
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadOneFile(files[i], `Uploading file ${i + 1} of ${files.length}…`);
      }
      showSuccess(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully!`);
      onSuccess();
      onClose();
    } catch {
      showError('Failed to save one or more files.');
      setStep(2);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 3 ? undefined : onClose} // Prevent close during upload
      title="Upload Document"
      size="md"
    >
      {/* STEP 1: FILE UPLOAD */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
            />
            <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-3 flex text-sm text-gray-600 justify-center">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to select files</span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOCX, XLSX, TXT, PNG, JPG — up to 100 MB each, max {MAX_FILES} files
            </p>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between border rounded-lg px-4 py-2.5 bg-gray-50">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-lg">📄</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="ml-4 text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length > 0 && (
            <p className="text-xs text-gray-400 text-right">{files.length} / {MAX_FILES} files selected</p>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose} className="mr-2">Cancel</Button>
            <button
              type="button"
              disabled={files.length === 0}
              onClick={(e) => { e.stopPropagation(); setStep(2); }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: METADATA FORM */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Title"
            name="title"
            id="title"
            value={metadata.title}
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
            error={validationErrors.title}
            required
            autoFocus
          />

          <FormGroup label="Description" error={validationErrors.description}>
            <textarea
              name="description"
              id="description"
              className={`w-full px-3 py-2 border rounded-md sm:text-sm focus:outline-none ${validationErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              rows="3"
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            />
          </FormGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              name="categoryId"
              id="categoryId"
              value={metadata.categoryId}
              onChange={(e) => setMetadata({ ...metadata, categoryId: e.target.value })}
              options={categories.map(c => ({ label: c.name, value: c.id }))}
              error={validationErrors.categoryId}
              required
            />
            <Select
              label="Department"
              value={metadata.departmentId}
              onChange={(e) => setMetadata({ ...metadata, departmentId: e.target.value })}
              options={departments.map(d => ({ label: d.name, value: d.id }))}
            />
          </div>

          <FormGroup label="Tags" helperText="Press Enter to add tag (Max 10)">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="e.g. report, q1, finance"
            />
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-blue-600 hover:text-blue-900">&times;</button>
                </span>
              ))}
            </div>
          </FormGroup>

          <Select
            label="Status"
            value={metadata.status}
            onChange={(e) => setMetadata({ ...metadata, status: e.target.value })}
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' }
            ]}
          />

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <div>
              <Button variant="secondary" onClick={onClose} className="mr-2">Cancel</Button>
              <Button variant="primary" onClick={proceedToUpload}>Upload</Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: UPLOAD PROGRESS */}
      {step === 3 && (
        <div className="py-8 text-center space-y-6">
          <h3 className="text-lg font-medium text-gray-900">{uploadStatusMsg}</h3>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Progress
              </span>
              <span className="text-xs font-semibold inline-block text-blue-600">
                {uploadProgress}%
              </span>
            </div>
            <div className="overflow-hidden h-2 mb-4 rounded bg-blue-200">
              <div style={{ width: `${uploadProgress}%` }} className="h-full bg-blue-500 transition-all duration-300" />
            </div>
          </div>

          <ul className="text-sm text-gray-500 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="truncate">{f.name}</li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

export default DocumentUploadModal;
