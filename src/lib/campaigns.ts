export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string; // Will be 'indexeddb://[id]' for IndexedDB stored files, or data URL for legacy
  size: number;
  duration?: number; // for videos, in seconds
  uploadedAt: number;
  storedInIndexedDB?: boolean; // Flag to indicate storage location
  campaignId?: string; // Campaign ID for tracking (added when fetching media for display)
}

export type CampaignCategory = 'Food' | 'Clothing' | 'Hotel' | 'Entertainment' | 'Technology' | 'Health' | 'Other';

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  description: string;
  category?: CampaignCategory;
  budget?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  media: MediaFile[];
  targetUrl?: string; // URL to redirect users when they scan the QR code
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  endDate?: number;
}

export type ContentMode = 'ads-only' | 'custom-only' | 'mixed';

export interface ScreenCampaignSettings {
  screenId: string;
  selectedCampaignIds: string[];
  displayAll: boolean;
  selectedCategories?: CampaignCategory[]; // Filter campaigns by category
  rotationFrequency: number; // in seconds
  rotationMode: 'sequential' | 'random' | 'weighted';
  campaignPriorities?: Record<string, number>; // campaignId -> priority (1-10)
  videoPlaybackMode: 'rotation' | 'smart'; // How to handle video playback

  // Custom content settings for screen owners
  contentMode?: ContentMode; // What type of content to display
  customContentIds?: string[]; // IDs of custom content to display
  showAds?: boolean; // Whether to show ads at all (screen owner's control)
  adsContentRatio?: number; // Percentage of time showing ads (0-100), remaining time is custom content
}

const CAMPAIGNS_KEY = 'advenue_campaigns';
const SCREEN_SETTINGS_KEY = 'advenue_screen_settings';

// Get all campaigns
const getCampaigns = (): Campaign[] => {
  const data = localStorage.getItem(CAMPAIGNS_KEY);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save campaigns
const saveCampaigns = (campaigns: Campaign[]): void => {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

// Create a new campaign
export const createCampaign = (
  advertiserId: string,
  name: string,
  description: string,
  budget?: number,
  targetUrl?: string,
  category?: CampaignCategory
): Campaign => {
  const campaigns = getCampaigns();

  const campaign: Campaign = {
    id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    advertiserId,
    name,
    description,
    category,
    budget,
    targetUrl,
    status: 'draft',
    media: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  campaigns.push(campaign);
  saveCampaigns(campaigns);

  return campaign;
};

// Update campaign
export const updateCampaign = (
  campaignId: string,
  updates: Partial<Campaign>
): Campaign | null => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaignId);

  if (index === -1) return null;

  campaigns[index] = {
    ...campaigns[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveCampaigns(campaigns);
  return campaigns[index];
};

// Delete campaign
export const deleteCampaign = (campaignId: string, advertiserId: string): boolean => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(
    c => c.id === campaignId && c.advertiserId === advertiserId
  );

  if (index === -1) return false;

  campaigns.splice(index, 1);
  saveCampaigns(campaigns);
  return true;
};

// Get campaigns by advertiser
export const getAdvertiserCampaigns = (advertiserId: string): Campaign[] => {
  const campaigns = getCampaigns();
  return campaigns.filter(c => c.advertiserId === advertiserId);
};

// Get campaign by ID
export const getCampaignById = (campaignId: string): Campaign | null => {
  const campaigns = getCampaigns();
  return campaigns.find(c => c.id === campaignId) || null;
};

// Get all active campaigns
export const getActiveCampaigns = (): Campaign[] => {
  const campaigns = getCampaigns();
  return campaigns.filter(c => c.status === 'active');
};

// Add media to campaign (metadata only - actual file stored in IndexedDB)
export const addMediaToCampaign = (
  campaignId: string,
  media: Omit<MediaFile, 'id' | 'uploadedAt'>
): MediaFile | null => {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);

  if (!campaign) return null;

  const mediaFile: MediaFile = {
    ...media,
    id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    uploadedAt: Date.now(),
  };

  campaign.media.push(mediaFile);
  campaign.updatedAt = Date.now();

  saveCampaigns(campaigns);
  return mediaFile;
};

// Extract video duration
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Add media with IndexedDB storage
export const addMediaToCampaignWithBlob = async (
  campaignId: string,
  file: File
): Promise<MediaFile | null> => {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);

  if (!campaign) return null;

  const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const mediaType = file.type.startsWith('image') ? 'image' : 'video';

  // Get video duration if it's a video
  let duration: number | undefined;
  if (mediaType === 'video') {
    try {
      duration = await getVideoDuration(file);
    } catch (error) {
      console.error('Failed to extract video duration:', error);
      duration = undefined;
    }
  }

  // Store file in IndexedDB
  const { storeMediaFile, fileToBlob } = await import('./mediaStorage');
  const blob = await fileToBlob(file);

  await storeMediaFile({
    id: mediaId,
    campaignId,
    name: file.name,
    type: mediaType,
    blob,
    size: file.size,
    uploadedAt: Date.now(),
  });

  // Store metadata in localStorage with IndexedDB reference
  const mediaFile: MediaFile = {
    id: mediaId,
    name: file.name,
    type: mediaType,
    url: `indexeddb://${mediaId}`, // Reference to IndexedDB
    size: file.size,
    duration, // Video duration in seconds
    uploadedAt: Date.now(),
    storedInIndexedDB: true,
  };

  campaign.media.push(mediaFile);
  campaign.updatedAt = Date.now();

  saveCampaigns(campaigns);
  return mediaFile;
};

