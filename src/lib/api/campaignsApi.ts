import { apiClient } from './client';
import type { Campaign, MediaFile, ScreenCampaignSettings, CampaignCategory } from '../campaigns';

export const campaignsApi = {
  // Campaign operations
  async getAllCampaigns(): Promise<Campaign[]> {
    return apiClient.get('/api/campaigns');
  },

  async getCampaignById(campaignId: string): Promise<Campaign> {
    return apiClient.get(`/api/campaigns/${campaignId}`);
  },

  async getAdvertiserCampaigns(advertiserId: string): Promise<Campaign[]> {
    return apiClient.get(`/api/campaigns/advertiser/${advertiserId}`);
  },

  async getActiveCampaigns(): Promise<Campaign[]> {
    return apiClient.get('/api/campaigns/status/active');
  },

  async createCampaign(
    advertiserId: string,
    name: string,
    description: string,
    budget?: number,
    targetUrl?: string,
    category?: CampaignCategory
  ): Promise<Campaign> {
    return apiClient.post('/api/campaigns', {
      advertiserId,
      name,
      description,
      budget,
      targetUrl,
      category,
    });
  },

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    return apiClient.put(`/api/campaigns/${campaignId}`, updates);
  },

  async deleteCampaign(
    campaignId: string,
    advertiserId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/campaigns/${campaignId}`, { advertiserId });
  },

  // Media operations
  async addMediaToCampaign(
    campaignId: string,
    media: Omit<MediaFile, 'id' | 'uploadedAt'>
  ): Promise<MediaFile> {
    return apiClient.post(`/api/campaigns/${campaignId}/media`, media);
  },

  async removeMediaFromCampaign(
    campaignId: string,
    mediaId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/campaigns/${campaignId}/media/${mediaId}`);
  },

  // Screen settings operations
  async getScreenSettings(screenId: string): Promise<ScreenCampaignSettings> {
    return apiClient.get(`/api/screens/${screenId}/settings`);
  },

  async updateScreenSettings(
    settings: ScreenCampaignSettings
  ): Promise<ScreenCampaignSettings> {
    return apiClient.put(`/api/screens/${settings.screenId}/settings`, settings);
  },

  async getScreenMedia(screenId: string): Promise<MediaFile[]> {
    return apiClient.get(`/api/screens/${screenId}/media`);
  },
};
