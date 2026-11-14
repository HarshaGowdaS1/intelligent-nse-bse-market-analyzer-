import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Star, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Info,
  ChevronLeft, 
  ChevronRight,
  Database,
  BarChart2,
  BrainCircuit,
  SlidersHorizontal
} from 'lucide-react';
import { Exchange, StockQuote } from '../../types/market';
import { SecurityMaster, SecurityMasterEntry } from '../../services/securityMaster';

interface StockExplorerPageProps {
  allStocks: StockQuote[];
  watchlistSymbols: string[];
  currentExchange?: Exchange;
  onExchangeChange?: (exchange: Exchange) => void;
  onSelectStock: (symbol: string) => void;
  onNavigateToPredictions: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
}

export const StockExplorerPage: React.FC<StockExplorerPageProps> = ({
  allStocks,
  watchlistSymbols,
  currentExchange,
  onExchangeChange,
  onSelectStock,
  onNavigateToPredictions,
  onToggleWatchlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'NSE' | 'BSE'>(currentExchange || 'ALL');

  // Sync exchangeFilter whenever external currentExchange changes
  React.useEffect(() => {
    if (currentExchange) {
      setExchangeFilter(currentExchange);
    }
  }, [currentExchange]);
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dataAvailabilityFilter, setDataAvailabilityFilter] = useState<'ALL' | 'AVAILABLE_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'symbol' | 'sector'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Catalogue statistics and dropdown metadata
  const stats = useMemo(() => SecurityMaster.getStats(), []);
  const sectors = useMemo(() => SecurityMaster.getSectors(), []);
  const categories = useMemo(() => SecurityMaster.getCategories(), []);

  // Quick price map from currently loaded genuine stock quotes
  const quotesMap = useMemo(() => {
    const map = new Map<string, StockQuote>();
    for (const q of allStocks) {
      if (q.ltp > 0) {
        map.set(`${q.exchange}:${q.symbol.toUpperCase()}`, q);
        map.set(q.symbol.toUpperCase(), q);
      }
    }
    return map;
  }, [allStocks]);

  // Execute paginated search with filters
  const searchResults = useMemo(() => {
    const result = SecurityMaster.searchPaginated(
      searchQuery.trim(),
      exchangeFilter,
      currentPage,
      pageSize,
      {
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        sector: sectorFilter === 'ALL' ? undefined : sectorFilter,
        hasMarketData: dataAvailabilityFilter === 'AVAILABLE_ONLY' ? true : undefined
      }
    );

    // Apply sorting to the current page items
    const sorted = [...result.items].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'symbol') {
        valA = a.symbol.toLowerCase();
        valB = b.symbol.toLowerCase();
      } else if (sortBy === 'sector') {
        valA = (a.sector || '').toLowerCase();
        valB = (b.sector || '').toLowerCase();
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return {
      ...result,
      items: sorted
    };
  }, [
    searchQuery,
    exchangeFilter,
    currentPage,
    pageSize,
    categoryFilter,
    sectorFilter,
    dataAvailabilityFilter,
    sortBy,
    sortOrder
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, searchResults.totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setExchangeFilter('ALL');
    setSectorFilter('ALL');
    setCategoryFilter('ALL');
    setDataAvailabilityFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Explore Indian Stocks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search and filter all {stats.totalCount.toLocaleString('en-IN')} listed equity securities on NSE and BSE.
          </p>
        </div>

        {/* Quick Exchange Counts */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            NSE: <strong className="font-semibold text-slate-900 dark:text-slate-100">{stats.nseCount.toLocaleString('en-IN')}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            BSE: <strong className="font-semibold text-slate-900 dark:text-slate-100">{stats.bseCount.toLocaleString('en-IN')}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium">
            Dual Listed: <strong className="font-semibold">{stats.dualListedCount.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by company name, symbol (e.g. RELIANCE, TCS), ISIN (e.g. INE002A01018), or BSE scrip code (e.g. 500325)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Exchange Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Exchange
            </label>
            <select
              value={exchangeFilter}
              onChange={(e) => {
                const val = e.target.value as 'ALL' | 'NSE' | 'BSE';
                setExchangeFilter(val);
                if (val !== 'ALL' && onExchangeChange) {
                  onExchangeChange(val);
                }
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Exchanges (NSE & BSE)</option>
              <option value="NSE">NSE Only ({stats.nseCount.toLocaleString('en-IN')})</option>
              <option value="BSE">BSE Only ({stats.bseCount.toLocaleString('en-IN')})</option>
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Industry Sector
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 truncate"
            >
              <option value="ALL">All Sectors ({sectors.length})</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Data Freshness Availability Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Market Data
            </label>
            <select
              value={dataAvailabilityFilter}
              onChange={(e) => {
                setDataAvailabilityFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Securities</option>
              <option value="AVAILABLE_ONLY">With Genuine EOD Data</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Sort By
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="name">Company Name</option>
                <option value="symbol">Ticker Symbol</option>
                <option value="sector">Sector</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header and Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {searchResults.total === 0 ? 0 : (searchResults.page - 1) * pageSize + 1}
          </span>
          {' '}to{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {Math.min(searchResults.page * pageSize, searchResults.total)}
          </span>
          {' '}of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {searchResults.total.toLocaleString('en-IN')}
          </span>{' '}
          securities
          {searchQuery && ` for "${searchQuery}"`}
        </div>

        {(searchQuery || exchangeFilter !== 'ALL' || sectorFilter !== 'ALL' || categoryFilter !== 'ALL' || dataAvailabilityFilter !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Securities Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {searchResults.items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              No securities match your search
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Try searching for a different company name, ticker symbol, ISIN, or clear the exchange and sector filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors"
            >
              Show all stocks
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-3 px-4">Security / Company</th>
                  <th className="py-3 px-4">Exchange</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">ISIN / Codes</th>
                  <th className="py-3 px-4 text-right">Latest Close</th>
                  <th className="py-3 px-4 text-center">Data Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.items.map((sec) => {
                  const quoteKey = `${sec.exchange}:${sec.symbol}`;
                  const quote = quotesMap.get(quoteKey) || quotesMap.get(sec.symbol);
                  const isWatchlisted = watchlistSymbols.includes(sec.symbol);
                  const hasData = !!(quote && quote.ltp > 0);

                  return (
                    <tr 
                      key={`${sec.exchange}-${sec.symbol}-${sec.isin}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Company Name and Symbol */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          <button
                            onClick={() => onSelectStock(sec.symbol)}
                            className="text-left font-semibold hover:underline"
                          >
                            {sec.name}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>{sec.symbol}</span>
                          {sec.category && sec.category !== 'Mainboard' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-sans font-medium">
                              {sec.category}
                            </span>
                          )}
                          {sec.isDualListed && (
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-sans font-medium">
                              (Dual listed)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Exchange */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          sec.exchange === 'NSE' 
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' 
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        }`}>
                          {sec.exchange}
                        </span>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {sec.sector || 'Diversified Equity'}
                      </td>

                      {/* ISIN & BSE Code */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <div>{sec.isin}</div>
                        {sec.bseCode && (
                          <div className="text-[10px] text-slate-400">Scrip: {sec.bseCode}</div>
                        )}
                      </td>

                      {/* Price / Quote (Genuine Data) */}
                      <td className="py-3 px-4 text-right">
                        {hasData && quote ? (
                          <div className="font-mono tabular-nums">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              ₹{quote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[11px] font-medium flex items-center justify-end gap-0.5 ${
                              quote.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {quote.changePercent >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
                            </div>
                            {quote.tradingDate && (
                              <div className="text-[10px] text-slate-400 font-sans">
                                {quote.tradingDate}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              Price unavailable
                            </span>
                            <div className="text-[10px] text-sky-600 dark:text-sky-400">
                              Click Analyze to load
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Data Availability Status */}
                      <td className="py-3 px-4 text-center">
                        {hasData ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500" 
                            title="Official EOD record pending ingestion into database"
                          >
                            <Info className="w-3 h-3" />
                            <span>Pending Ingestion</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Watchlist Toggle */}
                          <button
                            type="button"
                            onClick={() => onToggleWatchlist(sec.symbol)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isWatchlisted
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-current' : ''}`} />
                          </button>

                          {/* AI Predict */}
                          <button
                            type="button"
                            onClick={() => onNavigateToPredictions(sec.symbol)}
                            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Generate AI Machine Learning forecast"
                          >
                            <BrainCircuit className="w-3 h-3 text-sky-500" />
                            <span className="hidden sm:inline">Predict</span>
                          </button>

                          {/* Detailed Analysis */}
                          <button
                            type="button"
                            onClick={() => onSelectStock(sec.symbol)}
                            className="px-2.5 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-500 text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <span>Analyze</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {searchResults.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-900 dark:text-slate-100">{searchResults.page}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{searchResults.totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(1)}
                disabled={searchResults.page <= 1}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(searchResults.page - 1)}
                disabled={searchResults.page <= 1}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Number buttons around current page */}
              {Array.from({ length: Math.min(5, searchResults.totalPages) }, (_, i) => {
                let pageNum = searchResults.page - 2 + i;
                if (pageNum < 1) pageNum += Math.abs(searchResults.page - 2) + 1;
                if (pageNum > searchResults.totalPages) pageNum = searchResults.totalPages - (4 - i);
                if (pageNum < 1 || pageNum > searchResults.totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-8 h-8 px-2 rounded-md font-medium text-xs transition-colors ${
                      pageNum === searchResults.page
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(searchResults.page + 1)}
                disabled={searchResults.page >= searchResults.totalPages}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(searchResults.totalPages)}
                disabled={searchResults.page >= searchResults.totalPages}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
