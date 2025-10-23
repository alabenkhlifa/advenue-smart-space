import { apiClient } from './client';
import type { PairingRequest, PairedScreen } from '../pairing';

export const pairingApi = {
  async createPairingRequest(
    screenId: string,
    pairingCodeHash: string,
    deviceFingerprint: string
  ): Promise<{ success: boolean; request: PairingRequest }> {
    return apiClient.post('/api/pairing/request', {
      screenId,
      pairingCodeHash,
      deviceFingerprint,
    });
  },

  async getPairingRequest(screenId: string): Promise<PairingRequest> {
    return apiClient.get(`/api/pairing/request/${screenId}`);
  },

  async validateAndPair(
    screenId: string,
    pairingCodeHash: string,
    ownerId: string,
    venueName?: string,
    venueId?: string
  ): Promise<{ success: boolean; error?: string; screen?: PairedScreen }> {
    return apiClient.post('/api/pairing/validate', {
      screenId,
      pairingCodeHash,
      ownerId,
      venueName,
      venueId,
    });
  },

  async checkPairingStatus(
    screenId: string
  ): Promise<{ paired: boolean; screen?: PairedScreen }> {
    return apiClient.get(`/api/pairing/status/${screenId}`);
  },

  async validateToken(
    screenId: string,
    token: string
  ): Promise<{ valid: boolean; screen?: PairedScreen }> {
    return apiClient.post('/api/pairing/validate-token', {
      screenId,
      token,
    });
  },

  async getOwnerScreens(ownerId: string): Promise<PairedScreen[]> {
    return apiClient.get(`/api/pairing/owner/${ownerId}`);
  },

  async unpairScreen(screenId: string, ownerId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/pairing/${screenId}`, { ownerId });
  },
};
