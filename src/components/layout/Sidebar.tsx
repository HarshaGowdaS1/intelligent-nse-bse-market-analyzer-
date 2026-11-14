import React from 'react';
import { 
  Home, 
  Compass, 
  Star, 
  BarChart3, 
  BrainCircuit, 
  GitCompare, 
  User, 
  Settings, 
  X, 
  LogIn, 
  LogOut, 
  Sun, 
  Moon,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { NavigationTab } from '../../types/market';
import { UserProfile } from '../../types/auth';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'signin' | 'signup' | 'profile') => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  const { theme, toggleTheme } = useTheme();

  const mainNavItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Home',
      description: 'Market overview & indices',
      icon: Home
    },
    {
      id: 'explore' as NavigationTab,
      label: 'Explore Stocks',
      description: 'Search all 8,950+ equities',
      icon: Compass
    },
    {
      id: 'watchlist' as NavigationTab,
      label: 'My Watchlist',
      description: 'Cloud saved portfolio',
      icon: Star
    },
    {
      id: 'stock-analysis' as NavigationTab,
      label: 'Stock Analysis',
      description: 'Charts & technicals',
      icon: BarChart3
    },
    {
      id: 'ai-predictions' as NavigationTab,
      label: 'AI Predictions',
      description: 'Machine learning trends',
      icon: BrainCircuit,
      badge: 'ML'
    },
    {
      id: 'gemini-chat' as NavigationTab,
      label: 'Gemini Chatbot',
      description: 'Market AI assistant',
      icon: MessageSquare,
      badge: 'AI'
    },
    {
      id: 'stock-comparison' as NavigationTab,
      label: 'Compare Stocks',
      description: 'Side-by-side analysis',
      icon: GitCompare
    },
    {
      id: 'settings' as NavigationTab,
      label: 'My Account',
      description: 'Profile & preferences',
      icon: User
    }
  ];

  const handleItemClick = (tab: NavigationTab) => {
    onNavigate(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Frame */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handleItemClick('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-sky-500 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  NSE-BSE Market
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Analyzer & AI Platform
                </span>
              </div>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Main Menu
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: User Card & Theme Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-400" />
              )}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              {theme}
            </span>
          </button>

          {/* User Account / Sign In Status */}
          {currentUser ? (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                  {currentUser.displayName}
                </div>
                <button
                  onClick={onSignOut}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {currentUser.email}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Firestore Connected</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* Academic & Data Notice */}
          <div className="px-2 pt-1 text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Educational B.Tech AIML Major Project · Free EOD Data
          </div>
        </div>
      </aside>
    </>
  );
};
