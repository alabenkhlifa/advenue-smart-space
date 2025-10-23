import { useEffect, useState, useRef } from "react";
import {
  generateScreenId,
  generatePairingCode,
  createPairingRequest,
  validateSessionToken,
  hashPairingCode,
  getPairedScreen,
} from "@/lib/pairing";
import { getScreenCampaignSettings, getCampaignById } from "@/lib/campaigns";
import { startImpression, endImpression, trackQRCodeScan } from "@/lib/analytics";
import { getMediaFile, blobToDataUrl } from "@/lib/mediaStorage";
import { getVenueById } from "@/lib/auth";
import { getScreenDisplayItems, DisplayItem } from "@/lib/screenContent";
import { Card } from "@/components/ui/card";
import { Tv, Shield, Clock } from "lucide-react";
import QRCodeOverlay from "@/components/QRCodeOverlay";
import { YouTubePlayer } from "@/components/YouTubePlayer";

const ScreenDisplay = () => {
  const [screenId, setScreenId] = useState<string>("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [isPaired, setIsPaired] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [currentImpressionId, setCurrentImpressionId] = useState<string | null>(null);

  const expiryTime = useRef<number>(0);
  const loadContentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [displayItemsHash, setDisplayItemsHash] = useState<string>('');

  // Use a ref to track what's actually being displayed (updates synchronously)
  const actualDisplayRef = useRef<{ hash: string; type: string; count: number }>({
    hash: '',
    type: 'none',
    count: 0
  });

  // Initialize pairing on mount
  useEffect(() => {
    initializePairing();
  }, []);

  const initializePairing = async () => {
    // Check if already paired
    const storedScreenId = localStorage.getItem("screen_id");
    const storedToken = localStorage.getItem("screen_token");

    if (storedScreenId && storedToken) {
      const validation = validateSessionToken(storedScreenId, storedToken);
      if (validation.valid) {
        setScreenId(storedScreenId);
        setSessionToken(storedToken);
        setIsPaired(true);
        loadDisplayContent(storedScreenId);
        return;
      } else {
        // Clear invalid session
        localStorage.removeItem("screen_id");
        localStorage.removeItem("screen_token");
      }
    }

    // Generate new pairing credentials
    const newScreenId = generateScreenId();
    const newPairingCode = generatePairingCode();

    setScreenId(newScreenId);
    setPairingCode(newPairingCode);

    // Create pairing request
    await createPairingRequest(newScreenId, newPairingCode);

    // Set expiry time
    expiryTime.current = Date.now() + 600000; // 10 minutes
  };

  // Countdown timer
  useEffect(() => {
    if (isPaired) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime.current - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Regenerate pairing code
        initializePairing();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaired]);

  // Check for pairing status
  useEffect(() => {
    if (isPaired) return;

    const checkPairing = setInterval(() => {
      const pairedScreens = localStorage.getItem("advenue_paired_screens");
      if (pairedScreens) {
        try {
          const screens = JSON.parse(pairedScreens);
          const screen = screens[screenId];

          if (screen) {
            setSessionToken(screen.sessionToken);
            setIsPaired(true);
            localStorage.setItem("screen_id", screenId);
            localStorage.setItem("screen_token", screen.sessionToken);
            loadDisplayContent(screenId);
          }
        } catch (error) {
          console.error("Error checking pairing:", error);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkPairing);
  }, [screenId, isPaired]);

  // Debounced load display content to prevent rapid successive calls
  const loadDisplayContentDebounced = (screenId: string, immediate: boolean = false) => {
    // Clear any pending timeout
    if (loadContentTimeoutRef.current) {
      clearTimeout(loadContentTimeoutRef.current);
    }

    if (immediate) {
      // Execute immediately (for user-triggered changes)
      loadDisplayContent(screenId);
    } else {
      // Debounce for 200ms (for polling)
      loadContentTimeoutRef.current = setTimeout(() => {
        loadDisplayContent(screenId);
      }, 200);
    }
  };

  // Load display content for paired screen (ads + custom content)
  const loadDisplayContent = async (screenId: string) => {
    const items = getScreenDisplayItems(screenId);

    // Only update if the items have actually changed (compare by IDs)
    const newItemIds = items.map(i => i.id).sort().join(',');

    // Get the first item type from new items
    const newFirstType = items.length > 0 ? items[0].type : 'none';

    // CRITICAL: Use the ref (actualDisplayRef) for comparison, not state!
    // State updates are async and may not reflect what's actually displaying
    const actualHash = actualDisplayRef.current.hash;
    const actualType = actualDisplayRef.current.type;
    const actualCount = actualDisplayRef.current.count;

    // Check if anything changed
    const hashChanged = newItemIds !== actualHash;
    const countChanged = items.length !== actualCount;
    const typeChanged = newFirstType !== actualType;

    if (hashChanged || countChanged || typeChanged) {
      // Update state
      setDisplayItems(items);
      setDisplayItemsHash(newItemIds);
      setCurrentDisplayIndex(0);

      // Update the ref immediately (synchronously)
      actualDisplayRef.current = {
        hash: newItemIds,
        type: newFirstType,
        count: items.length
      };
    }

    // Load media URLs from IndexedDB for ads and menu images (always update URLs in case of new items)
    const urls: Record<string, string> = {};
    for (const item of items) {
      // Handle ad media
      if (item.type === 'ad' && item.mediaFile) {
        const media = item.mediaFile;
        const mediaId = media.id;

        // Skip if already loaded
        if (mediaUrls[mediaId]) {
          urls[mediaId] = mediaUrls[mediaId];
          continue;
        }

        if (media.storedInIndexedDB && media.url.startsWith('indexeddb://')) {
          try {
            const storedMedia = await getMediaFile(mediaId);
            if (storedMedia) {
              const dataUrl = await blobToDataUrl(storedMedia.blob);
              urls[mediaId] = dataUrl;
            }
          } catch (error) {
            console.error(`Failed to load media ${mediaId} from IndexedDB:`, error);
          }
        } else {
          // Legacy data URL
          urls[mediaId] = media.url;
        }
      }

      // Handle custom menu images
      if (item.type === 'custom-menu' && item.customContent?.mediaId) {
        const mediaId = item.customContent.mediaId;

        // Skip if already loaded
        if (mediaUrls[mediaId]) {
          urls[mediaId] = mediaUrls[mediaId];
          continue;
        }

        try {
          const storedMedia = await getMediaFile(mediaId);
          if (storedMedia) {
            const dataUrl = await blobToDataUrl(storedMedia.blob);
            urls[mediaId] = dataUrl;
          }
        } catch (error) {
          console.error(`Failed to load menu media ${mediaId} from IndexedDB:`, error);
        }
      }
    }

    // Only update mediaUrls if there are actually new URLs to add
    const hasNewUrls = Object.keys(urls).some(key => !mediaUrls[key]);
    if (hasNewUrls) {
      setMediaUrls(urls);
    }
  };

  // Poll for content updates
  useEffect(() => {
    if (!isPaired) return;

    const pollInterval = setInterval(() => {
      // Validate token
      const validation = validateSessionToken(screenId, sessionToken);
      if (!validation.valid) {
        setIsPaired(false);
        localStorage.removeItem("screen_id");
        localStorage.removeItem("screen_token");
        return;
      }

      // Reload display content (debounced to prevent interference with rotation)
      loadDisplayContentDebounced(screenId, false);
    }, 5000); // Poll every 5 seconds for more responsive updates

    return () => clearInterval(pollInterval);
  }, [isPaired, screenId, sessionToken]);

  // Listen for localStorage changes from other tabs/windows (e.g., dashboard)
  useEffect(() => {
    if (!isPaired) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Check if screen settings or custom content changed
      if (e.key === 'advenue_screen_settings' || e.key === 'advenue_custom_content') {
        loadDisplayContentDebounced(screenId, true); // Immediate for user changes
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isPaired, screenId]);

  // Listen for custom events from same window (e.g., when dashboard updates settings in same tab)
  useEffect(() => {
    if (!isPaired) return;

    const handleSettingsChanged = (e: CustomEvent) => {
      console.log(`[custom event] Settings changed for screen ${e.detail.screenId}, reloading content immediately`);
      if (e.detail.screenId === screenId) {
        loadDisplayContentDebounced(screenId, true); // Immediate for user changes
      }
    };

    const handleContentChanged = () => {
      console.log(`[custom event] Custom content changed, reloading content immediately`);
      loadDisplayContentDebounced(screenId, true); // Immediate for user changes
    };

    window.addEventListener('advenue-settings-changed', handleSettingsChanged as EventListener);
    window.addEventListener('advenue-content-changed', handleContentChanged);

    return () => {
      window.removeEventListener('advenue-settings-changed', handleSettingsChanged as EventListener);
      window.removeEventListener('advenue-content-changed', handleContentChanged);
    };
  }, [isPaired, screenId]);

  // Reset index when displayItems change
  useEffect(() => {
    if (displayItems.length > 0 && currentDisplayIndex >= displayItems.length) {
      setCurrentDisplayIndex(0);
    }
  }, [displayItems, currentDisplayIndex]);

  // Content rotation with smart video playback
  // IMPORTANT: Only depends on currentDisplayIndex, NOT displayItems array to prevent restarts
  useEffect(() => {
    if (!isPaired || displayItems.length === 0) {
      return;
    }

    const settings = getScreenCampaignSettings(screenId);
    const rotationMs = settings.rotationFrequency * 1000;
    const currentItem = displayItems[currentDisplayIndex];

    if (!currentItem) {
      setCurrentDisplayIndex(0);
      return;
    }

    // Start tracking impression for current item (only for ads)
    if (currentItem && currentItem.type === 'ad' && currentItem.mediaFile) {
      // Get venue metadata for analytics
      const pairedScreen = getPairedScreen(screenId);
      const venue = pairedScreen?.venueId ? getVenueById(pairedScreen.venueId) : null;

      const contentType = currentItem.mediaFile.type;
      const contentId = currentItem.mediaFile.id;
      const campaignId = currentItem.campaignId || 'unknown';

      const impressionId = startImpression(
        screenId,
        campaignId,
        contentId,
        contentType,
        {
          venueName: venue?.name || pairedScreen?.venueName || localStorage.getItem("venue_name") || undefined,
          venueId: pairedScreen?.venueId,
          ownerId: pairedScreen?.ownerId,
          region: venue?.region,
          city: venue?.city,
          country: venue?.country,
        }
      );
      setCurrentImpressionId(impressionId);
    }

    // Determine rotation time based on content type and playback mode
    let timeoutMs = rotationMs;

    // For ad videos, use smart playback modes
    if (currentItem.type === 'ad' && currentItem.mediaFile && currentItem.mediaFile.type === 'video') {
      const videoDuration = currentItem.mediaFile.duration || 0;
      const videoDurationMs = videoDuration * 1000;

      switch (settings.videoPlaybackMode) {
        case 'complete':
          // Always play to completion
          timeoutMs = videoDurationMs || rotationMs;
          break;
        case 'rotation':
          // Use rotation time (may cut video)
          timeoutMs = rotationMs;
          break;
        case 'smart':
        default:
          // Use the longer of video duration or rotation time
          timeoutMs = Math.max(videoDurationMs, rotationMs);
          break;
      }
    }

    // For YouTube content, use rotation time (YouTube player handles its own playback)
    // YouTube will auto-advance to next in playlist or end
    if (currentItem.type === 'custom-youtube-video' || currentItem.type === 'custom-youtube-playlist') {
      // Use a longer timeout for YouTube content (default 60 seconds unless rotationMs is longer)
      timeoutMs = Math.max(rotationMs, 60000);
    }

    const rotationTimeout = setTimeout(() => {
      // End current impression
      if (currentImpressionId) {
        endImpression(currentImpressionId);
      }

      // Move to next item
      setCurrentDisplayIndex((prev) => (prev + 1) % displayItems.length);
    }, timeoutMs);

    return () => {
      clearTimeout(rotationTimeout);
      if (currentImpressionId) {
        endImpression(currentImpressionId);
      }
    };
  }, [isPaired, currentDisplayIndex, screenId, displayItemsHash]); // Use hash instead of array to prevent unnecessary restarts

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isPaired && displayItems.length > 0) {
    const currentItem = displayItems[currentDisplayIndex];
    const settings = getScreenCampaignSettings(screenId);

    // Safety check: if currentItem is undefined (shouldn't happen but just in case)
    if (!currentItem) {
      console.error(`[render] No item at index ${currentDisplayIndex}, total items: ${displayItems.length}`);
      return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <p className="text-white text-2xl">Loading content...</p>
        </div>
      );
    }


    // Render based on item type
    if (currentItem.type === 'ad' && currentItem.mediaFile) {
      const currentMedia = currentItem.mediaFile;
      const currentUrl = mediaUrls[currentMedia.id];

      if (!currentUrl) {
        return (
          <div className="min-h-screen w-full bg-black flex items-center justify-center">
            <p className="text-white text-2xl">Loading media...</p>
          </div>
        );
      }

      // Determine if video should loop
      let shouldLoop = false;
      if (currentMedia.type === 'video') {
        const videoDuration = (currentMedia.duration || 0) * 1000;
        const rotationMs = settings.rotationFrequency * 1000;

        if (settings.videoPlaybackMode === 'rotation' ||
            (settings.videoPlaybackMode === 'smart' && videoDuration < rotationMs)) {
          shouldLoop = true;
        }
      }

      // Get campaign to check if it has a target URL for QR code
      const campaign = currentMedia.campaignId ? getCampaignById(currentMedia.campaignId) : null;
      const showQRCode = !!(campaign && campaign.targetUrl);

      return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center relative">
          {currentMedia.type === "image" ? (
            <img
              src={currentUrl}
              alt="Advertisement"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentUrl}
              autoPlay
              muted
              loop={shouldLoop}
              className="w-full h-full object-contain"
            />
          )}

          {/* QR Code Overlay */}
          {showQRCode && currentMedia.campaignId && (
            <QRCodeOverlay
              screenId={screenId}
              campaignId={currentMedia.campaignId}
              mediaId={currentMedia.id}
              enabled={showQRCode}
            />
          )}
        </div>
      );
    }

    // Render custom menu image
    if (currentItem.type === 'custom-menu' && currentItem.customContent?.mediaId) {
      const mediaId = currentItem.customContent.mediaId;
      const currentUrl = mediaUrls[mediaId];

      if (!currentUrl) {
        return (
          <div className="min-h-screen w-full bg-black flex items-center justify-center">
            <p className="text-white text-2xl">Loading menu...</p>
          </div>
        );
      }

      return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center relative">
          <img
            src={currentUrl}
            alt={currentItem.customContent.title}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // Render YouTube video or playlist
    if ((currentItem.type === 'custom-youtube-video' || currentItem.type === 'custom-youtube-playlist') && currentItem.customContent) {
      const content = currentItem.customContent;

      return (
        <div className="min-h-screen w-full bg-black">
          <YouTubePlayer
            videoId={content.youtubeId}
            playlistId={content.playlistId}
            onEnd={() => {
              // Auto-advance to next item when video/playlist ends
              setCurrentDisplayIndex((prev) => (prev + 1) % displayItems.length);
            }}
            muted={true}
            autoplay={true}
          />
        </div>
      );
    }

    // Fallback for unknown type
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <p className="text-white text-2xl">Unknown content type</p>
      </div>
    );
  }

  if (isPaired && displayItems.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
        <Card className="p-12 text-center max-w-2xl bg-card/95 backdrop-blur-md border-primary/20">
          <Tv className="mx-auto mb-6 text-primary" size={80} />
          <h1 className="text-4xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
            Screen Paired Successfully
          </h1>
          <p className="text-2xl text-muted-foreground">
            Waiting for content to be assigned...
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Screen ID: <span className="font-mono font-bold">{screenId}</span>
          </p>
        </Card>
      </div>
    );
  }

  // Pairing screen
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
      <div className="absolute inset-0 z-0 gradient-mesh opacity-30" />

      <Card className="relative z-10 p-12 text-center max-w-4xl bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl">
        <div className="flex items-center justify-center mb-8">
          <div className="p-6 bg-primary/10 rounded-full">
            <Tv className="text-primary" size={80} />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
          AdVenue Screen
        </h1>

        <p className="text-2xl text-muted-foreground mb-12">
          Pair this screen with your venue account
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-background/50 rounded-2xl p-8 border-2 border-primary/30">
            <div className="flex items-center justify-center mb-4">
              <Shield className="text-primary mr-2" size={32} />
              <h2 className="text-2xl font-bold">Screen ID</h2>
            </div>
            <p className="text-6xl font-mono font-bold text-primary tracking-wider break-all">
              {screenId}
            </p>
          </div>

          <div className="bg-background/50 rounded-2xl p-8 border-2 border-accent/30">
            <div className="flex items-center justify-center mb-4">
              <Shield className="text-accent mr-2" size={32} />
              <h2 className="text-2xl font-bold">Pairing Code</h2>
            </div>
            <p className="text-6xl font-mono font-bold text-accent tracking-wider">
              {pairingCode}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 border border-border">
          <div className="flex items-center justify-center mb-2">
            <Clock className="text-muted-foreground mr-2" size={24} />
            <span className="text-lg font-semibold">Code expires in:</span>
          </div>
          <p className="text-4xl font-mono font-bold text-foreground">
            {formatTime(timeRemaining)}
          </p>
        </div>

        <div className="mt-8 text-left bg-background/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Shield className="mr-2 text-primary" size={24} />
            Security Features:
          </h3>
          <ul className="space-y-2 text-lg text-muted-foreground">
            <li>✓ Cryptographically secure pairing code</li>
            <li>✓ One-time use only</li>
            <li>✓ 10-minute expiration window</li>
            <li>✓ Maximum 3 pairing attempts</li>
            <li>✓ Encrypted session management</li>
          </ul>
        </div>

        <p className="mt-8 text-lg text-muted-foreground">
          Enter these credentials in your AdVenue dashboard to pair this screen
        </p>
      </Card>
    </div>
  );
};

export default ScreenDisplay;
