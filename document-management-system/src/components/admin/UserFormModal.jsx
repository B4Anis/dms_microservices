import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import MultiSelect from '../common/MultiSelect';
import FormGroup from '../common/FormGroup';
import { useUsers } from '../../hooks/useUsers';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  let score = 0;
  if (password.length > 7) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let color = 'bg-red-500';
  let label = 'Weak';
  
  if (score >= 3) {
    color = 'bg-green-500';
    label = 'Strong';
  } else if (score === 2) {
    color = 'bg-yellow-500';
    label = 'Medium';
  }

  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1.5 w-full mb-1">
        <div className={`flex-1 rounded-full ${score >= 1 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 2 ? color : 'bg-gray-200'}`}></div>
        <div className={`flex-1 rounded-full ${score >= 3 ? color : 'bg-gray-200'}`}></div>
      </div>
      <p className={`text-xs ${color.replace('bg-', 'text-')}`}>{label}</p>
    </div>
  );
};

const UserFormModal = ({ isOpen, onClose, user = null }) => {
  const isEditMode = !!user;
  const { departments, fetchUsers, users } = useUsers();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    status: 'active',
    password: '',
    confirmPassword: '',
    departments: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          password: '',
          confirmPassword: '',
          departments: user.departments || [],
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'user',
          status: 'active',
          password: '',
          confirmPassword: '',
          departments: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error on type
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleDepartmentsChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, departments: selectedIds }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else {
      // Check for duplicates
      const isDuplicate = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== user?.id);
      if (isDuplicate) newErrors.email = 'This email is already registered';
    }

    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        departments: formData.departments,
      };

      if (formData.password) {
        payload.password = formData.password; // In real app, never send plain text, handle server side
      }

      if (isEditMode) {
        await userService.updateUser(user.id, payload);
        showSuccess('User updated successfully');
      } else {
        await userService.createUser({ ...payload, id: Math.random().toString(36).substring(2, 9) });
        showSuccess('User created successfully');
      }
      
      fetchUsers(); // Refresh global user list
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentOptions = departments.map(d => ({ label: d.name, value: d.id }));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={isSubmitting ? undefined : onClose} 
      title={isEditMode ? 'Edit User' : 'Add New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        
        {/* Profile Picture Placeholder */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
            {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
          </div>
          <div>
            <Button variant="secondary" size="sm" type="button" disabled>Upload Photo</Button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB (Mocked)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="First Name" 
            name="firstName"
            value={formData.firstName} 
            onChange={handleChange}
            error={errors.firstName}
            required 
          />
          <Input 
            label="Last Name" 
            name="lastName"
            value={formData.lastName} 
            onChange={handleChange}
            error={errors.lastName}
            required 
          />
        </div>

        <Input 
          label="Email Address" 
          type="email"
          name="email"
          value={formData.email} 
          onChange={handleChange}
          error={errors.email}
          required 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select 
            label="Role" 
            name="role"
            value={formData.role} 
            onChange={handleChange}
            options={[
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' }
            ]}
          />
          <Select 
            label="Status" 
            name="status"
            value={formData.status} 
            onChange={handleChange}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' }
            ]}
          />
        </div>

        <FormGroup label="Department Assignment">
          <MultiSelect 
            options={departmentOptions}
            value={formData.departments}
            onChange={handleDepartmentsChange}
            placeholder="Select departments..."
          />
        </FormGroup>

        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            {isEditMode ? 'Change Password (Optional)' : 'Security'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input 
                label="Password" 
                type="password"
                name="password"
                value={formData.password} 
                onChange={handleChange}
                error={errors.password}
                required={!isEditMode}
              />
              <PasswordStrength password={formData.password} />
            </div>
            <Input 
              label="Confirm Password" 
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange}
              error={errors.confirmPassword}
              required={!isEditMode || formData.password.length > 0}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
