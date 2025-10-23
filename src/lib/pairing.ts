export interface PairingRequest {
  screenId: string;
  pairingCodeHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  used: boolean;
  deviceFingerprint: string;
}

export interface PairedScreen {
  screenId: string;
  ownerId: string;
  pairedAt: number;
  sessionToken: string;
  tokenExpiresAt: number;
  venueName?: string; // Legacy field
  venueId?: string;
  customName?: string; // Custom alias/name set by screen owner
  status: 'online' | 'offline';
  lastSeen: number;
}

const PAIRING_REQUESTS_KEY = 'advenue_pairing_requests';
const PAIRED_SCREENS_KEY = 'advenue_paired_screens';
const MAX_ATTEMPTS = 3;
const PAIRING_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Generate cryptographically secure random string
const generateSecureRandom = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, length)
    .toUpperCase();
};

// Generate secure screen ID
export const generateScreenId = (): string => {
  const random = generateSecureRandom(12);
  return `SCR-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8, 12)}`;
};

// Generate secure pairing code (8 alphanumeric characters)
export const generatePairingCode = (): string => {
  return generateSecureRandom(8);
};

// Hash pairing code using SHA-256
export const hashPairingCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate device fingerprint
export const generateDeviceFingerprint = (): string => {
  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth,
  ].join('|');

  // Simple hash for fingerprint (in production, use a proper fingerprinting library)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Create a new pairing request
export const createPairingRequest = async (
  screenId: string,
  pairingCode: string
): Promise<void> => {
  const requests = getPairingRequests();
  const pairingCodeHash = await hashPairingCode(pairingCode);
  const deviceFingerprint = generateDeviceFingerprint();

  const request: PairingRequest = {
    screenId,
    pairingCodeHash,
    expiresAt: Date.now() + PAIRING_EXPIRY_MS,
    createdAt: Date.now(),
    attempts: 0,
    used: false,
    deviceFingerprint,
  };

  requests[screenId] = request;
  localStorage.setItem(PAIRING_REQUESTS_KEY, JSON.stringify(requests));
};

// Get all pairing requests
const getPairingRequests = (): Record<string, PairingRequest> => {
  const data = localStorage.getItem(PAIRING_REQUESTS_KEY);
  if (!data) return {};

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

// Validate and pair screen
export const validateAndPairScreen = async (
  screenId: string,
  pairingCode: string,
  ownerId: string,
  venueName?: string,
  venueId?: string
): Promise<{ success: boolean; error?: string; screen?: PairedScreen }> => {
  const requests = getPairingRequests();
  const request = requests[screenId];

  // Check if request exists
  if (!request) {
    return { success: false, error: 'Invalid Screen ID' };
  }

  // Check if already used
  if (request.used) {
    return { success: false, error: 'Pairing code already used' };
  }

  // Check if expired
  if (Date.now() > request.expiresAt) {
    return { success: false, error: 'Pairing code expired' };
  }

  // Check max attempts
  if (request.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Maximum pairing attempts exceeded' };
  }

  // Validate pairing code
  const enteredCodeHash = await hashPairingCode(pairingCode);
  if (enteredCodeHash !== request.pairingCodeHash) {
    // Increment attempts
    request.attempts++;
    requests[screenId] = request;
    localStorage.setItem(PAIRING_REQUESTS_KEY, JSON.stringify(requests));

    return {
      success: false,
      error: `Invalid pairing code. ${MAX_ATTEMPTS - request.attempts} attempts remaining.`,
    };
  }

  // Success - create paired screen
  const sessionToken = generateSecureRandom(32);
  const pairedScreen: PairedScreen = {
    screenId,
    ownerId,
    pairedAt: Date.now(),
    sessionToken,
    tokenExpiresAt: Date.now() + TOKEN_EXPIRY_MS,
    venueName,
    venueId,
    status: 'online',
    lastSeen: Date.now(),
  };

  // Mark request as used
  request.used = true;
  requests[screenId] = request;
  localStorage.setItem(PAIRING_REQUESTS_KEY, JSON.stringify(requests));

  // Save paired screen
  const pairedScreens = getPairedScreens();
  pairedScreens[screenId] = pairedScreen;
  localStorage.setItem(PAIRED_SCREENS_KEY, JSON.stringify(pairedScreens));

  return { success: true, screen: pairedScreen };
};

// Get all paired screens
const getPairedScreens = (): Record<string, PairedScreen> => {
  const data = localStorage.getItem(PAIRED_SCREENS_KEY);
  if (!data) return {};

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
};

// Get paired screens for an owner
export const getOwnerScreens = (ownerId: string): PairedScreen[] => {
  const pairedScreens = getPairedScreens();
  return Object.values(pairedScreens).filter(screen => screen.ownerId === ownerId);
};

// Get a single paired screen by screenId
export const getPairedScreen = (screenId: string): PairedScreen | null => {
  const pairedScreens = getPairedScreens();
  return pairedScreens[screenId] || null;
};

// Validate session token
export const validateSessionToken = (
  screenId: string,
  token: string
): { valid: boolean; screen?: PairedScreen } => {
  const pairedScreens = getPairedScreens();
  const screen = pairedScreens[screenId];

  if (!screen) {
    return { valid: false };
  }

  if (screen.sessionToken !== token) {
    return { valid: false };
  }

  if (Date.now() > screen.tokenExpiresAt) {
    return { valid: false };
  }

  // Update last seen
  screen.lastSeen = Date.now();
  screen.status = 'online';
  pairedScreens[screenId] = screen;
  localStorage.setItem(PAIRED_SCREENS_KEY, JSON.stringify(pairedScreens));

  return { valid: true, screen };
};

// Unpair screen
export const unpairScreen = (screenId: string, ownerId: string): boolean => {
  const pairedScreens = getPairedScreens();
  const screen = pairedScreens[screenId];

  if (!screen || screen.ownerId !== ownerId) {
    return false;
  }

  delete pairedScreens[screenId];
  localStorage.setItem(PAIRED_SCREENS_KEY, JSON.stringify(pairedScreens));
  return true;
};

// Clean up expired pairing requests (call periodically)
export const cleanupExpiredRequests = (): void => {
  const requests = getPairingRequests();
  const now = Date.now();
  let changed = false;

  Object.keys(requests).forEach(screenId => {
    if (now > requests[screenId].expiresAt) {
      delete requests[screenId];
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(PAIRING_REQUESTS_KEY, JSON.stringify(requests));
  }
};

// Update screen status based on last seen
export const updateScreenStatuses = (): void => {
  const pairedScreens = getPairedScreens();
  const now = Date.now();
  const OFFLINE_THRESHOLD = 60 * 1000; // 1 minute
  let changed = false;

  Object.values(pairedScreens).forEach(screen => {
    const shouldBeOffline = now - screen.lastSeen > OFFLINE_THRESHOLD;
    if (shouldBeOffline && screen.status === 'online') {
      screen.status = 'offline';
      pairedScreens[screen.screenId] = screen;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(PAIRED_SCREENS_KEY, JSON.stringify(pairedScreens));
  }
};

// Update screen custom name
export const updateScreenName = (
  screenId: string,
  ownerId: string,
  customName: string
): boolean => {
  const pairedScreens = getPairedScreens();
  const screen = pairedScreens[screenId];

  if (!screen || screen.ownerId !== ownerId) {
    return false;
  }

  screen.customName = customName.trim() || undefined;
  pairedScreens[screenId] = screen;
  localStorage.setItem(PAIRED_SCREENS_KEY, JSON.stringify(pairedScreens));
  return true;
};
