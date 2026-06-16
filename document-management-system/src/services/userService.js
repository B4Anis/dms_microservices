import axios from 'axios';

const API_URL = '/api';

export const userService = {
  async getUsers() {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  },

  async getUserById(id) {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user with ID: ${id}`);
    }
  },

  async createUser(userData) {
    try {
      const response = await axios.post(`${API_URL}/users`, {
        ...userData,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await axios.patch(`${API_URL}/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user with ID: ${id}`);
    }
  },

  async deleteUser(id) {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user with ID: ${id}`);
    }
  },

  async suspendUser(id) {
    return this.updateUser(id, { status: 'suspended' });
  },

  async activateUser(id) {
    return this.updateUser(id, { status: 'active' });
  },

  // Bulk operations (Simulated since json-server doesn't support bulk naturally)
  async bulkSuspend(userIds) {
    try {
      const promises = userIds.map(id => this.suspendUser(id));
      await Promise.all(promises);
      return true;
    } catch (error) {
      throw new Error('Failed to suspend selected users');
    }
  },

  async bulkActivate(userIds) {
    try {
      const promises = userIds.map(id => this.activateUser(id));
      await Promise.all(promises);
      return true;
    } catch (error) {
      throw new Error('Failed to activate selected users');
    }
  },

  async bulkDelete(userIds) {
    try {
      const promises = userIds.map(id => this.deleteUser(id));
      await Promise.all(promises);
      return true;
    } catch (error) {
      throw new Error('Failed to delete selected users');
    }
  },

  // Native JS CSV Export
  exportUsersToCSV(users) {
    if (!users || !users.length) return;

    // Define the columns
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Join Date', 'Last Active'];
    
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const strVal = String(str);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    const csvRows = [
      headers.join(','),
      ...users.map(user => {
        return [
          escapeCSV(user.id),
          escapeCSV(`${user.firstName} ${user.lastName}`),
          escapeCSV(user.email),
          escapeCSV(user.role),
          escapeCSV(user.status),
          escapeCSV(new Date(user.createdAt).toLocaleDateString()),
          escapeCSV(new Date(user.lastActive).toLocaleDateString())
        ].join(',');
      })
    ];

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `dms-users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
