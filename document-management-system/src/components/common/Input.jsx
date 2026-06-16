import React, { forwardRef } from 'react';
import FormGroup from './FormGroup';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  id,
  ...rest
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = `
    appearance-none block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none transition-colors
    ${error 
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const inputElement = (
    <input
      ref={ref}
      id={inputId}
      type={type}
      disabled={disabled}
      required={required}
      className={inputClasses}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
      {...rest}
    />
  );

  if (!label && !error && !helperText) {
    return inputElement;
  }

  return (
    <FormGroup label={label} error={error} required={required} helperText={helperText}>
      {inputElement}
    </FormGroup>
  );
});

Input.displayName = 'Input';

export default Input;
