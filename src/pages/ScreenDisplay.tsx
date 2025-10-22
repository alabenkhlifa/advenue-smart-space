import { useEffect, useState, useRef } from "react";
import {
  generateScreenId,
  generatePairingCode,
  createPairingRequest,
  validateSessionToken,
  hashPairingCode,
} from "@/lib/pairing";
import { getScreenMedia, getScreenCampaignSettings } from "@/lib/campaigns";
import { startImpression, endImpression } from "@/lib/analytics";
import { getMediaFile, blobToDataUrl } from "@/lib/mediaStorage";
import { Card } from "@/components/ui/card";
import { Tv, Shield, Clock } from "lucide-react";

const ScreenDisplay = () => {
  const [screenId, setScreenId] = useState<string>("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [isPaired, setIsPaired] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [media, setMedia] = useState<any[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [currentImpressionId, setCurrentImpressionId] = useState<string | null>(null);

  const expiryTime = useRef<number>(0);

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
        loadMedia(storedScreenId);
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
            loadMedia(screenId);
          }
        } catch (error) {
          console.error("Error checking pairing:", error);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkPairing);
  }, [screenId, isPaired]);

  // Load media for paired screen
  const loadMedia = async (screenId: string) => {
    const mediaList = getScreenMedia(screenId);
    setMedia(mediaList);

    // Load media URLs from IndexedDB
    const urls: Record<string, string> = {};
    for (const item of mediaList) {
      if (item.storedInIndexedDB && item.url.startsWith('indexeddb://')) {
        try {
          const storedMedia = await getMediaFile(item.id);
          if (storedMedia) {
            const dataUrl = await blobToDataUrl(storedMedia.blob);
            urls[item.id] = dataUrl;
          }
        } catch (error) {
          console.error(`Failed to load media ${item.id} from IndexedDB:`, error);
        }
      } else {
        // Legacy data URL
        urls[item.id] = item.url;
      }
    }
    setMediaUrls(urls);
  };

  // Poll for media updates
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

      // Reload media
      loadMedia(screenId);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [isPaired, screenId, sessionToken]);

  // Media rotation with smart video playback
  useEffect(() => {
    if (!isPaired || media.length === 0) return;

    const settings = getScreenCampaignSettings(screenId);
    const rotationMs = settings.rotationFrequency * 1000;
    const currentMedia = media[currentMediaIndex];

    // Start tracking impression for current media
    if (currentMedia) {
      const impressionId = startImpression(
        screenId,
        currentMedia.campaignId || "unknown",
        currentMedia.id,
        currentMedia.type,
        localStorage.getItem("venue_name") || undefined
      );
      setCurrentImpressionId(impressionId);
    }

    // Determine rotation time based on media type and playback mode
    let timeoutMs = rotationMs;

    if (currentMedia && currentMedia.type === 'video') {
      const videoDuration = currentMedia.duration || 0;
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

    const rotationTimeout = setTimeout(() => {
      // End current impression
      if (currentImpressionId) {
        endImpression(currentImpressionId);
      }

      // Move to next media
      setCurrentMediaIndex((prev) => (prev + 1) % media.length);
    }, timeoutMs);

    return () => {
      clearTimeout(rotationTimeout);
      if (currentImpressionId) {
        endImpression(currentImpressionId);
      }
    };
  }, [isPaired, media, currentMediaIndex, screenId]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isPaired && media.length > 0) {
    const currentMedia = media[currentMediaIndex];
    const currentUrl = mediaUrls[currentMedia.id];
    const settings = getScreenCampaignSettings(screenId);

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

    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
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
      </div>
    );
  }

  if (isPaired && media.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
        <Card className="p-12 text-center max-w-2xl bg-card/95 backdrop-blur-md border-primary/20">
          <Tv className="mx-auto mb-6 text-primary" size={80} />
          <h1 className="text-4xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
            Screen Paired Successfully
          </h1>
          <p className="text-2xl text-muted-foreground">
            Waiting for campaigns to be assigned...
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
