import axios from 'axios';
import { userService } from './userService';

const API_URL = '/api';

export const departmentService = {
  async getDepartments() {
    try {
      const response = await axios.get(`${API_URL}/departments`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch departments');
    }
  },

  async getDepartmentById(id) {
    try {
      const response = await axios.get(`${API_URL}/departments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch department');
    }
  },

  async createDepartment(data) {
    try {
      const response = await axios.post(`${API_URL}/departments`, {
        ...data,
        createdAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create department');
    }
  },

  async updateDepartment(id, data) {
    try {
      const response = await axios.patch(`${API_URL}/departments/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update department');
    }
  },

  async deleteDepartment(id) {
    try {
      await axios.delete(`${API_URL}/departments/${id}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete department');
    }
  },

  async getDepartmentUsers(departmentId) {
    try {
      const allUsers = await userService.getUsers();
      return allUsers.filter(user => user.departments?.includes(departmentId));
    } catch (error) {
      throw new Error('Failed to fetch department users');
    }
  },

  async removeUserFromDepartment(userId, departmentId) {
    try {
      const user = await userService.getUserById(userId);
      const updatedDepts = (user.departments || []).filter(id => id !== departmentId);
      await userService.updateUser(userId, { departments: updatedDepts });
      return true;
    } catch (error) {
      throw new Error('Failed to remove user from department');
    }
  },

  async addUserToDepartment(userId, departmentId) {
    try {
      const user = await userService.getUserById(userId);
      const updatedDepts = [...new Set([...(user.departments || []), departmentId])];
      await userService.updateUser(userId, { departments: updatedDepts });
      return true;
    } catch (error) {
      throw new Error('Failed to add user to department');
    }
  },

  async transferUsersAndArchive(oldDeptId, newDeptId) {
    try {
      const usersToTransfer = await this.getDepartmentUsers(oldDeptId);
      
      const transferPromises = usersToTransfer.map(user => {
        let depts = user.departments.filter(id => id !== oldDeptId);
        if (newDeptId && !depts.includes(newDeptId)) {
          depts.push(newDeptId);
        }
        return userService.updateUser(user.id, { departments: depts });
      });

      await Promise.all(transferPromises);
      await this.deleteDepartment(oldDeptId);
      return true;
    } catch (error) {
      throw new Error('Failed to transfer users and delete department');
    }
  }
};
