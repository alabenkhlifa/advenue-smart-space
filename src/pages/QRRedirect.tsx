import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trackQRCodeScan } from '@/lib/analytics';
import { getCampaignById } from '@/lib/campaigns';
import { getPairedScreen } from '@/lib/pairing';
import { getVenueById } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { QrCode, ExternalLink, AlertCircle } from 'lucide-react';

const QRRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'redirecting' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processQRScan = async () => {
      try {
        // Extract URL parameters
        const screenId = searchParams.get('s');
        const campaignId = searchParams.get('c');
        const mediaId = searchParams.get('m');

        // Validate parameters
        if (!screenId || !campaignId || !mediaId) {
          setStatus('error');
          setErrorMessage('Invalid QR code. Missing required parameters.');
          return;
        }

        // Get campaign details to find target URL
        const campaign = getCampaignById(campaignId);

        if (!campaign) {
          setStatus('error');
          setErrorMessage('Campaign not found.');
          return;
        }

        if (!campaign.targetUrl) {
          setStatus('error');
          setErrorMessage('This campaign does not have a target URL configured.');
          return;
        }

        // Get venue metadata for analytics
        const pairedScreen = getPairedScreen(screenId);
        const venue = pairedScreen?.venueId ? getVenueById(pairedScreen.venueId) : null;

        // Record the scan event with region data
        trackQRCodeScan(screenId, campaignId, mediaId, {
          venueId: pairedScreen?.venueId,
          ownerId: pairedScreen?.ownerId,
          region: venue?.region,
          city: venue?.city,
          country: venue?.country,
        });

        // Update status
        setStatus('redirecting');

        // Redirect to target URL after a brief delay (for analytics to be recorded)
        setTimeout(() => {
          // Ensure the URL has a protocol
          let targetUrl = campaign.targetUrl!;
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
          }

          window.location.href = targetUrl;
        }, 1500); // 1.5 second delay
      } catch (error) {
        console.error('Error processing QR scan:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    processQRScan();
  }, [searchParams]);

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
        <Card className="p-12 text-center max-w-md bg-card/95 backdrop-blur-md border-primary/20">
          <QrCode className="mx-auto mb-6 text-primary animate-pulse" size={80} />
          <h1 className="text-3xl font-bold mb-4 text-primary">
            Processing QR Code
          </h1>
          <p className="text-lg text-muted-foreground">
            Please wait while we verify your scan...
          </p>
        </Card>
      </div>
    );
  }

  // Redirecting state
  if (status === 'redirecting') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-8">
        <Card className="p-12 text-center max-w-md bg-card/95 backdrop-blur-md border-primary/20">
          <ExternalLink className="mx-auto mb-6 text-primary animate-bounce" size={80} />
          <h1 className="text-3xl font-bold mb-4 text-primary">
            Redirecting...
          </h1>
          <p className="text-lg text-muted-foreground">
            Taking you to your destination
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-8">
      <Card className="p-12 text-center max-w-md bg-card/95 backdrop-blur-md border-destructive/20">
        <AlertCircle className="mx-auto mb-6 text-destructive" size={80} />
        <h1 className="text-3xl font-bold mb-4 text-destructive">
          Oops!
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          {errorMessage}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go to Homepage
        </button>
      </Card>
    </div>
  );
};

export default QRRedirect;
