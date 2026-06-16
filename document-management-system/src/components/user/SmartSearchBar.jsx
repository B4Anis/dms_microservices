import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseSearchQuery } from '../../utils/searchQueryParser';
import { fuzzyMatch } from '../../utils/fuzzyMatch';
import { useSearchHistory } from '../../hooks/useSearchHistory';

// -------------------------------------------------------------------
// Filter Chip
// -------------------------------------------------------------------
const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
    {label}
    <button
      onClick={onRemove}
      className="ml-0.5 hover:text-blue-900 transition-colors"
      aria-label={`Remove filter ${label}`}
    >
      ×
    </button>
  </span>
);

// -------------------------------------------------------------------
// SmartSearchBar
// -------------------------------------------------------------------
const SmartSearchBar = ({
  value,
  onChange,
  onParsedFilters,
  categories = [],
  departments = [],
  documents = [],
  placeholder = 'Search... or try "PDFs from last week"',
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [parsedTokens, setParsedTokens] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  const { getSearchHistory, addSearch, getSavedSearches, saveSearch, deleteSavedSearch } =
    useSearchHistory();

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build suggestions
  const buildSuggestions = useCallback(
    (query) => {
      if (!query.trim()) {
        // Show recent + saved searches
        const recent = getSearchHistory().map(q => ({ type: 'recent', label: q, value: q }));
        const saved = getSavedSearches().map(s => ({
          type: 'saved',
          label: s.name,
          value: s.query,
        }));
        return [...saved.slice(0, 3), ...recent.slice(0, 5)];
      }

      const q = query.toLowerCase();
      const results = [];

      // Documents (fuzzy)
      documents
        .filter(d => fuzzyMatch(q, d.title))
        .slice(0, 4)
        .forEach(d => results.push({ type: 'document', label: d.title, value: d.title, id: d.id }));

      // Categories
      categories
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach(c =>
          results.push({ type: 'category', label: `${c.icon} ${c.name}`, value: c.name })
        );

      // Departments
      departments
        .filter(d => d.name.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach(d => results.push({ type: 'department', label: `🏢 ${d.name}`, value: d.name }));

      // Tags
      const allTags = [...new Set(documents.flatMap(d => d.tags || []))];
      allTags
        .filter(t => t.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(t => results.push({ type: 'tag', label: `🏷️ ${t}`, value: t }));

      return results.slice(0, 8);
    },
    [documents, categories, departments, getSearchHistory, getSavedSearches]
  );

  // Debounced suggestion update
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setActiveIndex(-1);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSuggestions(buildSuggestions(val));
    }, 120);
  };

  // Commit a search
  const commitSearch = useCallback(
    (query) => {
      if (!query.trim()) {
        onChange('');
        onParsedFilters?.({ search: '', dateRange: null, fileTypes: [], departments: [], categories: [], parsedTokens: [] });
        setParsedTokens([]);
        return;
      }

      addSearch(query);
      const parsed = parseSearchQuery(query, departments, categories);
      setParsedTokens(parsed.parsedTokens || []);

      // Propagate parsed filters
      onParsedFilters?.(parsed);
      onChange(parsed.search);
      setIsFocused(false);
    },
    [onChange, onParsedFilters, addSearch, departments, categories]
  );

  const handleKeyDown = (e) => {
    if (!isFocused) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          const selected = suggestions[activeIndex];
          setInputValue(selected.value);
          commitSearch(selected.value);
        } else {
          commitSearch(inputValue);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.value);
    commitSearch(suggestion.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setSuggestions(buildSuggestions(inputValue));
  };

  const handleClear = () => {
    setInputValue('');
    setParsedTokens([]);
    onChange('');
    onParsedFilters?.({ search: '', dateRange: null, fileTypes: [], departments: [], categories: [], parsedTokens: [] });
    inputRef.current?.focus();
  };

  const removeToken = (token) => {
    const newTokens = parsedTokens.filter(t => t !== token);
    setParsedTokens(newTokens);
    // Re-parse without that token (simplistic: just clear all parsed filters and re-run plain search)
    if (newTokens.length === 0) {
      onParsedFilters?.({ search: inputValue, dateRange: null, fileTypes: [], departments: [], categories: [], parsedTokens: [] });
    }
  };

  const handleSave = () => {
    if (saveName.trim()) {
      saveSearch(saveName.trim(), inputValue);
      setShowSaveDialog(false);
      setSaveName('');
    }
  };

  const typeColors = {
    document: 'text-blue-600',
    category: 'text-purple-600',
    department: 'text-green-600',
    tag: 'text-orange-600',
    recent: 'text-gray-500',
    saved: 'text-yellow-600',
  };
  const typeIcons = {
    document: '📄',
    category: '📁',
    department: '🏢',
    tag: '🏷️',
    recent: '🕐',
    saved: '⭐',
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Search Input */}
      <div className={`flex items-center gap-2 px-3 py-2.5 bg-white border-2 rounded-xl transition-all ${
        isFocused ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Search icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-400"
          aria-label="Smart search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />

        {/* Clear button */}
        {inputValue && (
          <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Save search button */}
        {inputValue && (
          <button
            onClick={() => setShowSaveDialog(true)}
            title="Save this search"
            className="text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => commitSearch(inputValue)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          Search
        </button>
      </div>

      {/* NLP Filter Chips */}
      {parsedTokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-gray-500 self-center">Detected:</span>
          {parsedTokens.map((token) => (
            <FilterChip key={token} label={token} onRemove={() => removeToken(token)} />
          ))}
        </div>
      )}

      {/* Help text */}
      {!isFocused && !inputValue && (
        <p className="text-xs text-gray-400 mt-1 ml-1">
          💡 Try: "PDFs from last week", "reports in engineering", "excel this year"
        </p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Group headers */}
          {['saved', 'recent', 'document', 'category', 'department', 'tag'].map(type => {
            const group = suggestions.filter(s => s.type === type);
            if (!group.length) return null;

            const groupLabel = {
              saved: '⭐ Saved Searches',
              recent: '🕐 Recent Searches',
              document: '📄 Documents',
              category: '📁 Categories',
              department: '🏢 Departments',
              tag: '🏷️ Tags',
            }[type];

            return (
              <div key={type}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  {groupLabel}
                </div>
                {group.map((suggestion) => {
                  const idx = suggestions.indexOf(suggestion);
                  return (
                    <button
                      key={`${type}-${suggestion.label}`}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                        idx === activeIndex ? 'bg-blue-50' : ''
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className={typeColors[type]}>{typeIcons[type]}</span>
                      <span className="text-gray-700 truncate">{suggestion.label}</span>
                      {type === 'saved' && (
                        <button
                          className="ml-auto text-gray-300 hover:text-red-500 transition-colors text-xs"
                          onMouseDown={e => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); deleteSavedSearch(suggestion.label); setSuggestions(buildSuggestions(inputValue)); }}
                          aria-label="Delete saved search"
                        >
                          🗑️
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Save search dialog */}
      {showSaveDialog && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-72">
          <p className="text-sm font-semibold text-gray-800 mb-2">Save this search</p>
          <input
            autoFocus
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveDialog(false); }}
            placeholder="Give it a name..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;
