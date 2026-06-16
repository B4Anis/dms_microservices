import axios from 'axios';

const API_URL = '/api';

export const categoryService = {
  async getCategories() {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  },

  async getCategoryById(id) {
    try {
      const response = await axios.get(`${API_URL}/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch category');
    }
  },

  async createCategory(data) {
    try {
      const response = await axios.post(`${API_URL}/categories`, {
        ...data,
        createdAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create category');
    }
  },

  async updateCategory(id, data) {
    try {
      const response = await axios.patch(`${API_URL}/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update category');
    }
  },

  async deleteCategory(id) {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete category');
    }
  },

  async getCategoryDocuments(categoryId) {
    try {
      const response = await axios.get(`${API_URL}/documents?categoryId=${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch category documents');
    }
  },

  async reassignDocuments(fromCategoryId, toCategoryId) {
    try {
      // Fetch all documents in old category
      const docs = await this.getCategoryDocuments(fromCategoryId);
      const promises = docs.map(doc =>
        axios.patch(`${API_URL}/documents/${doc.id}`, { categoryId: toCategoryId })
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      throw new Error('Failed to reassign documents');
    }
  },

  // Get all descendant category IDs (for delete validation)
  getDescendantIds(categoryId, allCategories) {
    const children = allCategories.filter(c => c.parentId === categoryId);
    return children.reduce((ids, child) => {
      return [...ids, child.id, ...this.getDescendantIds(child.id, allCategories)];
    }, []);
  }
};
