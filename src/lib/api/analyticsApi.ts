import { apiClient } from './client';
import type { ImpressionEvent, QRCodeScanEvent, CampaignAnalytics } from '../analytics';

export const analyticsApi = {
  // Impression operations
  async startImpression(
    screenId: string,
    campaignId: string,
    mediaId: string,
    mediaType: 'image' | 'video',
    metadata?: {
      venueName?: string;
      venueId?: string;
      ownerId?: string;
      region?: string;
      city?: string;
      country?: string;
    }
  ): Promise<ImpressionEvent> {
    return apiClient.post('/api/analytics/impressions', {
      screenId,
      campaignId,
      mediaId,
      mediaType,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      ...metadata,
    });
  },

  async endImpression(
    impressionId: string,
    endTime: number,
    duration: number
  ): Promise<ImpressionEvent> {
    return apiClient.put(`/api/analytics/impressions/${impressionId}`, {
      endTime,
      duration,
    });
  },

  async getCampaignImpressions(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ImpressionEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.getTime().toString());
    if (endDate) params.append('endDate', endDate.getTime().toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/analytics/campaigns/${campaignId}/impressions${query}`);
  },

  async getScreenImpressions(
    screenId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ImpressionEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.getTime().toString());
    if (endDate) params.append('endDate', endDate.getTime().toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/analytics/screens/${screenId}/impressions${query}`);
  },

  // QR scan operations
  async trackQRCodeScan(
    screenId: string,
    campaignId: string,
    metadata?: {
      venueId?: string;
      ownerId?: string;
      region?: string;
      city?: string;
      country?: string;
    }
  ): Promise<QRCodeScanEvent> {
    return apiClient.post('/api/analytics/qr-scans', {
      screenId,
      campaignId,
      ...metadata,
    });
  },

  async getCampaignQRScans(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QRCodeScanEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.getTime().toString());
    if (endDate) params.append('endDate', endDate.getTime().toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/analytics/campaigns/${campaignId}/qr-scans${query}`);
  },

  async getScreenQRScans(
    screenId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<QRCodeScanEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.getTime().toString());
    if (endDate) params.append('endDate', endDate.getTime().toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/analytics/screens/${screenId}/qr-scans${query}`);
  },

  // Analytics operations
  async getCampaignAnalytics(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.getTime().toString());
    if (endDate) params.append('endDate', endDate.getTime().toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/analytics/campaigns/${campaignId}${query}`);
  },
};
