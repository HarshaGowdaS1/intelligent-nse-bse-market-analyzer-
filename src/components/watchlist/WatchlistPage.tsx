import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  X,
  Cloud,
  CheckCircle2,
  Building2,
  Sparkles
} from 'lucide-react';
import { StockQuote } from '../../types/market';
import { SecurityMaster } from '../../services/securityMaster';

interface WatchlistPageProps {
  allStocks: StockQuote[];
  watchlistSymbols: string[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onSelectStockForAnalysis: (symbol: string) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  allStocks,
  watchlistSymbols,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onSelectStockForAnalysis
}) => {
  const [addSearch, setAddSearch] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Quotes map
  const quotesMap = useMemo(() => {
    const map = new Map<string, StockQuote>();
    for (const q of allStocks) {
      map.set(q.symbol.toUpperCase(), q);
    }
    return map;
  }, [allStocks]);

  // Watchlisted items with metadata
  const watchlistedItems = useMemo(() => {
    const unique = Array.from(new Set(watchlistSymbols.map(s => s.trim().toUpperCase())));
    return unique.map(sym => {
      const quote = quotesMap.get(sym);
      const sec = SecurityMaster.getBySymbol(sym);
      return {
        symbol: sym,
        name: sec?.name || quote?.name || sym,
        exchange: sec?.exchange || quote?.exchange || 'NSE',
        sector: sec?.sector || quote?.sector || 'Diversified',
        price: quote?.ltp || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        hasQuote: !!quote
      };
    });
  }, [watchlistSymbols, quotesMap]);

  // Filtered watchlisted items
  const displayedItems = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return watchlistedItems;
    return watchlistedItems.filter(item => 
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.sector.toLowerCase().includes(q)
    );
  }, [watchlistedItems, filterQuery]);

  // Autocomplete suggestions when adding
  const addSuggestions = useMemo(() => {
    const q = addSearch.trim();
    if (!q) return [];
    return SecurityMaster.searchPaginated(q, 'ALL', 1, 6).items;
  }, [addSearch]);

  // Quick stats
  const avgChange = useMemo(() => {
    const valid = watchlistedItems.filter(i => i.hasQuote);
    if (valid.length === 0) return 0;
    return valid.reduce((sum, i) => sum + i.changePercent, 0) / valid.length;
  }, [watchlistedItems]);

  const topGainer = useMemo(() => {
    const valid = watchlistedItems.filter(i => i.hasQuote);
    if (valid.length === 0) return null;
    return [...valid].sort((a, b) => b.changePercent - a.changePercent)[0];
  }, [watchlistedItems]);

  const starterSuggestions = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'TATAMOTORS'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Firestore Persistence Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Watchlist
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span>{watchlistedItems.length} Stocks</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your favorite Indian equities with real-time Cloud Firestore synchronization across devices.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium self-start sm:self-auto">
          <Cloud className="w-4 h-4" />
          <span>Cloud Synchronized</span>
        </div>
      </div>

      {/* 2. Quick Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Watchlist Size
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {watchlistedItems.length} Companies
          </div>
          <span className="text-[11px] text-slate-400">Persisted in Cloud Firestore</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Average Session Return
          </span>
          <div className={`text-2xl font-bold font-mono tabular-nums mt-1 flex items-center gap-1 ${
            avgChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {avgChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>{avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%</span>
          </div>
          <span className="text-[11px] text-slate-400">Equal-weighted watchlist average</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            Top Performing Stock
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
            {topGainer ? topGainer.symbol : '—'}
          </div>
          <span className={`text-[11px] font-mono font-semibold ${
            topGainer && topGainer.changePercent >= 0 ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            {topGainer ? `${topGainer.changePercent >= 0 ? '+' : ''}${topGainer.changePercent.toFixed(2)}%` : 'Add stocks below'}
          </span>
        </div>
      </div>

      {/* 3. Add Stock Search Input */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Add Stock to Watchlist
        </h2>

        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Type company name or symbol to add (e.g. Wipro, ITC, Maruti)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />

          {/* Autocomplete dropdown */}
          {addSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {addSuggestions.map((s) => {
                const isAlreadyAdded = watchlistSymbols.includes(s.symbol);
                return (
                  <div
                    key={`${s.exchange}-${s.symbol}`}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-400">{s.symbol} · {s.exchange}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isAlreadyAdded) onAddToWatchlist(s.symbol);
                        setAddSearch('');
                      }}
                      disabled={isAlreadyAdded}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                        isAlreadyAdded
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                          : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Add to Watchlist</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Watchlisted Stocks List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {watchlistedItems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Your watchlist is currently empty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Add stocks you want to monitor closely. Your watchlist synchronizes with Cloud Firestore so your portfolio stays saved.
              </p>
            </div>

            {/* Quick Starter Suggestions */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Popular Indian bluechips to add:
              </span>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {starterSuggestions.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => onAddToWatchlist(sym)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 hover:border-sky-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{sym}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Exchange</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4 text-right">Latest Close</th>
                  <th className="py-3 px-4 text-right">Daily Change</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedItems.map((item) => (
                  <tr 
                    key={`${item.exchange}-${item.symbol}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <button
                        onClick={() => onSelectStockForAnalysis(item.symbol)}
                        className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline text-left"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {item.symbol}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.exchange}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {item.sector}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {item.hasQuote ? `₹${item.price.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {item.hasQuote ? (
                        <span className={`inline-flex items-center gap-0.5 ${
                          item.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[11px]">EOD on click</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectStockForAnalysis(item.symbol)}
                          className="px-2.5 py-1 rounded bg-sky-600 text-white hover:bg-sky-500 text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveFromWatchlist(item.symbol)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
