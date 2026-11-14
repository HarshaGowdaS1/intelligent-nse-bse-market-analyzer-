import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Compass, 
  Star, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  BarChart2,
  BrainCircuit,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { StockQuote, MarketIndex } from '../../types/market';
import { UserProfile } from '../../types/auth';
import { DATA_METADATA } from '../../services/dataService';
import { SecurityMaster } from '../../services/securityMaster';
import { NseMarketHighlights } from './NseMarketHighlights';

interface DashboardPageProps {
  indices: MarketIndex[];
  stocks: StockQuote[];
  watchlistSymbols: string[];
  currentExchange?: 'NSE' | 'BSE';
  onExchangeChange?: (exchange: 'NSE' | 'BSE') => void;
  onSelectStock: (symbol: string, targetExchange?: 'NSE' | 'BSE') => void;
  onNavigateToPredictions: (symbol?: string) => void;
  onNavigateToWatchlist: () => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onNavigateToExplore?: () => void;
  currentUser?: UserProfile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  indices,
  stocks,
  watchlistSymbols,
  currentExchange = 'NSE',
  onExchangeChange,
  onSelectStock,
  onNavigateToPredictions,
  onNavigateToWatchlist,
  onRemoveFromWatchlist,
  onNavigateToExplore,
  currentUser
}) => {
  const [heroSearch, setHeroSearch] = useState('');

  // Key Benchmark Indices filtered and prioritized by active exchange
  const activeIndices = useMemo(() => {
    return indices.filter(i => i.exchange === currentExchange);
  }, [indices, currentExchange]);

  const nifty = indices.find(i => i.symbol === 'NIFTY 50') || indices[0];
  const sensex = indices.find(i => i.symbol === 'SENSEX') || indices[1];
  const bankNifty = indices.find(i => i.symbol === 'BANK NIFTY') || indices[2];
  const bse100 = indices.find(i => i.symbol === 'BSE 100');
  const bseSme = indices.find(i => i.symbol === 'BSE SME IPO');

  // Catalogue overview count
  const catalogueStats = useMemo(() => SecurityMaster.getStats(), []);

  // Watchlist stock objects (deduplicated by symbol)
  const watchlistStocks = useMemo(() => {
    const seen = new Set<string>();
    const list: StockQuote[] = [];
    for (const s of stocks) {
      if (watchlistSymbols.includes(s.symbol) && !seen.has(s.symbol)) {
        seen.add(s.symbol);
        list.push(s);
        if (list.length >= 6) break;
      }
    }
    return list;
  }, [stocks, watchlistSymbols]);

  // Market timing calculation (09:15 to 15:30 IST Mon-Fri)
  const isMarketOpen = useMemo(() => {
    try {
      const now = new Date();
      const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istDate.getDay();
      const timeNum = istDate.getHours() * 60 + istDate.getMinutes();
      return day >= 1 && day <= 5 && timeNum >= 9 * 60 + 15 && timeNum <= 15 * 60 + 30;
    } catch (_) {
      return false;
    }
  }, []);

  // Search quick matching strictly respects currentExchange
  const searchSuggestions = useMemo(() => {
    const q = heroSearch.trim();
    if (!q) return [];
    return SecurityMaster.searchPaginated(q, currentExchange, 1, 5).items;
  }, [heroSearch, currentExchange]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* A. Welcome Hero Section */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Indian Market Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Understand stock price trends, risk factors, and market patterns across {catalogueStats.totalCount.toLocaleString('en-IN')} listed Indian companies with genuine exchange data and machine learning.
          </p>

          {/* Direct Exchange Switch Buttons on Dashboard */}
          {onExchangeChange && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Selected Exchange:
              </span>
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onExchangeChange('NSE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentExchange === 'NSE'
                      ? 'bg-sky-600 text-white shadow-xs font-extrabold ring-1 ring-sky-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                  aria-pressed={currentExchange === 'NSE'}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>NSE ({catalogueStats.nseCount.toLocaleString('en-IN')})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExchangeChange('BSE')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentExchange === 'BSE'
                      ? 'bg-sky-600 text-white shadow-xs font-extrabold ring-1 ring-sky-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                  aria-pressed={currentExchange === 'BSE'}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>BSE ({catalogueStats.bseCount.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Search Box inside Welcome Hero */}
          <div className="relative pt-2 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder={`Search ${currentExchange} companies (e.g. ${currentExchange === 'NSE' ? 'RELIANCE, TCS, INFY' : '500325, 532540, VALIANTOCPS'})...`}
                className="w-full pl-10 pr-24 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={() => onNavigateToExplore?.()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors shadow-2xs"
              >
                Browse All
              </button>
            </div>

            {/* Quick Autocomplete Popup */}
            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-20 divide-y divide-slate-100 dark:divide-slate-800">
                {searchSuggestions.map((sec) => (
                  <button
                    key={`${sec.exchange}-${sec.symbol}`}
                    onClick={() => {
                      onSelectStock(sec.symbol);
                      setHeroSearch('');
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {sec.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sec.symbol} · {sec.exchange} · {sec.sector}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* B. Market Overview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Indian Market Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official benchmark performance & exchange trading status
            </p>
          </div>

          {/* Freshness & Holiday Notice */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Official EOD Bhavcopy ({DATA_METADATA.bhavcopyDate})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>NSE / BSE: {isMarketOpen ? 'Regular Hours Open' : 'Closed (9:15–15:30 IST)'}</span>
            </span>
          </div>
        </div>

        {/* Index Cards Grid - Filtered to active exchange */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentExchange === 'NSE' ? (
            <>
              {/* NIFTY 50 Card */}
              {nifty && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">NIFTY 50</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">NSE Benchmark</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {nifty.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      nifty.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {nifty.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{nifty.changePercent >= 0 ? '+' : ''}{nifty.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {nifty.change >= 0 ? '+' : ''}{nifty.change.toFixed(2)} pts</span>
                    <span>High: {nifty.high?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}

              {/* BANK NIFTY Card */}
              {bankNifty && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">BANK NIFTY</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">NSE Sector</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {bankNifty.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      bankNifty.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {bankNifty.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{bankNifty.changePercent >= 0 ? '+' : ''}{bankNifty.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {bankNifty.change >= 0 ? '+' : ''}{bankNifty.change.toFixed(2)} pts</span>
                    <span>Low: {bankNifty.low?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}

              {/* INDIA VIX / SENSEX Cross Reference */}
              {sensex && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2 opacity-90">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">BSE SENSEX</span>
                    <span className="text-[10px] text-slate-400">Cross-Index</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {sensex.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      sensex.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {sensex.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{sensex.changePercent >= 0 ? '+' : ''}{sensex.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {sensex.change >= 0 ? '+' : ''}{sensex.change.toFixed(2)} pts</span>
                    <span>High: {sensex.high?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* BSE SENSEX Card */}
              {sensex && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">BSE SENSEX</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">BSE Benchmark</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {sensex.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      sensex.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {sensex.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{sensex.changePercent >= 0 ? '+' : ''}{sensex.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {sensex.change >= 0 ? '+' : ''}{sensex.change.toFixed(2)} pts</span>
                    <span>High: {sensex.high?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}

              {/* BSE 100 Card */}
              {bse100 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">BSE 100</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">BSE Largecap</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {bse100.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      bse100.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {bse100.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{bse100.changePercent >= 0 ? '+' : ''}{bse100.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {bse100.change >= 0 ? '+' : ''}{bse100.change.toFixed(2)} pts</span>
                    <span>High: {bse100.high?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}

              {/* BSE SME IPO Platform Index Card */}
              {bseSme && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">BSE SME IPO</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">BSE SME Platform</span>
                  </div>
                  <div className="flex items-baseline justify-between font-mono tabular-nums">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {bseSme.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm font-semibold flex items-center gap-0.5 ${
                      bseSme.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {bseSme.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{bseSme.changePercent >= 0 ? '+' : ''}{bseSme.changePercent.toFixed(2)}%</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Change: {bseSme.change >= 0 ? '+' : ''}{bseSme.change.toFixed(2)} pts</span>
                    <span>High: {bseSme.high?.toLocaleString('en-IN') || '—'}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* C. Market Highlights: Top Gainers, Losers, and Actively Traded */}
      <NseMarketHighlights
        exchange={currentExchange}
        onSelectStock={onSelectStock}
      />

      {/* D. Quick Access: Watchlist Preview & Explore Stocks Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Preview (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Your Saved Watchlist ({watchlistSymbols.length})
              </h2>
            </div>
            <button
              onClick={onNavigateToWatchlist}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View all in Watchlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {watchlistStocks.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You haven't saved any stocks to your watchlist yet.
              </p>
              <button
                onClick={() => onNavigateToExplore?.()}
                className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
              >
                Browse stocks to add
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {watchlistStocks.map((stk) => (
                <div
                  key={`${stk.exchange}-${stk.symbol}`}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-slate-50/50 dark:bg-slate-850/50 transition-colors flex items-center justify-between group"
                >
                  <button
                    onClick={() => onSelectStock(stk.symbol)}
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {stk.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {stk.symbol} · {stk.exchange}
                    </div>
                  </button>

                  <div className="text-right font-mono tabular-nums pl-2">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      ₹{stk.ltp.toFixed(2)}
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      stk.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stk.changePercent >= 0 ? '+' : ''}{stk.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore All Stocks Quick Card */}
        <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl p-6 text-white flex flex-col justify-between shadow-xs space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold leading-tight">
              Explore 8,950+ Indian Securities
            </h3>
            <p className="text-xs text-sky-100 leading-relaxed">
              Access the complete security master database for NSE and BSE. Filter by sector, SME series, and BSE scrip codes.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateToExplore?.()}
              className="w-full py-2.5 px-4 rounded-lg bg-white text-sky-800 text-xs font-bold hover:bg-sky-50 flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <span>Open Stock Explorer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-[10px] text-sky-200 text-center">
              Covers Mainboard, SMEs & Dual-Listed Equities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
