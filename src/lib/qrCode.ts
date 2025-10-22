import QRCode from 'qrcode';

/**
 * Generate a QR code tracking URL for a specific campaign media
 * This URL will redirect users to the analytics collector before sending them to the target URL
 */
export const generateTrackingUrl = (
  screenId: string,
  campaignId: string,
  mediaId: string
): string => {
  // In production, replace with your actual domain
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    s: screenId,
    c: campaignId,
    m: mediaId,
  });

  return `${baseUrl}/scan?${params.toString()}`;
};

/**
 * Generate a QR code as a data URL
 * @param trackingUrl The URL to encode in the QR code
 * @param options QR code generation options
 * @returns Promise resolving to a data URL string
 */
export const generateQRCode = async (
  trackingUrl: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M', // Medium error correction
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate a QR code for campaign media
 * @param screenId The screen displaying the media
 * @param campaignId The campaign ID
 * @param mediaId The media ID
 * @param options QR code generation options
 * @returns Promise resolving to a data URL string
 */
export const generateMediaQRCode = async (
  screenId: string,
  campaignId: string,
  mediaId: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> => {
  const trackingUrl = generateTrackingUrl(screenId, campaignId, mediaId);
  return generateQRCode(trackingUrl, options);
};
