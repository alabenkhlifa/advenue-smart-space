// Custom content types and storage for screen owners
export type CustomContentType = 'menu' | 'youtube-video' | 'youtube-playlist';

export interface CustomContent {
  id: string;
  ownerId: string;
  type: CustomContentType;
  title: string;

  // For YouTube content
  youtubeUrl?: string;
  youtubeId?: string;
  playlistId?: string;

  // For menu images (reuse existing media storage)
  mediaId?: string;

  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'advenue_custom_content';

// Helper function to extract YouTube video/playlist ID from URL
export function parseYouTubeUrl(url: string): { type: 'video' | 'playlist' | null; id: string | null } {
  try {
    const urlObj = new URL(url);

    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      const playlistId = urlObj.searchParams.get('list');

      if (playlistId) {
        return { type: 'playlist', id: playlistId };
      }
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }

    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }

    return { type: null, id: null };
  } catch (error) {
    return { type: null, id: null };
  }
}

// Get all custom content from storage
function getAllCustomContent(): CustomContent[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save all custom content to storage
function saveAllCustomContent(content: CustomContent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));

  // Dispatch custom event for same-window reactivity
  window.dispatchEvent(new CustomEvent('advenue-content-changed', {
    detail: { content }
  }));
}

// Create new custom content
export function createCustomContent(content: Omit<CustomContent, 'id' | 'createdAt' | 'updatedAt'>): CustomContent {
  const newContent: CustomContent = {
    ...content,
    id: `CONTENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const allContent = getAllCustomContent();
  allContent.push(newContent);
  saveAllCustomContent(allContent);

  return newContent;
}

// Get custom content by owner ID
export function getOwnerCustomContent(ownerId: string): CustomContent[] {
  const allContent = getAllCustomContent();
  return allContent.filter(content => content.ownerId === ownerId);
}

// Get custom content by ID
export function getCustomContentById(id: string): CustomContent | null {
  const allContent = getAllCustomContent();
  return allContent.find(content => content.id === id) || null;
}

// Get multiple custom content items by IDs
export function getCustomContentByIds(ids: string[]): CustomContent[] {
  const allContent = getAllCustomContent();
  return allContent.filter(content => ids.includes(content.id));
}

// Update custom content
export function updateCustomContent(id: string, updates: Partial<Omit<CustomContent, 'id' | 'ownerId' | 'createdAt'>>): CustomContent | null {
  const allContent = getAllCustomContent();
  const index = allContent.findIndex(content => content.id === id);

  if (index === -1) {
    return null;
  }

  allContent[index] = {
    ...allContent[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveAllCustomContent(allContent);
  return allContent[index];
}

// Delete custom content
export function deleteCustomContent(id: string): boolean {
  const allContent = getAllCustomContent();
  const index = allContent.findIndex(content => content.id === id);

  if (index === -1) {
    return false;
  }

  allContent.splice(index, 1);
  saveAllCustomContent(allContent);
  return true;
}

// Create YouTube content from URL
export function createYouTubeContent(
  ownerId: string,
  title: string,
  url: string
): CustomContent | { error: string } {
  const parsed = parseYouTubeUrl(url);

  if (!parsed.type || !parsed.id) {
    return { error: 'Invalid YouTube URL. Please provide a valid YouTube video or playlist URL.' };
  }

  const content: Omit<CustomContent, 'id' | 'createdAt' | 'updatedAt'> = {
    ownerId,
    title,
    type: parsed.type === 'playlist' ? 'youtube-playlist' : 'youtube-video',
    youtubeUrl: url,
  };

  if (parsed.type === 'playlist') {
    content.playlistId = parsed.id;
  } else {
    content.youtubeId = parsed.id;
  }

  return createCustomContent(content);
}

// Create menu content from media ID
export function createMenuContent(
  ownerId: string,
  title: string,
  mediaId: string
): CustomContent {
  return createCustomContent({
    ownerId,
    title,
    type: 'menu',
    mediaId,
  });
}

// Get custom content by IDs (to be called from screenContent.ts)
// This function doesn't check settings, just returns content by IDs
export function getScreenCustomContentByIds(contentIds: string[]): CustomContent[] {
  if (contentIds.length === 0) {
    return [];
  }

  return getCustomContentByIds(contentIds);
}
