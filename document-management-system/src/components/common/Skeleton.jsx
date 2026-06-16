import React from 'react';

// Base skeleton line
export const SkeletonLine = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Document card skeleton
export const DocumentCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
    <div className="flex items-center gap-3">
      <SkeletonLine className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonLine className="h-3 w-full" />
    <SkeletonLine className="h-3 w-5/6" />
    <div className="flex gap-2 pt-1">
      <SkeletonLine className="h-5 w-14 rounded-full" />
      <SkeletonLine className="h-5 w-14 rounded-full" />
    </div>
    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4 whitespace-nowrap">
        <SkeletonLine className={`h-4 ${i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'w-20'}`} />
      </td>
    ))}
  </tr>
);

// Comment skeleton
export const CommentSkeleton = () => (
  <div className="flex gap-3 py-4 border-b border-gray-100">
    <SkeletonLine className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-3 w-16" />
      </div>
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-4/5" />
    </div>
  </div>
);

// Grid of document card skeletons
export const DocumentGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <DocumentCardSkeleton key={i} />
    ))}
  </div>
);

// Table body of skeleton rows
export const TableSkeleton = ({ rows = 8, cols = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} cols={cols} />
    ))}
  </>
);

export default SkeletonLine;
