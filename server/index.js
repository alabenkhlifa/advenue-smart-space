import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage
const storage = {
  pairingRequests: new Map(), // screenId -> PairingRequest
  pairedScreens: new Map(),   // screenId -> PairedScreen
  campaigns: new Map(),        // campaignId -> Campaign
  screenSettings: new Map(),   // screenId -> ScreenCampaignSettings
  impressions: [],             // Array of ImpressionEvent
  qrScans: [],                 // Array of QRCodeScanEvent
  mediaFiles: new Map(),       // mediaId -> { blob: base64string, metadata }
  users: new Map(),            // userId -> User
  venues: new Map(),           // venueId -> Venue
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ===== PAIRING ENDPOINTS =====

// Create pairing request
app.post('/api/pairing/request', (req, res) => {
  const { screenId, pairingCodeHash, deviceFingerprint } = req.body;

  const request = {
    screenId,
    pairingCodeHash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    createdAt: Date.now(),
    attempts: 0,
    used: false,
    deviceFingerprint,
  };

  storage.pairingRequests.set(screenId, request);
  res.json({ success: true, request });
});

// Get pairing request
app.get('/api/pairing/request/:screenId', (req, res) => {
  const { screenId } = req.params;
  const request = storage.pairingRequests.get(screenId);

  if (!request) {
    return res.status(404).json({ error: 'Pairing request not found' });
  }

  res.json(request);
});

// Validate and pair screen
app.post('/api/pairing/validate', (req, res) => {
  const { screenId, pairingCodeHash, ownerId, venueName, venueId } = req.body;
  const request = storage.pairingRequests.get(screenId);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Invalid Screen ID' });
  }

  if (request.used) {
    return res.status(400).json({ success: false, error: 'Pairing code already used' });
  }

  if (Date.now() > request.expiresAt) {
    return res.status(400).json({ success: false, error: 'Pairing code expired' });
  }

  if (request.attempts >= 3) {
    return res.status(400).json({ success: false, error: 'Maximum pairing attempts exceeded' });
  }

  if (pairingCodeHash !== request.pairingCodeHash) {
    request.attempts++;
    storage.pairingRequests.set(screenId, request);
    return res.status(400).json({
      success: false,
      error: `Invalid pairing code. ${3 - request.attempts} attempts remaining.`
    });
  }

  // Success - create paired screen
  const sessionToken = generateSecureRandom(32);
  const pairedScreen = {
    screenId,
    ownerId,
    pairedAt: Date.now(),
    sessionToken,
    tokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    venueName,
    venueId,
    status: 'online',
    lastSeen: Date.now(),
  };

  request.used = true;
  storage.pairingRequests.set(screenId, request);
  storage.pairedScreens.set(screenId, pairedScreen);

  res.json({ success: true, screen: pairedScreen });
});

// Check pairing status
app.get('/api/pairing/status/:screenId', (req, res) => {
  const { screenId } = req.params;
  const screen = storage.pairedScreens.get(screenId);

  if (!screen) {
    return res.json({ paired: false });
  }

  res.json({ paired: true, screen });
});

// Validate session token
app.post('/api/pairing/validate-token', (req, res) => {
  const { screenId, token } = req.body;
  const screen = storage.pairedScreens.get(screenId);

  if (!screen) {
    return res.json({ valid: false });
  }

  if (screen.sessionToken !== token) {
    return res.json({ valid: false });
  }

  if (Date.now() > screen.tokenExpiresAt) {
    return res.json({ valid: false });
  }

  // Update last seen
  screen.lastSeen = Date.now();
  screen.status = 'online';
  storage.pairedScreens.set(screenId, screen);

  res.json({ valid: true, screen });
});

// Get owner screens
app.get('/api/pairing/owner/:ownerId', (req, res) => {
  const { ownerId } = req.params;
  const screens = Array.from(storage.pairedScreens.values())
    .filter(screen => screen.ownerId === ownerId);

  res.json(screens);
});

// Unpair screen
app.delete('/api/pairing/:screenId', (req, res) => {
  const { screenId } = req.params;
  const { ownerId } = req.body;
  const screen = storage.pairedScreens.get(screenId);

  if (!screen || screen.ownerId !== ownerId) {
    return res.status(404).json({ success: false });
  }

  storage.pairedScreens.delete(screenId);
  res.json({ success: true });
});

