import React, { forwardRef } from 'react';
import FormGroup from './FormGroup';

const Select = forwardRef(({
  options = [],
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  id,
  ...rest
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = `
    block w-full pl-3 pr-10 py-2 text-base border sm:text-sm rounded-md focus:outline-none transition-colors
    ${error 
      ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const selectElement = (
    <select
      ref={ref}
      id={selectId}
      disabled={disabled}
      required={required}
      className={selectClasses}
      aria-invalid={error ? 'true' : 'false'}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!label && !error && !helperText) {
    return selectElement;
  }

  return (
    <FormGroup label={label} error={error} required={required} helperText={helperText}>
      {selectElement}
    </FormGroup>
  );
});

Select.displayName = 'Select';

export default Select;