// Remove media from campaign
export const removeMediaFromCampaign = async (
  campaignId: string,
  mediaId: string
): Promise<boolean> => {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);

  if (!campaign) return false;

  const index = campaign.media.findIndex(m => m.id === mediaId);
  if (index === -1) return false;

  const media = campaign.media[index];

  // If stored in IndexedDB, delete from there too
  if (media.storedInIndexedDB) {
    try {
      const { deleteMediaFile } = await import('./mediaStorage');
      await deleteMediaFile(mediaId);
    } catch (error) {
      console.error('Failed to delete media from IndexedDB:', error);
    }
  }

  campaign.media.splice(index, 1);
  campaign.updatedAt = Date.now();

  saveCampaigns(campaigns);
  return true;
};

// Screen campaign settings
const getScreenSettings = (): Record<string, ScreenCampaignSettings> => {
  const data = localStorage.getItem(SCREEN_SETTINGS_KEY);
  if (!data) return {};

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const saveScreenSettings = (settings: Record<string, ScreenCampaignSettings>): void => {
  localStorage.setItem(SCREEN_SETTINGS_KEY, JSON.stringify(settings));
};

// Get screen campaign settings
export const getScreenCampaignSettings = (
  screenId: string
): ScreenCampaignSettings => {
  const settings = getScreenSettings();
  return (
    settings[screenId] || {
      screenId,
      selectedCampaignIds: [],
      displayAll: false,
      rotationFrequency: 10,
      rotationMode: 'sequential',
      videoPlaybackMode: 'smart', // Default to smart mode
      contentMode: 'ads-only', // Default to showing only ads
      customContentIds: [],
      showAds: true, // Default to showing ads
      adsContentRatio: 50, // Default 50% ads, 50% content
    }
  );
};

// Update screen campaign settings
export const updateScreenCampaignSettings = (
  settings: ScreenCampaignSettings
): void => {
  const allSettings = getScreenSettings();
  allSettings[settings.screenId] = settings;
  saveScreenSettings(allSettings);

  // Dispatch custom event for same-window reactivity
  window.dispatchEvent(new CustomEvent('advenue-settings-changed', {
    detail: { screenId: settings.screenId, settings }
  }));
};

// Get media to display on a screen (ads only)
export const getScreenMedia = (screenId: string): MediaFile[] => {
  const settings = getScreenCampaignSettings(screenId);

  // If showAds is false or contentMode is custom-only, return empty array
  if (settings.showAds === false || settings.contentMode === 'custom-only') {
    return [];
  }

  const allCampaigns = getActiveCampaigns();

  let campaignsToDisplay: Campaign[];

  if (settings.displayAll) {
    campaignsToDisplay = allCampaigns;
  } else {
    campaignsToDisplay = allCampaigns.filter(c =>
      settings.selectedCampaignIds.includes(c.id)
    );
  }

  // Filter by category if selected
  if (settings.selectedCategories && settings.selectedCategories.length > 0) {
    campaignsToDisplay = campaignsToDisplay.filter(c =>
      c.category && settings.selectedCategories!.includes(c.category)
    );
  }

  // Collect all media from selected campaigns and tag with campaignId
  const media: MediaFile[] = [];
  campaignsToDisplay.forEach(campaign => {
    const taggedMedia = campaign.media.map(m => ({
      ...m,
      campaignId: campaign.id,
    }));
    media.push(...taggedMedia);
  });

  // Apply rotation mode
  if (settings.rotationMode === 'random') {
    return media.sort(() => Math.random() - 0.5);
  } else if (settings.rotationMode === 'weighted' && settings.campaignPriorities) {
    // Weight media based on campaign priority
    const weighted: MediaFile[] = [];
    campaignsToDisplay.forEach(campaign => {
      const priority = settings.campaignPriorities?.[campaign.id] || 1;
      const taggedMedia = campaign.media.map(m => ({
        ...m,
        campaignId: campaign.id,
      }));
      for (let i = 0; i < priority; i++) {
        weighted.push(...taggedMedia);
      }
    });
    return weighted;
  }

  // Sequential (default)
  return media;
};

// Convert File to base64 data URL (for demo purposes)
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Validate media file
export const validateMediaFile = (
  file: File
): { valid: boolean; error?: string } => {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type) &&
    !ALLOWED_VIDEO_TYPES.includes(file.type)
  ) {
    return {
      valid: false,
      error: 'File must be an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, OGG)',
    };
  }

  return { valid: true };
};