// ===== CAMPAIGN ENDPOINTS =====

// Get all campaigns
app.get('/api/campaigns', (req, res) => {
  const campaigns = Array.from(storage.campaigns.values());
  res.json(campaigns);
});

// Get campaign by ID
app.get('/api/campaigns/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const campaign = storage.campaigns.get(campaignId);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.json(campaign);
});

// Get advertiser campaigns
app.get('/api/campaigns/advertiser/:advertiserId', (req, res) => {
  const { advertiserId } = req.params;
  const campaigns = Array.from(storage.campaigns.values())
    .filter(c => c.advertiserId === advertiserId);

  res.json(campaigns);
});

// Get active campaigns
app.get('/api/campaigns/status/active', (req, res) => {
  const campaigns = Array.from(storage.campaigns.values())
    .filter(c => c.status === 'active');

  res.json(campaigns);
});

// Create campaign
app.post('/api/campaigns', (req, res) => {
  const { advertiserId, name, description, budget, targetUrl, category } = req.body;

  const campaign = {
    id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    advertiserId,
    name,
    description,
    category,
    budget,
    targetUrl,
    status: 'draft',
    media: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  storage.campaigns.set(campaign.id, campaign);
  res.json(campaign);
});

// Update campaign
app.put('/api/campaigns/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const campaign = storage.campaigns.get(campaignId);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const updated = {
    ...campaign,
    ...req.body,
    id: campaignId, // Prevent ID change
    updatedAt: Date.now(),
  };

  storage.campaigns.set(campaignId, updated);
  res.json(updated);
});

// Delete campaign
app.delete('/api/campaigns/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { advertiserId } = req.body;
  const campaign = storage.campaigns.get(campaignId);

  if (!campaign || campaign.advertiserId !== advertiserId) {
    return res.status(404).json({ success: false });
  }

  storage.campaigns.delete(campaignId);
  res.json({ success: true });
});

// Add media to campaign
app.post('/api/campaigns/:campaignId/media', (req, res) => {
  const { campaignId } = req.params;
  const campaign = storage.campaigns.get(campaignId);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const mediaFile = {
    id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...req.body,
    uploadedAt: Date.now(),
  };

  campaign.media.push(mediaFile);
  campaign.updatedAt = Date.now();
  storage.campaigns.set(campaignId, campaign);

  res.json(mediaFile);
});

// Remove media from campaign
app.delete('/api/campaigns/:campaignId/media/:mediaId', (req, res) => {
  const { campaignId, mediaId } = req.params;
  const campaign = storage.campaigns.get(campaignId);

  if (!campaign) {
    return res.status(404).json({ success: false });
  }

  const index = campaign.media.findIndex(m => m.id === mediaId);
  if (index === -1) {
    return res.status(404).json({ success: false });
  }

  campaign.media.splice(index, 1);
  campaign.updatedAt = Date.now();
  storage.campaigns.set(campaignId, campaign);

  // Also delete media file from storage
  storage.mediaFiles.delete(mediaId);

  res.json({ success: true });
});

// ===== SCREEN SETTINGS ENDPOINTS =====

// Get screen settings
app.get('/api/screens/:screenId/settings', (req, res) => {
  const { screenId } = req.params;
  const settings = storage.screenSettings.get(screenId) || {
    screenId,
    selectedCampaignIds: [],
    displayAll: false,
    rotationFrequency: 10,
    rotationMode: 'sequential',
    videoPlaybackMode: 'smart',
  };

  res.json(settings);
});

// Update screen settings
app.put('/api/screens/:screenId/settings', (req, res) => {
  const { screenId } = req.params;
  const settings = {
    ...req.body,
    screenId, // Ensure screenId matches
  };

  storage.screenSettings.set(screenId, settings);
  res.json(settings);
});

