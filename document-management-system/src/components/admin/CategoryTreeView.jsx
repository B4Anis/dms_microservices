import React, { useState } from 'react';
import Badge from '../common/Badge';
import DropdownMenu from '../common/DropdownMenu';

// Recursive single category node
const CategoryNode = ({ category, allCategories, documentCounts, level, onEdit, onAddChild, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allCategories
    .filter(c => c.parentId === category.id)
    .sort((a, b) => a.order - b.order);

  const docCount = documentCounts[category.id] || 0;

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className={`flex items-center justify-between py-3 px-3 rounded-lg group hover:bg-gray-50 transition-colors ${level === 0 ? 'border border-gray-200 mb-2 shadow-sm bg-white' : 'mb-1'}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Expand/collapse toggle */}
          {children.length > 0 ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-700 w-5 h-5 flex-shrink-0 flex items-center justify-center"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {/* Category icon + color swatch */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: category.color + '22', color: category.color }}
          >
            {category.icon || '📁'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium text-gray-900 truncate ${level === 0 ? 'text-base' : 'text-sm'}`}>
                {category.name}
              </span>
              {docCount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                  {docCount} docs
                </span>
              )}
              {children.length > 0 && !isExpanded && (
                <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                  {children.length} sub
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-xs text-gray-500 truncate">{category.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
          <DropdownMenu
            trigger={
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            }
            items={[
              { label: '+ Add Subcategory', onClick: () => onAddChild(category) },
              { label: 'Edit Category', onClick: () => onEdit(category) },
              { label: 'Delete Category', onClick: () => onDelete(category, docCount, children.length) }
            ]}
          />
        </div>
      </div>

      {/* Recurse into children */}
      {isExpanded && children.length > 0 && (
        <div className="mt-1 mb-3">
          {children.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              documentCounts={documentCounts}
              level={level + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTreeView = ({ allCategories, documentCounts, onEdit, onAddChild, onDelete }) => {
  const rootCategories = allCategories
    .filter(c => !c.parentId)
    .sort((a, b) => a.order - b.order);

  if (rootCategories.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">📂</p>
        <p className="font-medium">No categories yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootCategories.map(cat => (
        <CategoryNode
          key={cat.id}
          category={cat}
          allCategories={allCategories}
          documentCounts={documentCounts}
          level={0}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CategoryTreeView;
