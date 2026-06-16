import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import UserFormModal from '../../components/admin/UserFormModal';
import ImportUsersWizard from '../../components/admin/ImportUsersWizard';

const UserManagementPage = () => {
  const { 
    users, 
    departments,
    isLoading, 
    filters,
    pagination,
    sortBy,
    sortOrder,
    selectedUserIds,
    fetchUsers,
    setSelectedUsers,
    updateFilters,
    updateSort,
    updatePagination,
    clearFilters
  } = useUsers();

  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  // Sync Context <-> URL logic
  useEffect(() => {
    fetchUsers();
    
    const urlSearch = searchParams.get('search') || '';
    const urlRole = searchParams.get('role') || '';
    const urlDept = searchParams.get('department') || '';
    const urlStatus = searchParams.get('status') || '';
    const urlPage = parseInt(searchParams.get('page')) || 1;
    const urlSort = searchParams.get('sort') || 'createdAt';
    const urlOrder = searchParams.get('order') || 'desc';

    updateFilters({ search: urlSearch, role: urlRole, department: urlDept, status: urlStatus });
    updatePagination({ currentPage: urlPage });
    updateSort({ sortBy: urlSort, sortOrder: urlOrder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.department) params.set('department', filters.department);
    if (filters.status) params.set('status', filters.status);
    if (pagination.currentPage > 1) params.set('page', pagination.currentPage.toString());
    if (sortBy !== 'createdAt') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    
    setSearchParams(params, { replace: true });
  }, [filters, pagination.currentPage, sortBy, sortOrder, setSearchParams]);

  // Client-Side Filtering & Sorting
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = !filters.search || 
        user.firstName.toLowerCase().includes(filters.search.toLowerCase()) || 
        user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const roleMatch = !filters.role || user.role === filters.role;
      const statusMatch = !filters.status || user.status === filters.status;
      const deptMatch = !filters.department || user.departments?.includes(filters.department);

      return searchMatch && roleMatch && statusMatch && deptMatch;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, filters, sortBy, sortOrder]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
  
  const currentUsers = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredUsers.slice(start, start + pagination.itemsPerPage);
  }, [filteredUsers, pagination.currentPage, pagination.itemsPerPage]);

  // Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(currentUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUserIds, id]);
    } else {
      setSelectedUsers(selectedUserIds.filter(userId => userId !== id));
    }
  };

  // Bulk Actions
  const handleBulkAction = async (actionFn, successMsg) => {
    if (!selectedUserIds.length) return;
    setIsProcessingBulk(true);
    try {
      await actionFn(selectedUserIds);
      showSuccess(successMsg);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      showError('Bulk action failed');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkSuspend = () => {
    if (window.confirm(`Suspend ${selectedUserIds.length} selected users?`)) {
      handleBulkAction(ids => userService.bulkSuspend(ids), 'Users suspended successfully');
    }
  };

  const handleBulkActivate = () => handleBulkAction(ids => userService.bulkActivate(ids), 'Users activated successfully');
  
  const handleBulkDelete = () => {
    if (window.confirm(`WARNING: Permanently delete ${selectedUserIds.length} users?`)) {
      handleBulkAction(ids => userService.bulkDelete(ids), 'Users deleted successfully');
    }
  };

  const handleExportCSV = () => {
    const usersToExport = selectedUserIds.length > 0 
      ? users.filter(u => selectedUserIds.includes(u.id))
      : filteredUsers;
    userService.exportUsersToCSV(usersToExport);
    showSuccess(`Exported ${usersToExport.length} users to CSV`);
  };

  // Individual Actions
  const handleToggleStatus = async (user) => {
    try {
      if (user.status === 'active') await userService.suspendUser(user.id);
      else await userService.activateUser(user.id);
      showSuccess(`User ${user.status === 'active' ? 'suspended' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      showError('Failed to update user status');
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Permanently delete ${user.firstName} ${user.lastName}?`)) {
      try {
        await userService.deleteUser(user.id);
        showSuccess('User deleted');
        fetchUsers();
      } catch (err) {
        showError('Failed to delete user');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-6">
      {/* HEADER */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">User Management</h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <Button variant="secondary" onClick={() => setIsImportWizardOpen(true)}>Import Users</Button>
          <Button variant="primary" onClick={() => { setEditingUser(null); setIsFormModalOpen(true); }}>+ Add User</Button>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput 
              value={filters.search} 
              onChange={(v) => updateFilters({ search: v })} 
              placeholder="Search by name or email..." 
            />
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filters.role}
              onChange={(e) => updateFilters({ role: e.target.value })}
              options={[{label: 'All Roles', value: ''}, {label: 'Admin', value: 'admin'}, {label: 'User', value: 'user'}]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filters.department}
              onChange={(e) => updateFilters({ department: e.target.value })}
              options={[{label: 'All Departments', value: ''}, ...departments.map(d => ({ label: d.name, value: d.id }))]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              options={[{label: 'All Statuses', value: ''}, {label: 'Active', value: 'active'}, {label: 'Suspended', value: 'suspended'}]}
            />
          </div>
        </div>
        
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.role && <Badge variant="info">Role: {filters.role} <span className="ml-1 cursor-pointer" onClick={()=>updateFilters({role:''})}>&times;</span></Badge>}
            {filters.status && <Badge variant="info">Status: {filters.status} <span className="ml-1 cursor-pointer" onClick={()=>updateFilters({status:''})}>&times;</span></Badge>}
            {filters.department && <Badge variant="info">Department: {departments.find(d=>d.id===filters.department)?.name} <span className="ml-1 cursor-pointer" onClick={()=>updateFilters({department:''})}>&times;</span></Badge>}
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium ml-2">Clear All</button>
          </div>
        )}
      </div>

      {/* MULTI-SELECT BULK ACTIONS */}
      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex flex-col sm:flex-row justify-between items-center animate-fade-in-down gap-4">
          <div className="flex items-center gap-4">
            <span className="text-blue-800 font-medium">{selectedUserIds.length} users selected</span>
            <button onClick={() => setSelectedUsers([])} className="text-sm text-blue-600 hover:underline">Deselect All</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV} loading={isProcessingBulk}>Export CSV</Button>
            <Button variant="secondary" size="sm" onClick={handleBulkActivate} loading={isProcessingBulk}>Activate</Button>
            <Button variant="secondary" size="sm" onClick={handleBulkSuspend} loading={isProcessingBulk} className="text-orange-600">Suspend</Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} loading={isProcessingBulk}>Delete</Button>
          </div>
        </div>
      )}

      {/* TABLE & PAGINATION */}
      {isLoading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <UserTable 
            users={currentUsers}
            departments={departments}
            selectedIds={selectedUserIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onSort={(key, order) => updateSort({ sortBy: key, sortOrder: order })}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onEdit={handleEditUser}
            onSuspendToggle={handleToggleStatus}
            onDelete={handleDelete}
          />
          {totalItems > 0 && (
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={(page) => updatePagination({ currentPage: page })}
              onItemsPerPageChange={(size) => updatePagination({ itemsPerPage: size, currentPage: 1 })}
            />
          )}
        </div>
      )}

      {/* MODALS */}
      <UserFormModal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        user={editingUser} 
      />
      
      <ImportUsersWizard 
        isOpen={isImportWizardOpen} 
        onClose={() => setIsImportWizardOpen(false)} 
      />

    </div>
  );
};

export default UserManagementPage;
