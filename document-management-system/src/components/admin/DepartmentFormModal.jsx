import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import FormGroup from '../common/FormGroup';
import { useUsers } from '../../hooks/useUsers';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../contexts/ToastContext';

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const PRESET_ICONS = ['🏢', '💻', '📈', '🤝', '⚙️', '🎨', '🛡️', '📦'];

const DepartmentFormModal = ({ isOpen, onClose, department = null, allDepartments = [], onSuccess }) => {
  const isEditMode = !!department;
  const { users } = useUsers();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    color: '#3B82F6',
    icon: '🏢'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (department) {
        setFormData({
          name: department.name,
          description: department.description || '',
          managerId: department.managerId || '',
          color: department.color || '#3B82F6',
          icon: department.icon || '🏢'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          managerId: '',
          color: '#3B82F6',
          icon: '🏢'
        });
      }
      setErrors({});
    }
  }, [isOpen, department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else {
      const isDuplicate = allDepartments.some(d => d.name.toLowerCase() === formData.name.toLowerCase() && d.id !== department?.id);
      if (isDuplicate) newErrors.name = 'A department with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await departmentService.updateDepartment(department.id, formData);
        showSuccess('Department updated');
      } else {
        await departmentService.createDepartment({ ...formData, id: Math.random().toString(36).substring(2, 9) });
        showSuccess('Department created');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      showError('Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={isSubmitting ? undefined : onClose} 
      title={isEditMode ? 'Edit Department' : 'Create Department'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <Input 
          label="Department Name" 
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
            rows="3"
            placeholder="What does this department do?"
          />
        </FormGroup>

        <Select 
          label="Department Manager" 
          name="managerId"
          value={formData.managerId} 
          onChange={handleChange}
          options={[
            { label: '-- Unassigned --', value: '' },
            ...users.map(u => ({ label: `${u.firstName} ${u.lastName} (${u.email})`, value: u.id }))
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Theme Color">
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                name="color"
                value={formData.color} 
                onChange={handleChange}
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer p-1"
              />
              <div className="flex gap-1 flex-wrap flex-1 ml-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${formData.color === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                  />
                ))}
              </div>
            </div>
          </FormGroup>

          <FormGroup label="Icon">
            <div className="flex gap-2 flex-wrap items-center h-10">
              {PRESET_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  className={`text-xl hover:scale-110 transition-transform ${formData.icon === i ? 'ring-2 ring-blue-500 rounded bg-blue-50' : 'opacity-60 hover:opacity-100'}`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: i }))}
                >
                  {i}
                </button>
              ))}
            </div>
          </FormGroup>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentFormModal;
