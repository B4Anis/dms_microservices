import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import MultiSelect from '../common/MultiSelect';
import SearchInput from '../common/SearchInput';
import LoadingSpinner from '../common/LoadingSpinner';
import { useUsers } from '../../hooks/useUsers';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../contexts/ToastContext';

const DepartmentUsersModal = ({ isOpen, onClose, department, onUsersChanged }) => {
  const { users } = useUsers(); // All users globally
  const { showSuccess, showError } = useToast();
  
  const [deptUsers, setDeptUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Users Mode
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState([]);

  const fetchDeptUsers = async () => {
    if (!department) return;
    setIsLoading(true);
    try {
      const u = await departmentService.getDepartmentUsers(department.id);
      setDeptUsers(u);
    } catch (err) {
      showError('Failed to fetch assigned users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && department) {
      fetchDeptUsers();
      setIsAddingUsers(false);
      setSelectedUserIdsToAdd([]);
      setSearchQuery('');
    }
  }, [isOpen, department]);

  const handleRemoveUser = async (userId) => {
    try {
      await departmentService.removeUserFromDepartment(userId, department.id);
      showSuccess('User removed from department');
      fetchDeptUsers();
      onUsersChanged();
    } catch (err) {
      showError('Failed to remove user');
    }
  };

  const handleAddUsers = async () => {
    if (selectedUserIdsToAdd.length === 0) return;
    try {
      setIsLoading(true);
      const promises = selectedUserIdsToAdd.map(id => departmentService.addUserToDepartment(id, department.id));
      await Promise.all(promises);
      showSuccess(`${selectedUserIdsToAdd.length} users added to department`);
      setIsAddingUsers(false);
      fetchDeptUsers();
      onUsersChanged();
    } catch (err) {
      showError('Failed to add users');
      setIsLoading(false);
    }
  };

  const filteredDeptUsers = deptUsers.filter(u => 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available users for adding (excluding those already in dept)
  const availableUsersForAdd = users
    .filter(u => !deptUsers.some(du => du.id === u.id))
    .map(u => ({ label: `${u.firstName} ${u.lastName} (${u.email})`, value: u.id }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Users - ${department?.name}`} size="lg">
      
      {isAddingUsers ? (
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm">
            Select users below to grant them access to the <strong>{department?.name}</strong> department.
          </div>
          
          <div className="min-h-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Employees</label>
            <MultiSelect 
              options={availableUsersForAdd}
              value={selectedUserIdsToAdd}
              onChange={setSelectedUserIdsToAdd}
              placeholder="Search and select users..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => { setIsAddingUsers(false); setSelectedUserIdsToAdd([]); }}>Back</Button>
            <Button variant="primary" onClick={handleAddUsers} disabled={selectedUserIdsToAdd.length === 0}>
              Add {selectedUserIdsToAdd.length} Users
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
              <SearchInput 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search assigned users..." 
              />
            </div>
            <Button variant="primary" onClick={() => setIsAddingUsers(true)}>+ Assign Users</Button>
          </div>

          {isLoading ? (
            <div className="py-12"><LoadingSpinner /></div>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {filteredDeptUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users found in this department.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredDeptUsers.map(user => (
                    <li key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-right mt-2">
            Total assigned: {deptUsers.length}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DepartmentUsersModal;
