import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../contexts/ToastContext';
import { useUsers } from '../../hooks/useUsers';
import DepartmentCard from '../../components/admin/DepartmentCard';
import DepartmentFormModal from '../../components/admin/DepartmentFormModal';
import DepartmentUsersModal from '../../components/admin/DepartmentUsersModal';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';

const DepartmentManagementPage = () => {
  const { showSuccess, showError } = useToast();
  const { fetchUsers } = useUsers(); // Refresh global users after updates
  
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [activeDeptForUsers, setActiveDeptForUsers] = useState(null);

  // Deletion logic state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
      // Also fetch users to keep context fresh
      fetchUsers();
    } catch (err) {
      showError('Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params, { replace: true });
  }, [searchQuery, setSearchParams]);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    return departments.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [departments, searchQuery]);

  // Handlers
  const handleEdit = (dept) => {
    setEditingDept(dept);
    setIsFormOpen(true);
  };

  const handleViewUsers = (dept) => {
    setActiveDeptForUsers(dept);
    setIsUsersModalOpen(true);
  };

  const handleDeleteRequest = (dept, currentUsersCount) => {
    setDeptToDelete({ ...dept, usersCount: currentUsersCount });
    setTransferTargetId('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deptToDelete.usersCount > 0) {
        if (!transferTargetId) {
          showError('You must select a department to transfer existing users to.');
          setIsDeleting(false);
          return;
        }
        await departmentService.transferUsersAndArchive(deptToDelete.id, transferTargetId);
        showSuccess(`Department deleted and ${deptToDelete.usersCount} users transferred.`);
      } else {
        await departmentService.deleteDepartment(deptToDelete.id);
        showSuccess('Department deleted successfully.');
      }
      setIsDeleteModalOpen(false);
      fetchDepartments();
    } catch (err) {
      showError('Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  const availableTransferTargets = departments
    .filter(d => d.id !== deptToDelete?.id)
    .map(d => ({ label: d.name, value: d.id }));

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* HEADER */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Department Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage organizational units and user assignments.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <Button variant="primary" onClick={() => { setEditingDept(null); setIsFormOpen(true); }}>
            + Add Department
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 max-w-md">
        <SearchInput 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search departments..." 
        />
      </div>

      {/* LIST */}
      {isLoading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No departments found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map(dept => (
            <DepartmentCard 
              key={dept.id} 
              department={dept} 
              onEdit={handleEdit}
              onViewUsers={handleViewUsers}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* MODALS */}
      <DepartmentFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        department={editingDept}
        allDepartments={departments}
        onSuccess={fetchDepartments}
      />

      <DepartmentUsersModal 
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        department={activeDeptForUsers}
        onUsersChanged={() => {}} // Could trigger partial refetch if needed
      />

      {/* DELETE/TRANSFER MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={isDeleting ? undefined : () => setIsDeleteModalOpen(false)} title="Archive / Delete Department">
        <div className="space-y-4">
          <div className="bg-red-50 text-red-800 p-3 rounded text-sm">
            You are about to delete the <strong>{deptToDelete?.name}</strong> department. This action cannot be fully undone.
          </div>

          {deptToDelete?.usersCount > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                This department currently has <span className="font-bold">{deptToDelete.usersCount} users</span> assigned to it. 
                You must transfer these users to another department before deletion.
              </p>
              <Select 
                label="Transfer users to:"
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                options={[{ label: '-- Select Target Department --', value: '' }, ...availableTransferTargets]}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              There are no users assigned to this department. It is safe to delete.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete} 
              loading={isDeleting}
              disabled={deptToDelete?.usersCount > 0 && !transferTargetId}
            >
              {deptToDelete?.usersCount > 0 ? 'Transfer Users & Delete' : 'Delete Department'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default DepartmentManagementPage;
