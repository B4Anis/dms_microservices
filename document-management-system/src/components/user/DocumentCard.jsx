import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

// Utility for formatting file sizes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Utility to pick file type icons/colors
const getFileTypeInfo = (type) => {
  const t = type?.toUpperCase() || 'UNKNOWN';
  switch (t) {
    case 'PDF': return { color: 'bg-red-100 text-red-600', icon: '📄' };
    case 'DOCX': return { color: 'bg-blue-100 text-blue-600', icon: '📝' };
    case 'XLSX': return { color: 'bg-green-100 text-green-600', icon: '📊' };
    case 'PNG':
    case 'JPG':
    case 'JPEG': return { color: 'bg-purple-100 text-purple-600', icon: '🖼️' };
    default: return { color: 'bg-gray-100 text-gray-600', icon: '📎' };
  }
};

const DocumentCard = ({ document, category, department }) => {
  const navigate = useNavigate();
  const fileInfo = getFileTypeInfo(document.fileType);
  
  const uploadDate = new Date(document.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <Card 
      hoverable 
      onClick={() => navigate(`/documents/${document.id}`)}
      className="h-full flex flex-col transition-transform transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${fileInfo.color} flex items-center justify-center text-2xl`}>
          {fileInfo.icon}
        </div>
        <div className="flex gap-1">
          {category && (
            <Badge variant="info" className="flex items-center gap-1">
              <span className="text-[10px]">{category.icon}</span>
              {category.name}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2" title={document.title}>
          {document.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {document.description}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <span>{uploadDate}</span>
          <span>{formatBytes(document.fileSize)}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/documents/${document.id}`);
            }}
          >
            View Details
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Simulating download action
              alert(`Downloading ${document.fileName}...`);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DocumentCard;
