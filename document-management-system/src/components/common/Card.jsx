import React from 'react';

const Card = ({ title, actions, children, hoverable = false, onClick, className = '' }) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden';
  const hoverClasses = hoverable ? 'transition-shadow duration-300 hover:shadow-md cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          {title && <h3 className="text-lg font-medium text-gray-900 m-0">{title}</h3>}
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
