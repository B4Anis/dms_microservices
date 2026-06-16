import React, { createContext, useReducer, useCallback } from 'react';
import { documentService } from '../services/documentService';

export const DocumentContext = createContext();

const initialState = {
  documents: [],
  categories: [],
  departments: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {
    search: '',
    categories: [],
    departments: [],
    fileTypes: [],
    dateRange: null
  },
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const documentReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_DOCUMENTS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_DOCUMENTS_SUCCESS':
      return { ...state, isLoading: false, documents: action.payload };
    case 'FETCH_DOCUMENTS_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'FETCH_METADATA_SUCCESS':
      return {
        ...state,
        categories: action.payload.categories,
        departments: action.payload.departments
      };

    case 'SET_CURRENT_DOCUMENT':
      return { ...state, currentDocument: action.payload };
      
    case 'UPDATE_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 } // Reset page on filter change
      };
      
    case 'UPDATE_SORT':
      return { 
        ...state, 
        sortBy: action.payload.sortBy, 
        sortOrder: action.payload.sortOrder 
      };
      
    case 'UPDATE_PAGINATION':
      return { 
        ...state, 
        pagination: { ...state.pagination, ...action.payload } 
      };
      
    case 'CLEAR_FILTERS':
      return { 
        ...state, 
        filters: initialState.filters,
        pagination: { ...state.pagination, currentPage: 1 }
      };

    case 'SET_DATE_RANGE':
      return {
        ...state,
        filters: { ...state.filters, dateRange: action.payload },
        pagination: { ...state.pagination, currentPage: 1 }
      };

    default:
      return state;
  }
};

export const DocumentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(documentReducer, initialState);

  const fetchDocuments = useCallback(async () => {
    dispatch({ type: 'FETCH_DOCUMENTS_START' });
    try {
      const data = await documentService.getDocuments();
      dispatch({ type: 'FETCH_DOCUMENTS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENTS_FAILURE', payload: error.message });
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [categories, departments] = await Promise.all([
        documentService.getCategories(),
        documentService.getDepartments()
      ]);
      dispatch({ type: 'FETCH_METADATA_SUCCESS', payload: { categories, departments } });
    } catch (error) {
      console.error('Failed to fetch metadata', error);
    }
  }, []);

  const updateFilters = (filters) => dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  const updateSort = (sortOption) => dispatch({ type: 'UPDATE_SORT', payload: sortOption });
  const updatePagination = (pagination) => dispatch({ type: 'UPDATE_PAGINATION', payload: pagination });
  const clearFilters = () => dispatch({ type: 'CLEAR_FILTERS' });
  const setDateRange = (range) => dispatch({ type: 'SET_DATE_RANGE', payload: range });

  return (
    <DocumentContext.Provider value={{
      ...state,
      dispatch,
      fetchDocuments,
      fetchMetadata,
      updateFilters,
      updateSort,
      updatePagination,
      clearFilters,
      setDateRange
    }}>
      {children}
    </DocumentContext.Provider>
  );
};
