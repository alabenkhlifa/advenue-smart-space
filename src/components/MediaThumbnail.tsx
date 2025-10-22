import { useEffect, useState } from "react";
import { getMediaFile, blobToDataUrl } from "@/lib/mediaStorage";
import { Video, Clock } from "lucide-react";

interface MediaThumbnailProps {
  mediaId: string;
  mediaName: string;
  mediaType: "image" | "video";
  url: string;
  storedInIndexedDB?: boolean;
  duration?: number; // Video duration in seconds
  className?: string;
}

const MediaThumbnail = ({
  mediaId,
  mediaName,
  mediaType,
  url,
  storedInIndexedDB,
  duration,
  className = "",
}: MediaThumbnailProps) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMedia = async () => {
      if (storedInIndexedDB && url.startsWith("indexeddb://")) {
        try {
          const storedMedia = await getMediaFile(mediaId);
          if (storedMedia) {
            const blobUrl = await blobToDataUrl(storedMedia.blob);
            setDataUrl(blobUrl);
          }
        } catch (error) {
          console.error("Failed to load media from IndexedDB:", error);
        }
      } else {
        // Legacy data URL
        setDataUrl(url);
      }
      setLoading(false);
    };

    loadMedia();
  }, [mediaId, url, storedInIndexedDB]);

  if (loading) {
    return (
      <div className={`bg-muted rounded-md overflow-hidden animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className={`bg-muted rounded-md overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Failed to load</span>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`bg-muted rounded-md overflow-hidden relative ${className}`}>
      {mediaType === "image" ? (
        <img
          src={dataUrl}
          alt={mediaName}
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          <video
            src={dataUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {/* Video icon overlay to indicate it's a video */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-white/90 rounded-full p-2">
              <Video size={20} className="text-black" />
            </div>
          </div>
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none">
              <Clock size={10} />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaThumbnail;
