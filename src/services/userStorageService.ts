/**
 * User Storage Service
 * 
 * Manages persistent user watchlists, preferences, and saved comparisons in Cloud Firestore.
 * Implements real-time cloud synchronization across devices, user data isolation,
 * automatic local-to-cloud migration, and optimistic local caching.
 */

import { UserPreferences } from '../types/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';

const WATCHLIST_PREFIX = 'nse_bse_watchlist_user_';
const PREFERENCES_PREFIX = 'nse_bse_preferences_user_';

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultExchange: 'NSE',
  defaultTimeframe: '1M',
  currencyFormat: 'lakhs_crores',
  highPrecisionMode: true,
  activeHorizon: 'T+1'
};

export const DEFAULT_INITIAL_WATCHLIST = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];

export interface SavedComparison {
  id?: string;
  userId: string;
  symbolA: string;
  symbolB: string;
  timeframe: string;
  savedAt: string;
}

const memoryStorage: Record<string, string> = {};
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return memoryStorage[key] || null;
      }
    }
    return memoryStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        memoryStorage[key] = value;
      }
    }
    memoryStorage[key] = value;
  },
  removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        delete memoryStorage[key];
      }
    }
    delete memoryStorage[key];
  }
};

export const UserStorageService = {
  /**
   * Retrieves the watchlist synchronously from cache, with asynchronous Cloud Firestore synchronization
   */
  getUserWatchlist(userId?: string | null): string[] {
    const key = `${WATCHLIST_PREFIX}${userId || 'guest'}`;
    try {
      const raw = safeStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Local watchlist retrieval notice:', e);
    }
    return [...DEFAULT_INITIAL_WATCHLIST];
  },

  getWatchlist(userId?: string | null): string[] {
    return this.getUserWatchlist(userId);
  },

  /**
   * Asynchronously pulls the latest user watchlist from Cloud Firestore
   */
  async fetchCloudWatchlist(userId: string): Promise<string[]> {
    if (!userId || userId === 'guest') {
      return this.getUserWatchlist(userId);
    }

    try {
      const path = `users/${userId}/watchlists/default`;
      const docRef = doc(db, 'users', userId, 'watchlists', 'default');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.symbols)) {
          // Update local cache
          safeStorage.setItem(`${WATCHLIST_PREFIX}${userId}`, JSON.stringify(data.symbols));
          return data.symbols;
        }
      } else {
        // Safe Migration: If local storage has user watchlist, migrate to Firestore
        const localList = this.getUserWatchlist(userId);
        if (localList.length > 0) {
          await this.saveCloudWatchlist(userId, localList);
          return localList;
        }
      }
    } catch (err: any) {
      console.warn('Could not sync cloud watchlist, using local cache:', err);
    }

    return this.getUserWatchlist(userId);
  },

  /**
   * Saves the user's watchlist to Cloud Firestore and updates local cache
   */
  async saveCloudWatchlist(userId: string | null | undefined, symbols: string[]): Promise<void> {
    const cleanSymbols = Array.from(new Set(symbols.map(s => s.trim().toUpperCase())));
    const targetUid = userId || auth?.currentUser?.uid;

    // Persist to local cache immediately
    const key = `${WATCHLIST_PREFIX}${targetUid || 'guest'}`;
    safeStorage.setItem(key, JSON.stringify(cleanSymbols));

    // Persist to Cloud Firestore only if currently authenticated user matches document owner
    if (targetUid && targetUid !== 'guest' && auth?.currentUser?.uid === targetUid) {
      const path = `users/${targetUid}/watchlists/default`;
      try {
        const docRef = doc(db, 'users', targetUid, 'watchlists', 'default');
        await setDoc(docRef, {
          userId: targetUid,
          symbols: cleanSymbols,
          updatedAt: new Date().toISOString()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  },

  saveUserWatchlist(userId: string | null | undefined, symbols: string[]): void {
    this.saveCloudWatchlist(userId, symbols).catch(err => {
      console.warn('Async cloud watchlist save caught:', err);
    });
  },

  saveWatchlist(symbols: string[], userId?: string | null): void {
    this.saveUserWatchlist(userId, symbols);
  },

  addToWatchlist(userId: string | null | undefined, symbol: string): string[] {
    const current = this.getUserWatchlist(userId);
    const sym = symbol.toUpperCase().trim();
    if (!current.includes(sym)) {
      const updated = [...current, sym];
      this.saveUserWatchlist(userId, updated);
      return updated;
    }
    return current;
  },

  removeFromWatchlist(userId: string | null | undefined, symbol: string): string[] {
    const current = this.getUserWatchlist(userId);
    const sym = symbol.toUpperCase().trim();
    const updated = current.filter(s => s !== sym);
    this.saveUserWatchlist(userId, updated);
    return updated;
  },

  resetWatchlistToDefaults(userId?: string | null): string[] {
    this.saveUserWatchlist(userId, DEFAULT_INITIAL_WATCHLIST);
    return [...DEFAULT_INITIAL_WATCHLIST];
  },

  /**
   * Retrieves user preferences with Cloud Firestore synchronization
   */
  getUserPreferences(userId?: string | null): UserPreferences {
    const key = `${PREFERENCES_PREFIX}${userId || 'guest'}`;
    try {
      const raw = safeStorage.getItem(key);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Local preferences retrieval notice:', e);
    }
    return { ...DEFAULT_PREFERENCES };
  },

  async fetchCloudPreferences(userId: string): Promise<UserPreferences> {
    if (!userId || userId === 'guest') {
      return this.getUserPreferences(userId);
    }

    try {
      const docRef = doc(db, 'users', userId, 'preferences', 'default');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const prefs: UserPreferences = {
          defaultExchange: data.defaultExchange || 'NSE',
          defaultTimeframe: data.defaultTimeframe || '1M',
          currencyFormat: data.currencyFormat || 'lakhs_crores',
          highPrecisionMode: data.highPrecisionMode ?? true,
          activeHorizon: data.activeHorizon || 'T+1'
        };
        safeStorage.setItem(`${PREFERENCES_PREFIX}${userId}`, JSON.stringify(prefs));
        return prefs;
      }
    } catch (err) {
      console.warn('Cloud preferences sync notice:', err);
    }

    return this.getUserPreferences(userId);
  },

  /**
   * Persists user preferences to Cloud Firestore and updates local cache
   */
  saveUserPreferences(userId: string | null | undefined, preferences: Partial<UserPreferences>): UserPreferences {
    const targetUid = userId || auth?.currentUser?.uid;
    const current = this.getUserPreferences(targetUid);
    const updated = { ...current, ...preferences };

    const key = `${PREFERENCES_PREFIX}${targetUid || 'guest'}`;
    safeStorage.setItem(key, JSON.stringify(updated));

    if (targetUid && targetUid !== 'guest' && auth?.currentUser?.uid === targetUid) {
      const path = `users/${targetUid}/preferences/default`;
      const docRef = doc(db, 'users', targetUid, 'preferences', 'default');
      setDoc(docRef, {
        ...updated,
        userId: targetUid,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
      });
    }

    return updated;
  },

  /**
   * Stock Comparison Cloud Persistence & Local Fallback
   */
  async saveStockComparison(userId: string, symbolA: string, symbolB: string, timeframe: string, explicitId?: string): Promise<SavedComparison> {
    const compId = explicitId || `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const comparison: SavedComparison = {
      id: compId,
      userId,
      symbolA: symbolA.toUpperCase().trim(),
      symbolB: symbolB.toUpperCase().trim(),
      timeframe,
      savedAt: new Date().toISOString()
    };

    // Store in local cache
    const cacheKey = `nse_bse_comparisons_${userId}`;
    const existing = this.getSavedComparisonsSync(userId);
    safeStorage.setItem(cacheKey, JSON.stringify([...existing, comparison]));

    if (userId && userId !== 'guest' && auth?.currentUser?.uid === userId) {
      const path = `users/${userId}/comparisons`;
      try {
        const compRef = doc(collection(db, 'users', userId, 'comparisons'));
        await setDoc(compRef, comparison);
        comparison.id = compRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    return comparison;
  },

  saveComparison(userId: string, symbolA: string, symbolB: string, timeframe: string): string {
    const compId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.saveStockComparison(userId, symbolA, symbolB, timeframe, compId).catch(() => {});
    return compId;
  },

  getSavedComparisonsSync(userId: string): SavedComparison[] {
    if (!userId || userId === 'guest') return [];
    const cacheKey = `nse_bse_comparisons_${userId}`;
    const raw = safeStorage.getItem(cacheKey);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {}
    }
    return [];
  },

  getSavedComparisons(userId: string): SavedComparison[] {
    return this.getSavedComparisonsSync(userId);
  },

  async fetchSavedComparisons(userId: string): Promise<SavedComparison[]> {
    if (!userId || userId === 'guest') return [];

    if (auth?.currentUser?.uid === userId) {
      const path = `users/${userId}/comparisons`;
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'comparisons'));
        const list = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as SavedComparison)
        }));
        safeStorage.setItem(`nse_bse_comparisons_${userId}`, JSON.stringify(list));
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    return this.getSavedComparisonsSync(userId);
  },

  deleteComparison(userId: string, comparisonId: string): void {
    const cacheKey = `nse_bse_comparisons_${userId}`;
    const list = this.getSavedComparisonsSync(userId).filter(c => c.id !== comparisonId);
    safeStorage.setItem(cacheKey, JSON.stringify(list));

    if (userId && userId !== 'guest' && auth?.currentUser?.uid === userId) {
      const docRef = doc(db, 'users', userId, 'comparisons', comparisonId);
      deleteDoc(docRef).catch(() => {});
    }
  }
};

export const userStorageService = UserStorageService;
