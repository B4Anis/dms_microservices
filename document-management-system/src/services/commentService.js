import api from './api';

const COMMENTS_API = '/api/comments';

export const commentService = {
  async getCommentsByDocumentId(documentId) {
    try {
      const response = await api.get(`${COMMENTS_API}/document/${documentId}`);
      return response.data;
    } catch {
      throw new Error('Failed to fetch comments');
    }
  },

  async createComment(commentData) {
    try {
      const response = await api.post(COMMENTS_API, commentData);
      return response.data;
    } catch {
      throw new Error('Failed to create comment');
    }
  },

  async updateComment(id, commentData) {
    try {
      const response = await api.patch(`${COMMENTS_API}/${id}`, commentData);
      return response.data;
    } catch {
      throw new Error(`Failed to update comment with ID: ${id}`);
    }
  },

  async deleteComment(id) {
    try {
      await api.delete(`${COMMENTS_API}/${id}`);
      return true;
    } catch {
      throw new Error(`Failed to delete comment with ID: ${id}`);
    }
  }
};
