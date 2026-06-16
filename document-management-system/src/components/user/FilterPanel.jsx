import React from 'react';
import MultiSelect from '../common/MultiSelect';
import Button from '../common/Button';

const FilterPanel = ({
  filters,
  categories,
  departments,
  onFilterChange,
  onClearFilters
}) => {
  const categoryOptions = categories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.id }));
  const departmentOptions = departments.map(d => ({ label: d.name, value: d.id }));
  
  const fileTypeOptions = [
    { label: '📄 PDF', value: 'PDF' },
    { label: '📝 DOCX', value: 'DOCX' },
    { label: '📊 XLSX', value: 'XLSX' },
    { label: '🖼️ Image', value: 'PNG,JPG,JPEG' },
  ];

  const handleMultiSelectChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.departments?.length) count += filters.departments.length;
    if (filters.fileTypes?.length) count += filters.fileTypes.length;
    return count;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Filters</h3>
        {getActiveFilterCount() > 0 && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Clear All ({getActiveFilterCount()})
          </button>
        )}
      </div>

      <div className="space-y-4">
        <MultiSelect
          label="Categories"
          options={categoryOptions}
          value={filters.categories || []}
          onChange={(val) => handleMultiSelectChange('categories', val)}
          placeholder="Filter by category"
        />

        <MultiSelect
          label="Departments"
          options={departmentOptions}
          value={filters.departments || []}
          onChange={(val) => handleMultiSelectChange('departments', val)}
          placeholder="Filter by department"
        />

        <MultiSelect
          label="File Type"
          options={fileTypeOptions}
          value={filters.fileTypes || []}
          onChange={(val) => handleMultiSelectChange('fileTypes', val)}
          placeholder="Filter by file type"
        />

        {/* Date Filter could go here. Simplifying for now as MultiSelect covers core needs. */}
      </div>
    </div>
  );
};

export default FilterPanel;
