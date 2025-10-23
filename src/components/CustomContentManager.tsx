import { useState } from 'react';
import { Upload, Youtube, FileImage, Trash2, Plus } from 'lucide-react';
import {
  CustomContent,
  createYouTubeContent,
  createMenuContent,
  deleteCustomContent,
  parseYouTubeUrl,
} from '../lib/customContent';
import { addMediaToCampaignWithBlob, validateMediaFile } from '../lib/campaigns';
import { storeMediaFile, fileToBlob } from '../lib/mediaStorage';
import MediaThumbnail from './MediaThumbnail';

interface CustomContentManagerProps {
  ownerId: string;
  customContent: CustomContent[];
  onContentChange: () => void;
}

export function CustomContentManager({
  ownerId,
  customContent,
  onContentChange,
}: CustomContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'menus' | 'youtube'>('menus');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [menuTitle, setMenuTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const menus = customContent.filter(c => c.type === 'menu');
  const youtubeContent = customContent.filter(
    c => c.type === 'youtube-video' || c.type === 'youtube-playlist'
  );

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!youtubeTitle.trim()) {
      setError('Please enter a title');
      return;
    }

    const parsed = parseYouTubeUrl(youtubeUrl);
    if (!parsed.type || !parsed.id) {
      setError('Invalid YouTube URL. Please provide a valid YouTube video or playlist URL.');
      return;
    }

    const result = createYouTubeContent(ownerId, youtubeTitle, youtubeUrl);

    if ('error' in result) {
      setError(result.error);
      return;
    }

    setYoutubeUrl('');
    setYoutubeTitle('');
    onContentChange();
  };

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsUploading(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, GIF, WebP)');
        setIsUploading(false);
        return;
      }

      // Create media ID
      const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Store file in IndexedDB
      const blob = await fileToBlob(file);
      await storeMediaFile({
        id: mediaId,
        campaignId: 'custom-content', // Special identifier for custom content
        name: file.name,
        type: 'image',
        blob,
        size: file.size,
        uploadedAt: Date.now(),
      });

      // Create menu content
      const title = menuTitle.trim() || file.name;
      createMenuContent(ownerId, title, mediaId);

      setMenuTitle('');
      onContentChange();
    } catch (err) {
      console.error('Failed to upload menu:', err);
      setError('Failed to upload menu. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    const content = customContent.find(c => c.id === contentId);
    if (!content) return;

    // If it's a menu with media, delete the media from IndexedDB
    if (content.type === 'menu' && content.mediaId) {
      try {
        const { deleteMediaFile } = await import('../lib/mediaStorage');
        await deleteMediaFile(content.mediaId);
      } catch (err) {
        console.error('Failed to delete media file:', err);
      }
    }

    deleteCustomContent(contentId);
    onContentChange();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">My Content Library</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('menus')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'menus'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileImage className="inline-block w-4 h-4 mr-2" />
          Menus ({menus.length})
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'youtube'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Youtube className="inline-block w-4 h-4 mr-2" />
          YouTube ({youtubeContent.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === 'menus' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Menu Image
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={menuTitle}
                onChange={e => setMenuTitle(e.target.value)}
                placeholder="Menu title (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <label className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMenuUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </div>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: JPEG, PNG, GIF, WebP (max 50MB)
            </p>
          </div>

          {/* Menu List */}
          <div className="space-y-2">
            {menus.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No menus uploaded yet. Upload your first menu above.
              </div>
            ) : (
              menus.map(menu => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Preview thumbnail */}
                    <MediaThumbnail
                      mediaId={menu.mediaId}
                      mediaName={menu.title}
                      mediaType="image"
                      url={`indexeddb://${menu.mediaId}`}
                      storedInIndexedDB={true}
                      className="w-16 h-16 flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{menu.title}</p>
                      <p className="text-xs text-gray-500">
                        Added {new Date(menu.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* YouTube Tab */}
      {activeTab === 'youtube' && (
        <div>
          <form onSubmit={handleYouTubeSubmit} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add YouTube Video or Playlist
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={youtubeTitle}
                onChange={e => setYoutubeTitle(e.target.value)}
                placeholder="Title (e.g., 'Main Menu Display')"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="YouTube URL (video or playlist)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter a YouTube video URL (e.g., youtube.com/watch?v=...) or playlist URL (e.g.,
              youtube.com/playlist?list=...)
            </p>
          </form>

          {/* YouTube Content List */}
          <div className="space-y-2">
            {youtubeContent.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No YouTube content added yet. Add your first video or playlist above.
              </div>
            ) : (
              youtubeContent.map(content => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{content.title}</p>
                      <p className="text-xs text-gray-500">
                        {content.type === 'youtube-playlist' ? 'Playlist' : 'Video'} • Added{' '}
                        {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete content"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
