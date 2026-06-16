import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import FormGroup from '../common/FormGroup';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../../contexts/ToastContext';

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
const PRESET_ICONS = ['📊', '📋', '📁', '📝', '🗂️', '📄', '💰', '🔍', '👥', '🔒', '🎨', '⚙️', '🚀', '📈', '🌐'];

const CategoryFormModal = ({ isOpen, onClose, category = null, allCategories = [], onSuccess, defaultParentId = null }) => {
  const isEditMode = !!category;
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null,
    icon: '📁',
    color: '#3B82F6',
    order: 1
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
          icon: category.icon || '📁',
          color: category.color || '#3B82F6',
          order: category.order || 1
        });
      } else {
        setFormData({
          name: '',
          description: '',
          parentId: defaultParentId,
          icon: '📁',
          color: '#3B82F6',
          order: allCategories.filter(c => !c.parentId).length + 1
        });
      }
      setErrors({});
    }
  }, [isOpen, category, defaultParentId, allCategories]);

  // Get all descendant IDs to prevent circular references
  const getDescendantIds = (id) => categoryService.getDescendantIds(id, allCategories);

  // Build flat list of valid parent options (exclude self + descendants)
  const getParentOptions = () => {
    const excludeIds = category ? new Set([category.id, ...getDescendantIds(category.id)]) : new Set();
    
    const buildOptions = (parentId, level) => {
      return allCategories
        .filter(c => c.parentId === parentId && !excludeIds.has(c.id))
        .sort((a, b) => a.order - b.order)
        .flatMap(c => [
          { label: `${'　'.repeat(level)}${c.icon || ''} ${c.name}`, value: c.id },
          ...buildOptions(c.id, level + 1)
        ]);
    };

    return [
      { label: '-- None (Top Level) --', value: '' },
      ...buildOptions(null, 0)
    ];
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else {
      const isDuplicate = allCategories.some(
        c => c.name.toLowerCase() === formData.name.toLowerCase() &&
             c.parentId === (formData.parentId || null) &&
             c.id !== category?.id
      );
      if (isDuplicate) newErrors.name = 'A category with this name already exists under the same parent';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData, parentId: formData.parentId || null };
      if (isEditMode) {
        await categoryService.updateCategory(category.id, payload);
        showSuccess('Category updated');
      } else {
        await categoryService.createCategory({
          ...payload,
          id: Math.random().toString(36).substring(2, 9)
        });
        showSuccess('Category created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      title={isEditMode ? `Edit "${category?.name}"` : 'Create Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Category Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          autoFocus
        />

        <FormGroup label="Description (Optional)">
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="What kind of documents belong here?"
          />
        </FormGroup>

        <FormGroup label="Parent Category">
          <select
            name="parentId"
            value={formData.parentId || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {getParentOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormGroup>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Theme Color">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer p-1"
              />
              <div className="flex gap-1 flex-wrap ml-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${formData.color === c ? 'border-gray-900 scale-110' : 'border-transparent'} transition-transform`}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                  />
                ))}
              </div>
            </div>
          </FormGroup>

          <FormGroup label="Icon">
            <div className="flex gap-1.5 flex-wrap max-h-20 overflow-y-auto">
              {PRESET_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  className={`text-xl p-1 rounded transition-all ${formData.icon === i ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100 opacity-60 hover:opacity-100'}`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: i }))}
                >
                  {i}
                </button>
              ))}
            </div>
          </FormGroup>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: formData.color + '22', color: formData.color }}>
            {formData.icon}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{formData.name || 'Category Preview'}</p>
            {formData.parentId && <p className="text-xs text-gray-500">
              Under: {allCategories.find(c => c.id === formData.parentId)?.name || ''}
            </p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
