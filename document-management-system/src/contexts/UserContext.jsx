import React, { createContext, useReducer, useCallback } from 'react';
import { userService } from '../services/userService';
import { documentService } from '../services/documentService'; // Reusing to fetch departments

export const UserContext = createContext();

const initialState = {
  users: [],
  departments: [],
  selectedUserIds: [],
  filters: {
    search: '',
    role: '',
    department: '',
    status: ''
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  },
  isLoading: false,
  error: null
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, users: action.payload.users, departments: action.payload.departments };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'SET_SELECTED_USERS':
      return { ...state, selectedUserIds: action.payload };
    
    case 'UPDATE_FILTERS':
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 } 
      };
      
    case 'UPDATE_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
      
    case 'UPDATE_PAGINATION':
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
      
    case 'CLEAR_FILTERS':
      return { 
        ...state, 
        filters: initialState.filters,
        pagination: { ...state.pagination, currentPage: 1 }
      };

    default:
      return state;
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [users, departments] = await Promise.all([
        userService.getUsers(),
        documentService.getDepartments()
      ]);
      dispatch({ type: 'FETCH_SUCCESS', payload: { users, departments } });
    } catch (error) {
      dispatch({ type: 'FETCH_FAILURE', payload: error.message });
    }
  }, []);

  const setSelectedUsers = (ids) => dispatch({ type: 'SET_SELECTED_USERS', payload: ids });
  const updateFilters = (filters) => dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  const updateSort = (sortOption) => dispatch({ type: 'UPDATE_SORT', payload: sortOption });
  const updatePagination = (pagination) => dispatch({ type: 'UPDATE_PAGINATION', payload: pagination });
  const clearFilters = () => dispatch({ type: 'CLEAR_FILTERS' });

  return (
    <UserContext.Provider value={{
      ...state,
      dispatch,
      fetchUsers,
      setSelectedUsers,
      updateFilters,
      updateSort,
      updatePagination,
      clearFilters
    }}>
      {children}
    </UserContext.Provider>
  );
};
