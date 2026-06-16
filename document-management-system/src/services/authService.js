import axios from 'axios';

export const authService = {
  async login(email, password) {
    const response = await axios.post('/auth/login', { email, password });
    const { token, ...user } = response.data;
    localStorage.setItem('dms_token', token);
    localStorage.setItem('dms_user', JSON.stringify(user));
    return user;
  },

  async register(userData) {
    const response = await axios.post('/auth/register', userData);
    const { token, ...user } = response.data;
    localStorage.setItem('dms_token', token);
    localStorage.setItem('dms_user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('dms_token');
    localStorage.removeItem('dms_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('dms_user');
    if (userStr) {
      try { return JSON.parse(userStr); } catch { return null; }
    }
    return null;
  },

  getToken() {
    return localStorage.getItem('dms_token');
  },

  async updateUser(userData) {
    try {
      const response = await axios.patch(`/api/users/${userData.id}`, userData);
      const updatedUser = response.data;
      localStorage.setItem('dms_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch {
      throw new Error('Failed to update user data');
    }
  }
};
