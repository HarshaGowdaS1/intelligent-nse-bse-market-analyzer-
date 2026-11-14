import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  User, 
  LogIn, 
  LogOut, 
  Sun, 
  Moon, 
  Clock, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  ArrowRight,
  Database
} from 'lucide-react';
import { Exchange, StockQuote } from '../../types/market';
import { UserProfile } from '../../types/auth';
import { SecurityMaster, SecurityMasterEntry } from '../../services/securityMaster';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentExchange: Exchange;
  onExchangeChange: (exchange: Exchange) => void;
  stocks: StockQuote[];
  onSelectStock: (symbol: string) => void;
  onToggleMobileMenu: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'profile') => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentExchange,
  onExchangeChange,
  stocks,
  onSelectStock,
  onToggleMobileMenu,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Instant quick-search results filtered by current exchange
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return SecurityMaster.searchPaginated(q, currentExchange, 1, 8).items;
  }, [searchQuery, currentExchange]);

  // Market timing status (NSE/BSE trading hours: Mon-Fri 09:15 to 15:30 IST)
  const marketStatus = useMemo(() => {
    try {
      const now = new Date();
      const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istString);
      const day = istDate.getDay();
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const timeNum = hours * 60 + minutes;

      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && timeNum >= 9 * 60 + 15 && timeNum <= 15 * 60 + 30;

      return {
        isOpen,
        label: isOpen ? 'Market Open' : 'Market Closed',
        timeStr: istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'
      };
    } catch (_) {
      return { isOpen: false, label: 'Market Closed', timeStr: 'IST' };
    }
  }, []);

  const handleSelectResult = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Zone 1: Mobile Hamburger & Exchange Selector */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Exchange Toggle Pills (Visible on all screens) */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onExchangeChange('NSE')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentExchange === 'NSE'
                ? 'bg-sky-600 text-white shadow-xs ring-1 ring-sky-500 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
            aria-pressed={currentExchange === 'NSE'}
          >
            <span>NSE</span>
            {currentExchange === 'NSE' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
          </button>
          <button
            type="button"
            onClick={() => onExchangeChange('BSE')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentExchange === 'BSE'
                ? 'bg-sky-600 text-white shadow-xs ring-1 ring-sky-500 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-pressed={currentExchange === 'BSE'}
          >
            <span>BSE</span>
            {currentExchange === 'BSE' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
          </button>
        </div>

        {/* Market Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          <span>{marketStatus.label}</span>
          <span className="text-slate-400 font-mono">({marketStatus.timeStr})</span>
        </div>
      </div>

      {/* Zone 2: Global Instant Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search 8,950+ stocks by name or symbol (e.g. RELIANCE, TCS)..."
            className="w-full pl-10 pr-12 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
            ⌘K
          </kbd>
        </div>

        {/* Instant Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-850">
              Matching Securities ({searchResults.length} of {SecurityMaster.searchPaginated(searchQuery.trim(), 'ALL', 1, 1).total})
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No stocks found matching "{searchQuery}". Try company name or ISIN.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((sec) => (
                  <button
                    key={`${sec.exchange}-${sec.symbol}`}
                    onClick={() => handleSelectResult(sec.symbol)}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                          {sec.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {sec.symbol}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sec.sector} · {sec.exchange}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Actions (Theme Toggle & Account Menu) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Account Button */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-semibold text-xs flex items-center justify-center">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {currentUser.displayName}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenAuth?.('profile');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth?.('signin')}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
