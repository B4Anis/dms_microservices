import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useComments } from '../../hooks/useComments';
import CommentForm from './CommentForm';
import Modal from '../common/Modal';
import Button from '../common/Button';

const CommentItem = ({ comment, documentId }) => {
  const { user } = useAuth();
  const { 
    replyingTo, 
    setReplyingTo, 
    editingComment, 
    setEditingComment,
    addComment,
    updateComment,
    deleteComment
  } = useComments();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isOwner = user?.id === comment.userId;
  const isEditing = editingComment === comment.id;
  const isReplying = replyingTo === comment.id;

  const dateStr = new Date(comment.createdAt).toLocaleString();
  
  // Format mentions (simple regex to bold @usernames)
  const formatContent = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    if (parts.length === 1) return text;

    return text.split(/(?<=\s|^)@\w+/g).reduce((acc, part, i) => {
      const match = text.match(/(?<=\s|^)@\w+/g)?.[i];
      if (match) {
        return [...acc, part, <span key={i} className="text-blue-600 font-medium cursor-pointer hover:underline">{match}</span>];
      }
      return [...acc, part];
    }, []);
  };

  const handleReplySubmit = async (content) => {
    await addComment({
      documentId,
      userId: user.id,
      content,
      parentId: comment.id,
      createdAt: new Date().toISOString(),
      isEdited: false
    });
    setReplyingTo(null);
  };

  const handleEditSubmit = async (content) => {
    await updateComment(comment.id, {
      content,
      isEdited: true,
      updatedAt: new Date().toISOString()
    });
    setEditingComment(null);
  };

  const handleDelete = async () => {
    await deleteComment(comment.id);
    setIsDeleteModalOpen(false);
  };

  if (comment.content === '[deleted]') {
    return (
      <div className="py-3 text-sm text-gray-400 italic border-l-2 border-gray-200 pl-4 my-2">
        This comment was deleted.
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-gray-100 last:border-0 group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
            {comment.userId === '1' ? 'A' : 'U'} {/* Mock avatar logic */}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900">
                {comment.userId === '1' ? 'Admin User' : 'John Doe'}
              </span>
              <span className="text-xs text-gray-500">{dateStr}</span>
              {comment.isEdited && <span className="text-xs text-gray-400 italic">(edited)</span>}
            </div>
            
            {/* Action Menu (visible on hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {user && (
                <button onClick={() => setReplyingTo(comment.id)} className="text-xs text-gray-500 hover:text-blue-600">
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button onClick={() => setEditingComment(comment.id)} className="text-xs text-gray-500 hover:text-blue-600">
                    Edit
                  </button>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="text-xs text-gray-500 hover:text-red-600">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
            {isEditing ? (
              <div className="mt-2">
                <CommentForm 
                  initialValue={comment.content}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditingComment(null)}
                  submitLabel="Save Changes"
                  autoFocus
                />
              </div>
            ) : (
              formatContent(comment.content)
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 ml-2 border-l-2 border-blue-200 pl-4">
              <CommentForm 
                onSubmit={handleReplySubmit}
                onCancel={() => setReplyingTo(null)}
                submitLabel="Post Reply"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Comment"
        size="sm"
      >
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to delete this comment? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default CommentItem;