// Get screen media
app.get('/api/screens/:screenId/media', (req, res) => {
  const { screenId } = req.params;
  const settings = storage.screenSettings.get(screenId) || {
    screenId,
    selectedCampaignIds: [],
    displayAll: false,
    selectedCategories: [],
    rotationFrequency: 10,
    rotationMode: 'sequential',
    videoPlaybackMode: 'smart',
  };

  const allCampaigns = Array.from(storage.campaigns.values())
    .filter(c => c.status === 'active');

  let campaignsToDisplay = settings.displayAll
    ? allCampaigns
    : allCampaigns.filter(c => settings.selectedCampaignIds.includes(c.id));

  // Filter by category if selected
  if (settings.selectedCategories && settings.selectedCategories.length > 0) {
    campaignsToDisplay = campaignsToDisplay.filter(c =>
      c.category && settings.selectedCategories.includes(c.category)
    );
  }

  // Collect all media from selected campaigns and tag with campaignId
  const media = [];
  campaignsToDisplay.forEach(campaign => {
    const taggedMedia = campaign.media.map(m => ({
      ...m,
      campaignId: campaign.id,
    }));
    media.push(...taggedMedia);
  });

  // Apply rotation mode
  if (settings.rotationMode === 'random') {
    media.sort(() => Math.random() - 0.5);
  } else if (settings.rotationMode === 'weighted' && settings.campaignPriorities) {
    const weighted = [];
    campaignsToDisplay.forEach(campaign => {
      const priority = settings.campaignPriorities[campaign.id] || 1;
      const taggedMedia = campaign.media.map(m => ({
        ...m,
        campaignId: campaign.id,
      }));
      for (let i = 0; i < priority; i++) {
        weighted.push(...taggedMedia);
      }
    });
    res.json(weighted);
    return;
  }

  res.json(media);
});

// ===== ANALYTICS ENDPOINTS =====

// Start impression
app.post('/api/analytics/impressions', (req, res) => {
  const impression = {
    id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...req.body,
    timestamp: Date.now(),
  };

  storage.impressions.push(impression);
  res.json(impression);
});

// Update impression (when ending)
app.put('/api/analytics/impressions/:impressionId', (req, res) => {
  const { impressionId } = req.params;
  const index = storage.impressions.findIndex(imp => imp.id === impressionId);

  if (index === -1) {
    return res.status(404).json({ error: 'Impression not found' });
  }

  storage.impressions[index] = {
    ...storage.impressions[index],
    ...req.body,
  };

  res.json(storage.impressions[index]);
});

// Get campaign impressions
app.get('/api/analytics/campaigns/:campaignId/impressions', (req, res) => {
  const { campaignId } = req.params;
  const { startDate, endDate } = req.query;

  let impressions = storage.impressions.filter(imp => imp.campaignId === campaignId);

  if (startDate) {
    impressions = impressions.filter(imp => imp.timestamp >= parseInt(startDate));
  }
  if (endDate) {
    impressions = impressions.filter(imp => imp.timestamp <= parseInt(endDate));
  }

  res.json(impressions);
});

// Get screen impressions
app.get('/api/analytics/screens/:screenId/impressions', (req, res) => {
  const { screenId } = req.params;
  const { startDate, endDate } = req.query;

  let impressions = storage.impressions.filter(imp => imp.screenId === screenId);

  if (startDate) {
    impressions = impressions.filter(imp => imp.timestamp >= parseInt(startDate));
  }
  if (endDate) {
    impressions = impressions.filter(imp => imp.timestamp <= parseInt(endDate));
  }

  res.json(impressions);
});

// Track QR code scan
app.post('/api/analytics/qr-scans', (req, res) => {
  const scan = {
    id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...req.body,
    timestamp: Date.now(),
  };

  storage.qrScans.push(scan);
  res.json(scan);
});

// Get campaign QR scans
app.get('/api/analytics/campaigns/:campaignId/qr-scans', (req, res) => {
  const { campaignId } = req.params;
  const { startDate, endDate } = req.query;

  let scans = storage.qrScans.filter(scan => scan.campaignId === campaignId);

  if (startDate) {
    scans = scans.filter(scan => scan.timestamp >= parseInt(startDate));
  }
  if (endDate) {
    scans = scans.filter(scan => scan.timestamp <= parseInt(endDate));
  }

  res.json(scans);
});

