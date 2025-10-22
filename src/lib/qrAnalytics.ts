export interface QRScanEvent {
  id: string;
  screenId: string;
  campaignId: string;
  mediaId: string;
  targetUrl?: string;
  timestamp: number;
  userAgent?: string;
  referrer?: string;
}

export interface QRScanAnalytics {
  campaignId: string;
  totalScans: number;
  screenBreakdown: Record<string, number>;
  mediaBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
}

const QR_SCANS_KEY = 'advenue_qr_scans';

// Get all QR scan events
const getQRScans = (): QRScanEvent[] => {
  const data = localStorage.getItem(QR_SCANS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save QR scan events
const saveQRScans = (scans: QRScanEvent[]): void => {
  localStorage.setItem(QR_SCANS_KEY, JSON.stringify(scans));
};

/**
 * Record a QR code scan event
 * @param screenId The screen where the QR code was scanned
 * @param campaignId The campaign ID
 * @param mediaId The media ID
 * @param targetUrl The target URL the user will be redirected to
 * @returns The scan event ID
 */
export const recordQRScan = (
  screenId: string,
  campaignId: string,
  mediaId: string,
  targetUrl?: string
): string => {
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const scanEvent: QRScanEvent = {
    id: scanId,
    screenId,
    campaignId,
    mediaId,
    targetUrl,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    referrer: document.referrer || undefined,
  };

  const scans = getQRScans();
  scans.push(scanEvent);
  saveQRScans(scans);

  return scanId;
};

/**
 * Get QR scan events for a specific campaign
 * @param campaignId The campaign ID
 * @returns Array of scan events
 */
export const getCampaignQRScans = (campaignId: string): QRScanEvent[] => {
  const scans = getQRScans();
  return scans.filter(scan => scan.campaignId === campaignId);
};

/**
 * Get QR scan analytics for a campaign
 * @param campaignId The campaign ID
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 * @returns Analytics data
 */
export const getCampaignQRAnalytics = (
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): QRScanAnalytics => {
  let scans = getCampaignQRScans(campaignId);

  // Filter by date range if provided
  if (startDate) {
    scans = scans.filter(scan => scan.timestamp >= startDate.getTime());
  }
  if (endDate) {
    scans = scans.filter(scan => scan.timestamp <= endDate.getTime());
  }

  const analytics: QRScanAnalytics = {
    campaignId,
    totalScans: scans.length,
    screenBreakdown: {},
    mediaBreakdown: {},
    dailyBreakdown: {},
  };

  scans.forEach(scan => {
    // Screen breakdown
    if (!analytics.screenBreakdown[scan.screenId]) {
      analytics.screenBreakdown[scan.screenId] = 0;
    }
    analytics.screenBreakdown[scan.screenId]++;

    // Media breakdown
    if (!analytics.mediaBreakdown[scan.mediaId]) {
      analytics.mediaBreakdown[scan.mediaId] = 0;
    }
    analytics.mediaBreakdown[scan.mediaId]++;

    // Daily breakdown
    const date = new Date(scan.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    if (!analytics.dailyBreakdown[dateKey]) {
      analytics.dailyBreakdown[dateKey] = 0;
    }
    analytics.dailyBreakdown[dateKey]++;
  });

  return analytics;
};

/**
 * Get QR scan events for a specific screen
 * @param screenId The screen ID
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 * @returns Array of scan events
 */
export const getScreenQRScans = (
  screenId: string,
  startDate?: Date,
  endDate?: Date
): QRScanEvent[] => {
  let scans = getQRScans().filter(scan => scan.screenId === screenId);

  if (startDate) {
    scans = scans.filter(scan => scan.timestamp >= startDate.getTime());
  }
  if (endDate) {
    scans = scans.filter(scan => scan.timestamp <= endDate.getTime());
  }

  return scans;
};

/**
 * Get QR scan events for a specific media
 * @param mediaId The media ID
 * @returns Array of scan events
 */
export const getMediaQRScans = (mediaId: string): QRScanEvent[] => {
  const scans = getQRScans();
  return scans.filter(scan => scan.mediaId === mediaId);
};

/**
 * Clean up old QR scan events (older than 90 days)
 */
export const cleanupOldQRScans = (): void => {
  const scans = getQRScans();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const filtered = scans.filter(scan => scan.timestamp > ninetyDaysAgo);

  if (filtered.length !== scans.length) {
    saveQRScans(filtered);
  }
};

/**
 * Calculate scan-to-impression conversion rate
 * @param campaignId The campaign ID
 * @param totalImpressions Total impressions for the campaign
 * @returns Conversion rate as a percentage
 */
export const calculateScanConversionRate = (
  campaignId: string,
  totalImpressions: number
): number => {
  const analytics = getCampaignQRAnalytics(campaignId);

  if (totalImpressions === 0) return 0;

  return (analytics.totalScans / totalImpressions) * 100;
};
