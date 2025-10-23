import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId?: string;
  playlistId?: string;
  onEnd?: () => void;
  muted?: boolean;
  autoplay?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({
  videoId,
  playlistId,
  onEnd,
  muted = true,
  autoplay = true,
}: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else if (window.YT.Player) {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    // Create player configuration
    const playerVars: any = {
      autoplay: autoplay ? 1 : 0,
      mute: muted ? 1 : 0,
      controls: 0, // Hide controls for kiosk mode
      disablekb: 1, // Disable keyboard controls
      fs: 0, // Hide fullscreen button
      modestbranding: 1, // Hide YouTube logo
      rel: 0, // Don't show related videos at end
      showinfo: 0, // Hide video title
      iv_load_policy: 3, // Hide annotations
    };

    if (playlistId) {
      playerVars.list = playlistId;
      playerVars.listType = 'playlist';
    }

    // Create YouTube player
    ytPlayerRef.current = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: playerVars,
      events: {
        onReady: (event: any) => {
          if (autoplay) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED = 0
          if (event.data === 0 && onEnd) {
            onEnd();
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          // Error codes:
          // 2 - Invalid parameter
          // 5 - HTML5 player error
          // 100 - Video not found
          // 101, 150 - Video not allowed to be played in embedded players
          if (onEnd) {
            onEnd(); // Skip to next content on error
          }
        },
      },
    });

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
      }
    };
  }, [isReady, videoId, playlistId, muted, autoplay, onEnd]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div
        ref={playerRef}
        className="w-full h-full"
        style={{ aspectRatio: '16/9' }}
      />
    </div>
  );
}
