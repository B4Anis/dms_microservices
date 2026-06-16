import React, { useEffect, useState } from 'react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';
import LoadingSpinner from '../common/LoadingSpinner';

const CommentsSection = ({ documentId }) => {
  const { user } = useAuth();
  const { comments, isLoading, fetchComments, addComment } = useComments();
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (documentId) {
      fetchComments(documentId);
      
      // Simulate real-time polling
      const interval = setInterval(() => {
        fetchComments(documentId);
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [documentId, fetchComments]);

  const handleNewComment = async (content) => {
    await addComment({
      docId: documentId,
      author: user.email || user.firstName || String(user.id),
      content,
    });
  };

  // Get only top-level comments
  const rootComments = comments.filter(c => !c.parentId);

  // Apply sorting
  const sortedRootComments = [...rootComments].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    
    if (sortBy === 'newest') return dateB - dateA;
    if (sortBy === 'oldest') return dateA - dateB;
    
    // Sort by replies count
    if (sortBy === 'replies') {
      const repliesA = comments.filter(c => c.parentId === a.id).length;
      const repliesB = comments.filter(c => c.parentId === b.id).length;
      return repliesB - repliesA;
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
        {comments.length > 0 && (
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border-gray-300 rounded-md py-1 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="replies">Most Replies</option>
          </select>
        )}
      </div>

      {user ? (
        <div className="mb-8 flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              {user.firstName?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="flex-1">
            <CommentForm onSubmit={handleNewComment} />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-center text-gray-600">
          Please log in to leave a comment.
        </div>
      )}

      {isLoading && comments.length === 0 ? (
        <div className="py-8"><LoadingSpinner /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No comments yet. Be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRootComments.map(comment => (
            <CommentThread 
              key={comment.id} 
              comment={comment} 
              allComments={comments}
              documentId={documentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
