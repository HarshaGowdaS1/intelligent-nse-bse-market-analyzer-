/**
 * Authentication & User Profile domain models for NSE-BSE Market Analyzer
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roleTitle?: string;
  createdAt: string;
  lastLoginAt: string;
  photoURL?: string;
}

export interface UserPreferences {
  defaultExchange: 'NSE' | 'BSE';
  defaultTimeframe: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';
  currencyFormat: 'lakhs_crores' | 'standard';
  highPrecisionMode: boolean;
  activeHorizon: 'T+1' | 'T+5' | 'T+15';
}

export interface UserSession {
  token: string;
  expiresAt: number;
  user: UserProfile;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  status: 'unconfigured' | 'client_sandbox' | 'connected';
}
