import { useEffect, useState } from 'react';
import { generateMediaQRCode } from '@/lib/qrCode';

interface QRCodeOverlayProps {
  screenId: string;
  campaignId: string;
  mediaId: string;
  enabled: boolean; // Only show QR if campaign has a target URL
}

type QRPosition = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

const QRCodeOverlay = ({ screenId, campaignId, mediaId, enabled }: QRCodeOverlayProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [position, setPosition] = useState<QRPosition>('top-left');
  const [isLoading, setIsLoading] = useState(true);

  // Generate QR code when component mounts or when IDs change
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const generateQR = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await generateMediaQRCode(screenId, campaignId, mediaId, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [screenId, campaignId, mediaId, enabled]);

  // Animate QR code position
  useEffect(() => {
    if (!enabled) return;

    const positions: QRPosition[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % positions.length;
      setPosition(positions[currentIndex]);
    }, 5000); // Move every 5 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || isLoading || !qrCodeDataUrl) {
    return null;
  }

  // Position styles
  const positionStyles: Record<QRPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`
        fixed z-50
        ${positionStyles[position]}
        transition-all duration-1000 ease-in-out
        w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48
      `}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))',
      }}
    >
      <div className="relative w-full h-full">
        {/* White background with slight transparency */}
        <div className="absolute inset-0 bg-white/95 rounded-xl backdrop-blur-sm" />

        {/* QR Code */}
        <div className="absolute inset-0 p-2 flex items-center justify-center">
          <img
            src={qrCodeDataUrl}
            alt="Scan QR Code"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Optional scan instruction */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-white text-xs md:text-sm font-semibold bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm">
            Scan Me
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRCodeOverlay;
