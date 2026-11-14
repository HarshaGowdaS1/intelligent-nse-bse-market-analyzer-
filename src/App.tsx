/**
 * NSE-BSE Market Analyzer
 * Final-Year B.Tech Artificial Intelligence and Machine Learning Capstone Application
 * 
 * Clean, modern Indian equity market intelligence and machine learning platform.
 * Supports complete 8,950+ security master catalog, authentic EOD bhavcopy data,
 * and persistent Cloud Firestore watchlists with dual Light & Dark themes.
 */

import React, { useState, useEffect } from 'react';
import { NavigationTab, Exchange, StockQuote, MarketIndex } from './types/market';
import { UserProfile } from './types/auth';
import { AuthService } from './services/authService';
import { UserStorageService } from './services/userStorageService';
import { INITIAL_INDICES } from './services/dataService';
import { MarketDataService } from './services/marketDataService';
import { SecurityMaster } from './services/securityMaster';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TickerTape } from './components/layout/TickerTape';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { StockExplorerPage } from './components/explore/StockExplorerPage';
import { StockAnalysisPage } from './components/analysis/StockAnalysisPage';
import { AIPredictionsPage } from './components/predictions/AIPredictionsPage';
import { WatchlistPage } from './components/watchlist/WatchlistPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { RiskAnalysisPage } from './components/risk/RiskAnalysisPage';
import { StockComparisonPage } from './components/comparison/StockComparisonPage';
import { AcademicReportsPage } from './components/reports/AcademicReportsPage';
import { GeminiChatbotPage } from './components/chat/GeminiChatbotPage';
import { AuthModal, AuthModalMode } from './components/auth/AuthModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [currentExchange, setCurrentExchange] = useState<Exchange>('NSE');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => AuthService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signin');

  // Watchlist state (dynamically scoped per authenticated user or guest)
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    return UserStorageService.getWatchlist(currentUser?.uid);
  });

  // Complete 8,950-stock universe with genuine market data values
  const [stocks, setStocks] = useState<StockQuote[]>(() => MarketDataService.getAllStockQuotes());
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_INDICES);

  // Listen to Auth state changes & sync with Cloud Firestore
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user?.uid) {
        const cloudWatchlist = await UserStorageService.fetchCloudWatchlist(user.uid);
        setWatchlistSymbols(cloudWatchlist);
      } else {
        const guestWatchlist = UserStorageService.getWatchlist(null);
        setWatchlistSymbols(guestWatchlist);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAuth = (mode: AuthModalMode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = () => {
    AuthService.signOut();
  };

  const handleAddToWatchlist = (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase();
    if (!watchlistSymbols.includes(cleanSym)) {
      const next = [...watchlistSymbols, cleanSym];
      setWatchlistSymbols(next);
      UserStorageService.saveWatchlist(next, currentUser?.uid);
    }
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase();
    const next = watchlistSymbols.filter(s => s !== cleanSym);
    setWatchlistSymbols(next);
    UserStorageService.saveWatchlist(next, currentUser?.uid);
  };

  const handleToggleWatchlist = (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase();
    if (watchlistSymbols.includes(cleanSym)) {
      handleRemoveFromWatchlist(cleanSym);
    } else {
      handleAddToWatchlist(cleanSym);
    }
  };

  const handleSelectStock = (symbol: string, targetExchange?: Exchange) => {
    const cleanSym = symbol.trim().toUpperCase();
    setSelectedStockSymbol(cleanSym);
    if (targetExchange) {
      setCurrentExchange(targetExchange);
    } else {
      const stock = stocks.find(s => s.symbol.toUpperCase() === cleanSym && s.exchange === currentExchange) ||
                    stocks.find(s => s.symbol.toUpperCase() === cleanSym);
      if (stock && stock.exchange) {
        setCurrentExchange(stock.exchange);
      } else {
        const sec = SecurityMaster.getBySymbol(cleanSym, currentExchange) || SecurityMaster.getBySymbol(cleanSym);
        if (sec && sec.exchange) {
          setCurrentExchange(sec.exchange);
        }
      }
    }
    setCurrentTab('stock-analysis');
  };

  const handleNavigateToPredictions = (symbol?: string) => {
    if (symbol) {
      setSelectedStockSymbol(symbol.trim().toUpperCase());
    }
    setCurrentTab('ai-predictions');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
        {/* Left Persistent / Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onSignOut={handleSignOut}
        />

        {/* Main Workspace Frame */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <Header
            currentExchange={currentExchange}
            onExchangeChange={setCurrentExchange}
            stocks={stocks}
            onSelectStock={handleSelectStock}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onSignOut={handleSignOut}
          />

          {/* Calm Market Ticker Tape */}
          <TickerTape
            indices={indices}
            stocks={stocks}
            onSelectStock={handleSelectStock}
          />

          {/* Active Page View Container */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {/* 1. Home Dashboard */}
            {currentTab === 'dashboard' && (
              <DashboardPage
                indices={indices}
                stocks={stocks}
                watchlistSymbols={watchlistSymbols}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
                onSelectStock={handleSelectStock}
                onNavigateToPredictions={handleNavigateToPredictions}
                onNavigateToWatchlist={() => setCurrentTab('watchlist')}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onNavigateToExplore={() => setCurrentTab('explore')}
                currentUser={currentUser}
              />
            )}

            {/* 2. Complete Stock Explorer */}
            {currentTab === 'explore' && (
              <StockExplorerPage
                allStocks={stocks}
                watchlistSymbols={watchlistSymbols}
                onSelectStock={handleSelectStock}
                onNavigateToPredictions={handleNavigateToPredictions}
                onToggleWatchlist={handleToggleWatchlist}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}

            {/* 3. My Watchlist */}
            {currentTab === 'watchlist' && (
              <WatchlistPage
                allStocks={stocks}
                watchlistSymbols={watchlistSymbols}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onSelectStockForAnalysis={handleSelectStock}
              />
            )}

            {/* 4. Stock Details and Analysis */}
            {currentTab === 'stock-analysis' && (
              <StockAnalysisPage
                selectedSymbol={selectedStockSymbol}
                onSelectSymbol={setSelectedStockSymbol}
                allStocks={stocks}
                onNavigateToPredictions={handleNavigateToPredictions}
                watchlistSymbols={watchlistSymbols}
                onToggleWatchlist={handleToggleWatchlist}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}

            {/* 5. AI Machine Learning Predictions */}
            {currentTab === 'ai-predictions' && (
              <AIPredictionsPage
                selectedSymbol={selectedStockSymbol}
                onSelectSymbol={setSelectedStockSymbol}
                allStocks={stocks}
                onNavigateToAnalysis={handleSelectStock}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}

            {/* 5b. Gemini Multi-Turn Market Chatbot */}
            {currentTab === 'gemini-chat' && (
              <GeminiChatbotPage
                allStocks={stocks}
                selectedSymbol={selectedStockSymbol}
                onSelectStock={handleSelectStock}
              />
            )}

            {/* 6. Compare Stocks */}
            {currentTab === 'stock-comparison' && (
              <StockComparisonPage
                allStocks={stocks}
                onSelectStockForAnalysis={handleSelectStock}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}

            {/* Risk Analysis (Expandable/Direct view) */}
            {currentTab === 'risk-analysis' && (
              <RiskAnalysisPage
                selectedSymbol={selectedStockSymbol}
                onSelectSymbol={setSelectedStockSymbol}
                allStocks={stocks}
                onNavigateToAnalysis={handleSelectStock}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}

            {/* Academic Reports */}
            {currentTab === 'reports' && (
              <AcademicReportsPage
                allStocks={stocks}
                onNavigateToStock={handleSelectStock}
              />
            )}

            {/* 7. My Account & Settings */}
            {currentTab === 'settings' && (
              <SettingsPage
                currentUser={currentUser}
                onOpenAuth={handleOpenAuth}
                onUserUpdated={(updated) => setCurrentUser(updated)}
                currentExchange={currentExchange}
                onExchangeChange={setCurrentExchange}
              />
            )}
          </main>
        </div>

        {/* Global User Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />
      </div>
    </ThemeProvider>
  );
}
