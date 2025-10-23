export interface ImpressionEvent {
  id: string;
  screenId: string;
  campaignId: string;
  mediaId: string;
  mediaType: 'image' | 'video' | 'custom' | string; // Support custom content types
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
  venueName?: string;
  venueId?: string;
  ownerId?: string;
  region?: string;
  city?: string;
  country?: string;
  timestamp: number;
}

export interface QRCodeScanEvent {
  id: string;
  screenId: string;
  campaignId: string;
  timestamp: number;
  venueId?: string;
  ownerId?: string;
  region?: string;
  city?: string;
  country?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalImpressions: number;
  totalDuration: number; // in milliseconds
  totalQRScans: number;
  screenBreakdown: Record<string, { impressions: number; duration: number; qrScans: number }>;
  ownerBreakdown: Record<string, { impressions: number; duration: number; qrScans: number; screenCount: number }>;
  regionBreakdown: Record<string, { impressions: number; duration: number; qrScans: number }>;
  cityBreakdown: Record<string, { impressions: number; duration: number; qrScans: number }>;
  mediaBreakdown: Record<string, { impressions: number; duration: number }>;
  dailyBreakdown: Record<string, { impressions: number; duration: number; qrScans: number }>;
}

const IMPRESSIONS_KEY = 'advenue_impressions';
const QR_SCANS_KEY = 'advenue_qr_scans';

