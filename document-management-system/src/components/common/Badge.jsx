import React from 'react';

const Badge = ({ variant = 'info', children, className = '' }) => {
  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  const selectedClass = variantClasses[variant] || variantClasses.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
