import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const setLoading = (loading, message = '') => {
    setIsGlobalLoading(loading);
    setLoadingMessage(message);
  };

  return (
    <LoadingContext.Provider value={{ isGlobalLoading, loadingMessage, setLoading }}>
      {children}
      {isGlobalLoading && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={loadingMessage || 'Loading...'}
        >
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-700 font-medium text-sm">
              {loadingMessage || 'Loading...'}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useLoading must be used within a LoadingProvider');
  return context;
};
