import api from './api';

const API_URL = '/api';
const DOCS_URL = '/api/documents';

export const documentService = {
  async getDocuments() {
    try {
      const response = await api.get(DOCS_URL);
      return response.data;
    } catch {
      throw new Error('Failed to fetch documents');
    }
  },

  async getDocumentById(id) {
    try {
      const response = await api.get(`${DOCS_URL}/${id}`);
      return response.data;
    } catch {
      throw new Error(`Failed to fetch document with ID: ${id}`);
    }
  },

  async createDocument(documentData, file) {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('title', documentData.title);
      if (documentData.uploadedBy) formData.append('owner', documentData.uploadedBy);

      const response = await api.post(DOCS_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch {
      throw new Error('Failed to create document');
    }
  },

  async updateDocument(id, documentData) {
    try {
      const response = await api.patch(`${DOCS_URL}/${id}`, documentData);
      return response.data;
    } catch {
      throw new Error(`Failed to update document with ID: ${id}`);
    }
  },

  async deleteDocument(id) {
    try {
      await api.delete(`${DOCS_URL}/${id}`);
      return true;
    } catch {
      throw new Error(`Failed to delete document with ID: ${id}`);
    }
  },

  async getCategories() {
    try {
      const response = await api.get(`${API_URL}/categories`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch categories');
    }
  },

  async getDepartments() {
    try {
      const response = await api.get(`${API_URL}/departments`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch departments');
    }
  },

  async createDocumentVersion(documentId, versionData) {
    try {
      const doc = await this.getDocumentById(documentId);
      const updatedVersions = [...(doc.versions || []), versionData];
      const response = await api.patch(`${API_URL}/documents/${documentId}`, {
        versions: updatedVersions,
        currentVersion: versionData.versionNumber,
        fileUrl: versionData.fileUrl,
        fileSize: versionData.fileSize || doc.fileSize,
        updatedAt: new Date().toISOString()
      });
      return response.data;
    } catch {
      throw new Error('Failed to create new document version');
    }
  },

  async restoreDocumentVersion(documentId, versionNumber) {
    try {
      const doc = await this.getDocumentById(documentId);
      const versionToRestore = doc.versions.find(v => v.versionNumber === versionNumber);
      if (!versionToRestore) throw new Error('Version not found');
      const nextVersionNumber = doc.versions.length > 0
        ? Math.max(...doc.versions.map(v => v.versionNumber)) + 1
        : 2;
      const newVersion = {
        ...versionToRestore,
        versionNumber: nextVersionNumber,
        uploadedAt: new Date().toISOString(),
        notes: `Restored from version ${versionNumber}`
      };
      return await this.createDocumentVersion(documentId, newVersion);
    } catch {
      throw new Error('Failed to restore document version');
    }
  },

  async incrementViewCount(documentId) {
    try {
      await api.post(`${DOCS_URL}/${documentId}/view`);
    } catch (error) {
      console.error('Failed to increment view count', error);
    }
  },

  async incrementDownloadCount(documentId) {
    try {
      await api.post(`${DOCS_URL}/${documentId}/download`);
    } catch (error) {
      console.error('Failed to increment download count', error);
    }
  }
};
