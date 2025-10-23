import { apiClient } from './client';

export const mediaApi = {
  async storeMediaFile(
    id: string,
    blob: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; id: string }> {
    return apiClient.post('/api/media', { id, blob, metadata });
  },

  async getMediaFile(
    mediaId: string
  ): Promise<{ blob: string; metadata: Record<string, unknown> }> {
    return apiClient.get(`/api/media/${mediaId}`);
  },

  async deleteMediaFile(mediaId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/media/${mediaId}`);
  },
};
