import React, { createContext, useReducer, useCallback } from 'react';
import { commentService } from '../services/commentService';

export const CommentsContext = createContext();

const initialState = {
  comments: [],
  isLoading: false,
  error: null,
  replyingTo: null,
  editingComment: null
};

const commentsReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_COMMENTS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_COMMENTS_SUCCESS':
      return { ...state, isLoading: false, comments: action.payload };
    case 'FETCH_COMMENTS_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    
    case 'ADD_COMMENT':
      return { ...state, comments: [...state.comments, action.payload] };
    
    case 'UPDATE_COMMENT':
      return { 
        ...state, 
        comments: state.comments.map(c => c.id === action.payload.id ? action.payload : c),
        editingComment: null
      };
      
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(c => c.id !== action.payload)
      };

    case 'SET_REPLYING_TO':
      return { ...state, replyingTo: action.payload };
      
    case 'SET_EDITING_COMMENT':
      return { ...state, editingComment: action.payload };

    default:
      return state;
  }
};

export const CommentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(commentsReducer, initialState);

  const fetchComments = useCallback(async (documentId) => {
    dispatch({ type: 'FETCH_COMMENTS_START' });
    try {
      const data = await commentService.getCommentsByDocumentId(documentId);
      dispatch({ type: 'FETCH_COMMENTS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_COMMENTS_FAILURE', payload: error.message });
    }
  }, []);

  const addComment = async (commentData) => {
    try {
      const newComment = await commentService.createComment(commentData);
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
      return newComment;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateComment = async (id, commentData) => {
    try {
      const updatedComment = await commentService.updateComment(id, commentData);
      dispatch({ type: 'UPDATE_COMMENT', payload: updatedComment });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const deleteComment = async (id) => {
    try {
      await commentService.deleteComment(id);
      dispatch({ type: 'DELETE_COMMENT', payload: id });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const setReplyingTo = (commentId) => dispatch({ type: 'SET_REPLYING_TO', payload: commentId });
  const setEditingComment = (commentId) => dispatch({ type: 'SET_EDITING_COMMENT', payload: commentId });

  return (
    <CommentsContext.Provider value={{
      ...state,
      fetchComments,
      addComment,
      updateComment,
      deleteComment,
      setReplyingTo,
      setEditingComment
    }}>
      {children}
    </CommentsContext.Provider>
  );
};
