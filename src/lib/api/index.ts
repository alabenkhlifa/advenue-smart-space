// Main API exports
export { apiClient } from './client';
export { pairingApi } from './pairingApi';
export { campaignsApi } from './campaignsApi';
export { analyticsApi } from './analyticsApi';
export { mediaApi } from './mediaApi';

// Feature flag to determine if we should use the backend API or localStorage
export const useBackendAPI = (): boolean => {
  return import.meta.env.VITE_USE_BACKEND === 'true';
};
