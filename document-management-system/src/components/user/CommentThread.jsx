import React, { useState } from 'react';
import CommentItem from './CommentItem';

const CommentThread = ({ comment, allComments, documentId, depth = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const maxDepth = 4;

  // Find direct children of this comment
  const replies = allComments.filter(c => c.parentId === comment.id)
                             .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const hasReplies = replies.length > 0;

  return (
    <div className={`mt-2 ${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-gray-100 pl-2 sm:pl-4' : ''}`}>
      <CommentItem comment={comment} documentId={documentId} />
      
      {hasReplies && (
        <div className="mt-1">
          {depth >= maxDepth ? (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-blue-600 font-medium hover:underline mb-2"
            >
              {isCollapsed ? `Show ${replies.length} replies` : 'Hide replies'}
            </button>
          ) : null}

          {(!isCollapsed || depth < maxDepth) && (
            <div className="flex flex-col gap-1">
              {replies.map(reply => (
                <CommentThread 
                  key={reply.id} 
                  comment={reply} 
                  allComments={allComments} 
                  documentId={documentId}
                  depth={depth + 1} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentThread;
