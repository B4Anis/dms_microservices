import React, { useState, useRef, useEffect } from 'react';
import FormGroup from './FormGroup';

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  helperText,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectContent = (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`min-h-[38px] flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer ${
          error ? 'border-red-300' : 'border-gray-300'
        } bg-white`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden">
          {value.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            <>
              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                {value.length} selected
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                {options.filter(o => value.includes(o.value)).map(o => o.label).join(', ')}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {value.length > 0 && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              onClick={handleClearAll}
              title="Clear all"
            >
              &times;
            </button>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            <ul className="py-1">
              {options.map((option) => (
                <li
                  key={option.value}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                  onClick={() => handleToggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={value.includes(option.value)}
                    readOnly
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  if (!label && !error && !helperText) {
    return selectContent;
  }

  return (
    <FormGroup label={label} error={error} required={required} helperText={helperText}>
      {selectContent}
    </FormGroup>
  );
};

export default MultiSelect;
