// Unified screen content handling for ads and custom content
import { MediaFile, getScreenMedia, getScreenCampaignSettings } from './campaigns';
import { CustomContent, getScreenCustomContentByIds } from './customContent';

export type DisplayItemType = 'ad' | 'custom-menu' | 'custom-youtube-video' | 'custom-youtube-playlist';

export interface DisplayItem {
  id: string;
  type: DisplayItemType;

  // For ads
  mediaFile?: MediaFile;
  campaignId?: string;

  // For custom content
  customContent?: CustomContent;
}

// Get all content to display on a screen (both ads and custom content)
export function getScreenDisplayItems(screenId: string): DisplayItem[] {
  const settings = getScreenCampaignSettings(screenId);
  const contentMode = settings.contentMode || 'ads-only';

  const items: DisplayItem[] = [];

  // Get ads if applicable
  if (contentMode !== 'custom-only' && settings.showAds !== false) {
    const adMedia = getScreenMedia(screenId);
    adMedia.forEach(media => {
      items.push({
        id: `ad-${media.id}`,
        type: 'ad',
        mediaFile: media,
        campaignId: media.campaignId,
      });
    });
  }

  // Get custom content if applicable
  if (contentMode !== 'ads-only') {
    const contentIds = settings.customContentIds || [];
    const customContent = getScreenCustomContentByIds(contentIds);
    customContent.forEach(content => {
      const displayType: DisplayItemType =
        content.type === 'menu' ? 'custom-menu' :
        content.type === 'youtube-video' ? 'custom-youtube-video' :
        'custom-youtube-playlist';

      items.push({
        id: `custom-${content.id}`,
        type: displayType,
        customContent: content,
      });
    });
  }

  // For mixed mode, interleave ads and custom content based on adsContentRatio
  if (contentMode === 'mixed') {
    const adItems = items.filter(item => item.type === 'ad');
    const customItems = items.filter(item => item.type !== 'ad');

    // If no ads or no custom content, return what we have
    if (adItems.length === 0) return customItems;
    if (customItems.length === 0) return adItems;

    const adsPercentage = settings.adsContentRatio ?? 50;
    const contentPercentage = 100 - adsPercentage;

    // Handle edge cases
    if (adsPercentage >= 95) return adItems; // Show only ads if 95% or more
    if (adsPercentage <= 5) return customItems; // Show only content if 5% or less

    // Calculate ratio: how many items of each type to show
    // Use a base of 20 items for good distribution granularity
    const totalSlots = 20;
    const adsSlots = Math.round((adsPercentage / 100) * totalSlots);
    const contentSlots = totalSlots - adsSlots;

    // Create the mixed array based on ratio
    const mixedItems: DisplayItem[] = [];
    let adIndex = 0;
    let contentIndex = 0;

    // Distribute items proportionally
    for (let i = 0; i < totalSlots; i++) {
      // Determine if this slot should be an ad or custom content
      const shouldBeAd = (i * 100) / totalSlots < adsPercentage;

      if (shouldBeAd && adItems.length > 0) {
        mixedItems.push(adItems[adIndex % adItems.length]);
        adIndex++;
      } else if (!shouldBeAd && customItems.length > 0) {
        mixedItems.push(customItems[contentIndex % customItems.length]);
        contentIndex++;
      }
    }

    return mixedItems;
  }

  return items;
}
