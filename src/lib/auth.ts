export type UserRole = 'advertiser' | 'screen-owner';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  companyName?: string;
  venueName?: string;
}

const STORAGE_KEY = 'advenue_user';

// Dummy credentials for testing
const DUMMY_USERS = {
  'advertiser@advenue.com': {
    password: 'advertiser123',
    user: {
      id: 'adv-1',
      email: 'advertiser@advenue.com',
      role: 'advertiser' as UserRole,
      name: 'John Advertiser',
      companyName: 'Demo Advertising Co.',
    },
  },
  'owner@advenue.com': {
    password: 'owner123',
    user: {
      id: 'owner-1',
      email: 'owner@advenue.com',
      role: 'screen-owner' as UserRole,
      name: 'Jane Owner',
      venueName: 'Demo Cafe',
    },
  },
};

export const login = (email: string, password: string, role: UserRole): User | null => {
  const userData = DUMMY_USERS[email as keyof typeof DUMMY_USERS];

  if (!userData) {
    return null;
  }

  if (userData.password !== password) {
    return null;
  }

  if (userData.user.role !== role) {
    return null;
  }

  // Store user in localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData.user));

  return userData.user;
};

export const register = (data: {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  companyName?: string;
  venueName?: string;
}): User => {
  // In a real app, this would make an API call
  // For demo purposes, we'll create a mock user
  const user: User = {
    id: `${data.role}-${Date.now()}`,
    email: data.email,
    role: data.role,
    name: data.name,
    companyName: data.companyName,
    venueName: data.venueName,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return user;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEY);
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

export const requireAuth = (role?: UserRole): User | null => {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  if (role && user.role !== role) {
    return null;
  }

  return user;
};
