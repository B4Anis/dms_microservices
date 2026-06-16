import { useContext } from 'react';
import { DocumentContext } from '../contexts/DocumentContext';

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
