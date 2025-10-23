// IndexedDB wrapper for storing media files (images/videos)
// This allows storing large files without the 5-10MB localStorage limit

const DB_NAME = 'advenue_media_db';
const STORE_NAME = 'media_files';
const DB_VERSION = 1;

export interface StoredMedia {
  id: string;
  campaignId: string;
  name: string;
  type: 'image' | 'video';
  blob: Blob;
  size: number;
  uploadedAt: number;
}

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('campaignId', 'campaignId', { unique: false });
      }
    };
  });
};

// Store media file in IndexedDB
export const storeMediaFile = async (media: StoredMedia): Promise<void> => {
  console.log('[storeMediaFile] Storing media:', {
    id: media.id,
    type: media.type,
    blobSize: media.blob?.size,
    blobType: media.blob?.type,
    isBlob: media.blob instanceof Blob
  });

  if (!(media.blob instanceof Blob)) {
    throw new Error('media.blob must be a Blob instance');
  }

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(media);

    request.onsuccess = () => {
      console.log('[storeMediaFile] Successfully stored media:', media.id);
      resolve();
    };
    request.onerror = () => {
      console.error('[storeMediaFile] Error storing media:', request.error);
      reject(request.error);
    };
  });
};

// Get media file from IndexedDB
export const getMediaFile = async (id: string): Promise<StoredMedia | null> => {
  console.log('[getMediaFile] Retrieving media:', id);
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result || null;
      if (result) {
        console.log('[getMediaFile] Found media:', {
          id: result.id,
          type: result.type,
          blobSize: result.blob?.size,
          blobType: result.blob?.type,
          isBlob: result.blob instanceof Blob
        });
      } else {
        console.log('[getMediaFile] No media found for id:', id);
      }
      resolve(result);
    };
    request.onerror = () => {
      console.error('[getMediaFile] Error retrieving media:', request.error);
      reject(request.error);
    };
  });
};

// Get all media files for a campaign
export const getCampaignMediaFiles = async (campaignId: string): Promise<StoredMedia[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('campaignId');
    const request = index.getAll(campaignId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Delete media file from IndexedDB
export const deleteMediaFile = async (id: string): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get all media files
export const getAllMediaFiles = async (): Promise<StoredMedia[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Convert Blob to data URL for display
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => {
      console.error('[blobToDataUrl] FileReader error:', error);
      console.error('[blobToDataUrl] Blob details:', {
        size: blob.size,
        type: blob.type
      });
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

// Convert File to Blob
export const fileToBlob = (file: File): Promise<Blob> => {
  return Promise.resolve(
    new Blob([file], { type: file.type })
  );
};

// Get storage usage estimate
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number; percentage: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  return { usage: 0, quota: 0, percentage: 0 };
};

// Format bytes for display
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