// Get all impression events
const getImpressions = (): ImpressionEvent[] => {
  const data = localStorage.getItem(IMPRESSIONS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save impressions
const saveImpressions = (impressions: ImpressionEvent[]): void => {
  localStorage.setItem(IMPRESSIONS_KEY, JSON.stringify(impressions));
};

// Get all QR code scan events
const getQRScans = (): QRCodeScanEvent[] => {
  const data = localStorage.getItem(QR_SCANS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save QR scans
const saveQRScans = (scans: QRCodeScanEvent[]): void => {
  localStorage.setItem(QR_SCANS_KEY, JSON.stringify(scans));
};

// Start tracking an impression
export const startImpression = (
  screenId: string,
  campaignId: string,
  mediaId: string,
  mediaType: 'image' | 'video' | 'custom' | string,
  metadata?: {
    venueName?: string;
    venueId?: string;
    ownerId?: string;
    region?: string;
    city?: string;
    country?: string;
  }
): string => {
  const impressionId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const impression: ImpressionEvent = {
    id: impressionId,
    screenId,
    campaignId,
    mediaId,
    mediaType,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
    venueName: metadata?.venueName,
    venueId: metadata?.venueId,
    ownerId: metadata?.ownerId,
    region: metadata?.region,
    city: metadata?.city,
    country: metadata?.country,
    timestamp: Date.now(),
  };

  // Store in sessionStorage temporarily (until endImpression is called)
  sessionStorage.setItem(`impression_${impressionId}`, JSON.stringify(impression));

  return impressionId;
};

// Track QR code scan
export const trackQRCodeScan = (
  screenId: string,
  campaignId: string,
  metadata?: {
    venueId?: string;
    ownerId?: string;
    region?: string;
    city?: string;
    country?: string;
  }
): void => {
  const scanId = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const scan: QRCodeScanEvent = {
    id: scanId,
    screenId,
    campaignId,
    timestamp: Date.now(),
    venueId: metadata?.venueId,
    ownerId: metadata?.ownerId,
    region: metadata?.region,
    city: metadata?.city,
    country: metadata?.country,
  };

  const scans = getQRScans();
  scans.push(scan);
  saveQRScans(scans);
};

// End tracking an impression
export const endImpression = (impressionId: string): void => {
  const impressionData = sessionStorage.getItem(`impression_${impressionId}`);
  if (!impressionData) return;

  try {
    const impression: ImpressionEvent = JSON.parse(impressionData);
    impression.endTime = Date.now();
    impression.duration = impression.endTime - impression.startTime;

    // Save to localStorage
    const impressions = getImpressions();
    impressions.push(impression);
    saveImpressions(impressions);

    // Clean up sessionStorage
    sessionStorage.removeItem(`impression_${impressionId}`);
  } catch (error) {
    console.error('Error ending impression:', error);
  }
};

// Get impressions for a specific campaign
export const getCampaignImpressions = (campaignId: string): ImpressionEvent[] => {
  const impressions = getImpressions();
  return impressions.filter(imp => imp.campaignId === campaignId);
};

// Get analytics for a campaign
export const getCampaignAnalytics = (
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): CampaignAnalytics => {
  let impressions = getCampaignImpressions(campaignId);
  let qrScans = getQRScans().filter(scan => scan.campaignId === campaignId);

  // Filter by date range if provided
  if (startDate) {
    impressions = impressions.filter(imp => imp.timestamp >= startDate.getTime());
    qrScans = qrScans.filter(scan => scan.timestamp >= startDate.getTime());
  }
  if (endDate) {
    impressions = impressions.filter(imp => imp.timestamp <= endDate.getTime());
    qrScans = qrScans.filter(scan => scan.timestamp <= endDate.getTime());
  }

  const analytics: CampaignAnalytics = {
    campaignId,
    totalImpressions: impressions.length,
    totalDuration: impressions.reduce((sum, imp) => sum + imp.duration, 0),
    totalQRScans: qrScans.length,
    screenBreakdown: {},
    ownerBreakdown: {},
    regionBreakdown: {},
    cityBreakdown: {},
    mediaBreakdown: {},
    dailyBreakdown: {},
  };

  // Process impressions
  impressions.forEach(imp => {
    // Screen breakdown
    if (!analytics.screenBreakdown[imp.screenId]) {
      analytics.screenBreakdown[imp.screenId] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.screenBreakdown[imp.screenId].impressions++;
    analytics.screenBreakdown[imp.screenId].duration += imp.duration;

    // Owner breakdown
    if (imp.ownerId) {
      if (!analytics.ownerBreakdown[imp.ownerId]) {
        analytics.ownerBreakdown[imp.ownerId] = { impressions: 0, duration: 0, qrScans: 0, screenCount: 0 };
      }
      analytics.ownerBreakdown[imp.ownerId].impressions++;
      analytics.ownerBreakdown[imp.ownerId].duration += imp.duration;
    }

    // Region breakdown
    if (imp.region) {
      if (!analytics.regionBreakdown[imp.region]) {
        analytics.regionBreakdown[imp.region] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.regionBreakdown[imp.region].impressions++;
      analytics.regionBreakdown[imp.region].duration += imp.duration;
    }

    // City breakdown
    if (imp.city) {
      if (!analytics.cityBreakdown[imp.city]) {
        analytics.cityBreakdown[imp.city] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.cityBreakdown[imp.city].impressions++;
      analytics.cityBreakdown[imp.city].duration += imp.duration;
    }

    // Media breakdown
    if (!analytics.mediaBreakdown[imp.mediaId]) {
      analytics.mediaBreakdown[imp.mediaId] = { impressions: 0, duration: 0 };
    }
    analytics.mediaBreakdown[imp.mediaId].impressions++;
    analytics.mediaBreakdown[imp.mediaId].duration += imp.duration;

    // Daily breakdown
    const date = new Date(imp.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    if (!analytics.dailyBreakdown[dateKey]) {
      analytics.dailyBreakdown[dateKey] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.dailyBreakdown[dateKey].impressions++;
    analytics.dailyBreakdown[dateKey].duration += imp.duration;
  });

  // Process QR scans
  qrScans.forEach(scan => {
    // Screen breakdown
    if (!analytics.screenBreakdown[scan.screenId]) {
      analytics.screenBreakdown[scan.screenId] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.screenBreakdown[scan.screenId].qrScans++;

    // Owner breakdown
    if (scan.ownerId) {
      if (!analytics.ownerBreakdown[scan.ownerId]) {
        analytics.ownerBreakdown[scan.ownerId] = { impressions: 0, duration: 0, qrScans: 0, screenCount: 0 };
      }
      analytics.ownerBreakdown[scan.ownerId].qrScans++;
    }

    // Region breakdown
    if (scan.region) {
      if (!analytics.regionBreakdown[scan.region]) {
        analytics.regionBreakdown[scan.region] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.regionBreakdown[scan.region].qrScans++;
    }

    // City breakdown
    if (scan.city) {
      if (!analytics.cityBreakdown[scan.city]) {
        analytics.cityBreakdown[scan.city] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.cityBreakdown[scan.city].qrScans++;
    }

    // Daily breakdown
    const date = new Date(scan.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    if (!analytics.dailyBreakdown[dateKey]) {
      analytics.dailyBreakdown[dateKey] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.dailyBreakdown[dateKey].qrScans++;
  });

  // Calculate unique screen count per owner
  const screensByOwner: Record<string, Set<string>> = {};
  impressions.forEach(imp => {
    if (imp.ownerId) {
      if (!screensByOwner[imp.ownerId]) {
        screensByOwner[imp.ownerId] = new Set();
      }
      screensByOwner[imp.ownerId].add(imp.screenId);
    }
  });
  Object.keys(screensByOwner).forEach(ownerId => {
    if (analytics.ownerBreakdown[ownerId]) {
      analytics.ownerBreakdown[ownerId].screenCount = screensByOwner[ownerId].size;
    }
  });

  return analytics;
};

// Get analytics for all campaigns of an advertiser
export const getAdvertiserAnalytics = (
  campaignIds: string[],
  startDate?: Date,
  endDate?: Date
): Record<string, CampaignAnalytics> => {
  const analytics: Record<string, CampaignAnalytics> = {};

  campaignIds.forEach(campaignId => {
    analytics[campaignId] = getCampaignAnalytics(campaignId, startDate, endDate);
  });

  return analytics;
};

// Format duration for display
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Get impressions for a specific screen
export const getScreenImpressions = (
  screenId: string,
  startDate?: Date,
  endDate?: Date
): ImpressionEvent[] => {
  let impressions = getImpressions().filter(imp => imp.screenId === screenId);

  if (startDate) {
    impressions = impressions.filter(imp => imp.timestamp >= startDate.getTime());
  }
  if (endDate) {
    impressions = impressions.filter(imp => imp.timestamp <= endDate.getTime());
  }

  return impressions;
};

// Calculate revenue for screen owner (example calculation)
export const calculateScreenRevenue = (
  screenId: string,
  ratePerImpression: number = 0.01 // $0.01 per impression
): number => {
  const impressions = getScreenImpressions(screenId);
  return impressions.length * ratePerImpression;
};

// Get QR scans for a specific campaign
export const getCampaignQRScans = (campaignId: string): QRCodeScanEvent[] => {
  const scans = getQRScans();
  return scans.filter(scan => scan.campaignId === campaignId);
};

// Get QR scans for a specific screen
export const getScreenQRScans = (
  screenId: string,
  startDate?: Date,
  endDate?: Date
): QRCodeScanEvent[] => {
  let scans = getQRScans().filter(scan => scan.screenId === screenId);

  if (startDate) {
    scans = scans.filter(scan => scan.timestamp >= startDate.getTime());
  }
  if (endDate) {
    scans = scans.filter(scan => scan.timestamp <= endDate.getTime());
  }

  return scans;
};

// Clean up old impressions (older than 90 days)
export const cleanupOldImpressions = (): void => {
  const impressions = getImpressions();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const filtered = impressions.filter(imp => imp.timestamp > ninetyDaysAgo);

  if (filtered.length !== impressions.length) {
    saveImpressions(filtered);
  }

  // Also clean up old QR scans
  const scans = getQRScans();
  const filteredScans = scans.filter(scan => scan.timestamp > ninetyDaysAgo);

  if (filteredScans.length !== scans.length) {
    saveQRScans(filteredScans);
  }
};
