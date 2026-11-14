import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2, 
  Lock,
  Sun,
  Moon,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { AuthService } from '../../services/authService';
import { UserStorageService } from '../../services/userStorageService';
import { Exchange, Timeframe } from '../../types/market';
import { useTheme } from '../../context/ThemeContext';

interface SettingsPageProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'signin' | 'signup' | 'profile') => void;
  onUserUpdated: (user: UserProfile) => void;
  currentExchange: Exchange;
  onExchangeChange: (exchange: Exchange) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onOpenAuth,
  onUserUpdated,
  currentExchange,
  onExchangeChange
}) => {
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [roleTitle, setRoleTitle] = useState(currentUser?.roleTitle || 'Investor & Market Analyst');
  const [defaultExchange, setDefaultExchange] = useState<Exchange>(currentExchange);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('signin');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await AuthService.updateProfile({
        displayName: displayName.trim(),
        roleTitle: roleTitle.trim()
      });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetWatchlist = () => {
    UserStorageService.resetWatchlistToDefaults(currentUser?.uid);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Page Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Account & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your analyst profile, market preferences, and Cloud Firestore storage.
        </p>
      </div>

      {/* 2. User Authentication & Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                User Profile
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser ? 'Signed in with Firebase Authentication' : 'Currently in guest mode'}
              </span>
            </div>
          </div>

          {!currentUser && (
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 shadow-2xs"
            >
              Sign In or Register
            </button>
          )}
        </div>

        {currentUser ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={currentUser.email}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Analyst Role / Title
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Quantitative Analyst, Student, Long-Term Investor"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile updated in Cloud Firestore</span>
                </span>
              )}
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              Sign in with your email or Google account to save custom watchlists in Cloud Firestore, sync across all your devices, and customize preferences.
            </p>
          </div>
        )}
      </div>

      {/* 3. Platform & Theme Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          Preferences & Display Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Preference */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Visual Theme
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Currently using {theme === 'dark' ? 'Dark theme' : 'Clean Light theme'}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Default Exchange */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Primary Exchange
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Default for stock search & price quotes
              </span>
            </div>

            <div className="flex gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-md border border-slate-300 dark:border-slate-600 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setDefaultExchange('NSE');
                  onExchangeChange('NSE');
                }}
                className={`px-2.5 py-1 rounded ${currentExchange === 'NSE' ? 'bg-sky-600 text-white' : 'text-slate-500'}`}
              >
                NSE
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultExchange('BSE');
                  onExchangeChange('BSE');
                }}
                className={`px-2.5 py-1 rounded ${currentExchange === 'BSE' ? 'bg-sky-600 text-white' : 'text-slate-500'}`}
              >
                BSE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cloud Database & Connection Health */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          Cloud Infrastructure & Storage
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              <span>Google Cloud Firestore Database</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              Database: ai-studio-nsebsemarketanal-396612bf-a512-48de-9429-43a306211168
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Enterprise Firestore Active & Deployed
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security Rules & Isolation</span>
            </div>
            <div className="text-[11px] text-slate-500">
              User ABAC rules strictly enforce private document ownership
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              firestore.rules Deployed
            </div>
          </div>
        </div>

        {/* Watchlist Reset */}
        <div className="pt-2 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Reset Watchlist to Bluechip Defaults
            </span>
            <span className="text-[11px] text-slate-400">
              Restores default portfolio (RELIANCE, TCS, HDFCBANK, INFY)
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetWatchlist}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
          >
            Reset
          </button>
        </div>

        {resetSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            Watchlist reset to initial bluechip portfolio.
          </div>
        )}
      </div>
    </div>
  );
};
