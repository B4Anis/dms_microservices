import React, { useState, useEffect } from 'react';
import Button from '../common/Button';

const CommentForm = ({ 
  initialValue = '', 
  onSubmit, 
  onCancel, 
  submitLabel = 'Add Comment',
  autoFocus = false
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 2000;

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.length > maxLength) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent(''); // Clear form on success if it's a new comment
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-2">
        <textarea
          autoFocus={autoFocus}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] ${
            content.length > maxLength ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Write a comment... (use @ to mention someone)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`text-xs ${content.length > maxLength ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
          {content.length}/{maxLength} characters
        </span>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            variant="primary" 
            size="sm" 
            disabled={!content.trim() || content.length > maxLength || isSubmitting}
            loading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