// Get screen QR scans
app.get('/api/analytics/screens/:screenId/qr-scans', (req, res) => {
  const { screenId } = req.params;
  const { startDate, endDate } = req.query;

  let scans = storage.qrScans.filter(scan => scan.screenId === screenId);

  if (startDate) {
    scans = scans.filter(scan => scan.timestamp >= parseInt(startDate));
  }
  if (endDate) {
    scans = scans.filter(scan => scan.timestamp <= parseInt(endDate));
  }

  res.json(scans);
});

// Get campaign analytics
app.get('/api/analytics/campaigns/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const { startDate, endDate } = req.query;

  let impressions = storage.impressions.filter(imp => imp.campaignId === campaignId);
  let qrScans = storage.qrScans.filter(scan => scan.campaignId === campaignId);

  if (startDate) {
    const start = parseInt(startDate);
    impressions = impressions.filter(imp => imp.timestamp >= start);
    qrScans = qrScans.filter(scan => scan.timestamp >= start);
  }
  if (endDate) {
    const end = parseInt(endDate);
    impressions = impressions.filter(imp => imp.timestamp <= end);
    qrScans = qrScans.filter(scan => scan.timestamp <= end);
  }

  const analytics = {
    campaignId,
    totalImpressions: impressions.length,
    totalDuration: impressions.reduce((sum, imp) => sum + (imp.duration || 0), 0),
    totalQRScans: qrScans.length,
    screenBreakdown: {},
    ownerBreakdown: {},
    regionBreakdown: {},
    cityBreakdown: {},
    mediaBreakdown: {},
    dailyBreakdown: {},
  };

  // Process impressions
  impressions.forEach(imp => {
    // Screen breakdown
    if (!analytics.screenBreakdown[imp.screenId]) {
      analytics.screenBreakdown[imp.screenId] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.screenBreakdown[imp.screenId].impressions++;
    analytics.screenBreakdown[imp.screenId].duration += imp.duration || 0;

    // Owner breakdown
    if (imp.ownerId) {
      if (!analytics.ownerBreakdown[imp.ownerId]) {
        analytics.ownerBreakdown[imp.ownerId] = { impressions: 0, duration: 0, qrScans: 0, screenCount: 0 };
      }
      analytics.ownerBreakdown[imp.ownerId].impressions++;
      analytics.ownerBreakdown[imp.ownerId].duration += imp.duration || 0;
    }

    // Region breakdown
    if (imp.region) {
      if (!analytics.regionBreakdown[imp.region]) {
        analytics.regionBreakdown[imp.region] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.regionBreakdown[imp.region].impressions++;
      analytics.regionBreakdown[imp.region].duration += imp.duration || 0;
    }

    // City breakdown
    if (imp.city) {
      if (!analytics.cityBreakdown[imp.city]) {
        analytics.cityBreakdown[imp.city] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.cityBreakdown[imp.city].impressions++;
      analytics.cityBreakdown[imp.city].duration += imp.duration || 0;
    }

    // Media breakdown
    if (!analytics.mediaBreakdown[imp.mediaId]) {
      analytics.mediaBreakdown[imp.mediaId] = { impressions: 0, duration: 0 };
    }
    analytics.mediaBreakdown[imp.mediaId].impressions++;
    analytics.mediaBreakdown[imp.mediaId].duration += imp.duration || 0;

    // Daily breakdown
    const date = new Date(imp.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    if (!analytics.dailyBreakdown[dateKey]) {
      analytics.dailyBreakdown[dateKey] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.dailyBreakdown[dateKey].impressions++;
    analytics.dailyBreakdown[dateKey].duration += imp.duration || 0;
  });

  // Process QR scans
  qrScans.forEach(scan => {
    // Screen breakdown
    if (!analytics.screenBreakdown[scan.screenId]) {
      analytics.screenBreakdown[scan.screenId] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.screenBreakdown[scan.screenId].qrScans++;

    // Owner breakdown
    if (scan.ownerId) {
      if (!analytics.ownerBreakdown[scan.ownerId]) {
        analytics.ownerBreakdown[scan.ownerId] = { impressions: 0, duration: 0, qrScans: 0, screenCount: 0 };
      }
      analytics.ownerBreakdown[scan.ownerId].qrScans++;
    }

    // Region breakdown
    if (scan.region) {
      if (!analytics.regionBreakdown[scan.region]) {
        analytics.regionBreakdown[scan.region] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.regionBreakdown[scan.region].qrScans++;
    }

    // City breakdown
    if (scan.city) {
      if (!analytics.cityBreakdown[scan.city]) {
        analytics.cityBreakdown[scan.city] = { impressions: 0, duration: 0, qrScans: 0 };
      }
      analytics.cityBreakdown[scan.city].qrScans++;
    }

    // Daily breakdown
    const date = new Date(scan.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    if (!analytics.dailyBreakdown[dateKey]) {
      analytics.dailyBreakdown[dateKey] = { impressions: 0, duration: 0, qrScans: 0 };
    }
    analytics.dailyBreakdown[dateKey].qrScans++;
  });

  // Calculate unique screen count per owner
  const screensByOwner = {};
  impressions.forEach(imp => {
    if (imp.ownerId) {
      if (!screensByOwner[imp.ownerId]) {
        screensByOwner[imp.ownerId] = new Set();
      }
      screensByOwner[imp.ownerId].add(imp.screenId);
    }
  });
  Object.keys(screensByOwner).forEach(ownerId => {
    if (analytics.ownerBreakdown[ownerId]) {
      analytics.ownerBreakdown[ownerId].screenCount = screensByOwner[ownerId].size;
    }
  });

  res.json(analytics);
});

// ===== MEDIA FILE ENDPOINTS =====

// Store media file (base64)
app.post('/api/media', (req, res) => {
  const { id, blob, metadata } = req.body;

  storage.mediaFiles.set(id, { blob, metadata });
  res.json({ success: true, id });
});

// Get media file
app.get('/api/media/:mediaId', (req, res) => {
  const { mediaId } = req.params;
  const mediaFile = storage.mediaFiles.get(mediaId);

  if (!mediaFile) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  res.json(mediaFile);
});

// Delete media file
app.delete('/api/media/:mediaId', (req, res) => {
  const { mediaId } = req.params;
  const deleted = storage.mediaFiles.delete(mediaId);

  res.json({ success: deleted });
});

// ===== AUTH ENDPOINTS (simplified for testing) =====

// Get all users
app.get('/api/users', (req, res) => {
  const users = Array.from(storage.users.values());
  res.json(users);
});

// Get user by ID
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const user = storage.users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// Create/update user
app.post('/api/users', (req, res) => {
  const user = req.body;
  storage.users.set(user.id, user);
  res.json(user);
});

// Get all venues
app.get('/api/venues', (req, res) => {
  const venues = Array.from(storage.venues.values());
  res.json(venues);
});

// Get venue by ID
app.get('/api/venues/:venueId', (req, res) => {
  const { venueId } = req.params;
  const venue = storage.venues.get(venueId);

  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  res.json(venue);
});

// Create/update venue
app.post('/api/venues', (req, res) => {
  const venue = req.body;
  storage.venues.set(venue.id, venue);
  res.json(venue);
});

// ===== UTILITY FUNCTIONS =====

function generateSecureRandom(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  randomArray.forEach(number => {
    result += chars[number % chars.length];
  });
  return result;
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   AdVenue Mock Backend Server                  ║
║                                                                ║
║  Status: Running                                               ║
║  Port: ${PORT}                                                     ║
║  API URL: http://localhost:${PORT}                                ║
║                                                                ║
║  Endpoints:                                                    ║
║    GET  /health                       - Health check           ║
║    POST /api/pairing/request          - Create pairing request ║
║    POST /api/pairing/validate         - Validate pairing       ║
║    GET  /api/campaigns                - Get all campaigns      ║
║    POST /api/campaigns                - Create campaign        ║
║    GET  /api/screens/:id/media        - Get screen media       ║
║    POST /api/analytics/impressions    - Track impression       ║
║    POST /api/analytics/qr-scans       - Track QR scan          ║
║                                                                ║
║  For ngrok testing:                                            ║
║    1. Run: ngrok http ${PORT}                                     ║
║    2. Set VITE_API_URL to ngrok URL                            ║
║    3. Set VITE_USE_BACKEND=true                                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
