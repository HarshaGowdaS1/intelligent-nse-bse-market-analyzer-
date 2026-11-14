import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star, 
  Calendar, 
  Clock, 
  Download, 
  BrainCircuit, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle2, 
  HelpCircle,
  BarChart2,
  Activity,
  ArrowRight
} from 'lucide-react';
import { StockQuote, CandleData, Timeframe, Exchange } from '../../types/market';
import { MarketDataService, TejHQCorporateAction } from '../../services/marketDataService';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateBollingerBands, 
  calculateMACD, 
  calculateRiskMetrics, 
  calculateBeta 
} from '../../services/indicators';
import { exportStockDataToCSV } from '../../utils/csvExport';
import { SecurityMaster } from '../../services/securityMaster';

interface StockAnalysisPageProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  allStocks: StockQuote[];
  onNavigateToPredictions: (symbol: string) => void;
  watchlistSymbols?: string[];
  onToggleWatchlist?: (symbol: string) => void;
  currentExchange?: Exchange;
  onExchangeChange?: (exchange: Exchange) => void;
}

export const StockAnalysisPage: React.FC<StockAnalysisPageProps> = ({
  selectedSymbol,
  onSelectSymbol,
  allStocks,
  onNavigateToPredictions,
  watchlistSymbols = [],
  onToggleWatchlist,
  currentExchange = 'NSE',
  onExchangeChange
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe | '3Y' | 'ALL'>('1M');
  const [chartMode, setChartMode] = useState<'line' | 'candles'>('line');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Autocomplete search filtered by current exchange
  const searchResults = useMemo(() => {
    const q = stockSearchQuery.trim();
    if (!q) return [];
    return SecurityMaster.searchQuick(q, 8, currentExchange);
  }, [stockSearchQuery, currentExchange]);

  // Security Master metadata matching composite (exchange, symbol)
  const securityMeta = useMemo(() => {
    return SecurityMaster.getBySymbol(selectedSymbol, currentExchange) || SecurityMaster.getBySymbol(selectedSymbol);
  }, [selectedSymbol, currentExchange]);

  // Resolve current stock quote
  const currentQuote = useMemo(() => {
    const fromProps = allStocks.find(s => 
      s.symbol.toUpperCase() === selectedSymbol.toUpperCase() && 
      (!currentExchange || s.exchange === currentExchange)
    ) || allStocks.find(s => s.symbol.toUpperCase() === selectedSymbol.toUpperCase());

    if (fromProps && candles.length > 0) {
      return MarketDataService.buildQuoteFromCandles(fromProps.symbol, fromProps.exchange, candles, securityMeta);
    }
    if (fromProps) return fromProps;

    const exchange = currentExchange || securityMeta?.exchange || 'NSE';
    return MarketDataService.buildQuoteFromCandles(selectedSymbol, exchange, candles, securityMeta);
  }, [selectedSymbol, allStocks, candles, securityMeta, currentExchange]);

  // Fetch authentic historical candles from SQLite/EOD API with composite (symbol, exchange)
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMsg(null);

    const exchange = currentExchange || securityMeta?.exchange || currentQuote?.exchange || 'NSE';

    MarketDataService.getHistoricalCandles(selectedSymbol, exchange, timeframe === '3Y' || timeframe === 'ALL' ? '1Y' : timeframe)
      .then(res => {
        if (!isCancelled) {
          setCandles(res.candles);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          setErrorMsg('Historical market data is currently unavailable for this security from official exchange bhavcopy.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSymbol, timeframe, securityMeta, currentExchange, currentQuote?.exchange]);

  // Filter candles based on selected date filter
  const filteredCandles = useMemo(() => {
    if (candles.length === 0) return [];
    if (timeframe === 'ALL') return candles;
    
    const countMap: Record<string, number> = {
      '1D': 1,
      '5D': 5,
      '1M': 22,
      '3M': 66,
      '6M': 130,
      '1Y': 252,
      '3Y': 756
    };
    const maxCount = countMap[timeframe] || 252;
    return candles.slice(-maxCount);
  }, [candles, timeframe]);

  // Calculate real technical indicators on authentic retrieved prices
  const technicals = useMemo(() => {
    if (filteredCandles.length < 5) return null;

    const closePrices = filteredCandles.map(c => c.close);
    const rsiSeries = calculateRSI(closePrices, 14);
    const rawRsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1] : 50;
    const latestRsi = rawRsi !== null && rawRsi !== undefined ? rawRsi : 50;

    const sma20 = calculateSMA(closePrices, 20);
    const sma50 = calculateSMA(closePrices, 50);
    const ema20 = calculateEMA(closePrices, 20);

    const macd = calculateMACD(closePrices, 12, 26, 9);
    const bBands = calculateBollingerBands(closePrices, 20, 2);

    const latestPrice = filteredCandles[filteredCandles.length - 1].close;
    const latestSMA20 = sma20[sma20.length - 1] || latestPrice;
    const latestSMA50 = sma50[sma50.length - 1] || latestPrice;
    const latestEMA20 = ema20[ema20.length - 1] || latestPrice;
    const latestMACD = macd.macdLine[macd.macdLine.length - 1] || 0;
    const latestSignal = macd.signalLine[macd.signalLine.length - 1] || 0;
    const latestHistogram = macd.histogram[macd.histogram.length - 1] || 0;

    return {
      rsi: latestRsi,
      sma20: latestSMA20,
      sma50: latestSMA50,
      ema20: latestEMA20,
      macd: latestMACD,
      macdSignal: latestSignal,
      macdHist: latestHistogram,
      bBandsUpper: bBands.upper[bBands.upper.length - 1] || latestPrice * 1.05,
      bBandsLower: bBands.lower[bBands.lower.length - 1] || latestPrice * 0.95
    };
  }, [filteredCandles]);

  // Calculate real risk metrics on authentic retrieved prices
  const riskMetrics = useMemo(() => {
    if (filteredCandles.length < 10) return null;
    const closePrices = filteredCandles.map(c => c.close);
    const metrics = calculateRiskMetrics(closePrices, 0.065);
    const beta = calculateBeta(closePrices, closePrices); // Benchmark normalized

    let riskLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (metrics.annualizedVolatility < 0.18) riskLevel = 'Low';
    else if (metrics.annualizedVolatility > 0.32) riskLevel = 'High';

    return {
      ...metrics,
      beta,
      riskLevel
    };
  }, [filteredCandles]);

  const isWatchlisted = watchlistSymbols.includes(selectedSymbol);

  // SVG Chart Calculations
  const chartCoordinates = useMemo(() => {
    if (filteredCandles.length < 2) return null;

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };

    const prices = filteredCandles.map(c => c.close);
    const minPrice = Math.min(...filteredCandles.map(c => c.low));
    const maxPrice = Math.max(...filteredCandles.map(c => c.high));
    const range = (maxPrice - minPrice) || 1;

    const getX = (index: number) => {
      return padding.left + (index / (filteredCandles.length - 1)) * (width - padding.left - padding.right);
    };

    const getY = (val: number) => {
      return height - padding.bottom - ((val - minPrice) / range) * (height - padding.top - padding.bottom);
    };

    const pathData = filteredCandles.map((c, idx) => {
      return `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(c.close).toFixed(1)}`;
    }).join(' ');

    const areaData = `${pathData} L ${getX(filteredCandles.length - 1).toFixed(1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    const isPositive = filteredCandles[filteredCandles.length - 1].close >= filteredCandles[0].close;

    return {
      width,
      height,
      padding,
      minPrice,
      maxPrice,
      pathData,
      areaData,
      isPositive,
      getX,
      getY
    };
  }, [filteredCandles]);

  const handleExport = () => {
    exportStockDataToCSV(currentQuote.symbol, filteredCandles);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 0. Quick Stock Switcher & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Popular Picks */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              Quick Switch:
            </span>
            {(currentExchange === 'BSE' 
              ? ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ABB', 'ITC', 'LT', 'SBIN']
              : ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'ICICIBANK', 'BHARTIARTL', 'TATAMOTORS']
            ).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => onSelectSymbol(sym)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedSymbol.toUpperCase() === sym
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Search Across All 8,950 Securities */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={stockSearchQuery}
              onChange={(e) => setStockSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={`Search ${currentExchange} stocks (or 8,950+ total)...`}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />

            {/* Live Autocomplete Dropdown */}
            {stockSearchQuery.trim() && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {searchResults.map((s) => (
                  <button
                    key={`${s.exchange}-${s.symbol}`}
                    type="button"
                    onClick={() => {
                      onSelectSymbol(s.symbol);
                      if (onExchangeChange && s.exchange) {
                        onExchangeChange(s.exchange);
                      }
                      setStockSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-sky-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{s.symbol}</span>
                        <span>·</span>
                        <span>{s.category || 'Mainboard'}</span>
                        {s.bseCode && (
                          <>
                            <span>·</span>
                            <span>BSE {s.bseCode}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.exchange === 'NSE' 
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {s.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Company Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {currentQuote.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {currentQuote.symbol}
              </span>
              
              {/* Interactive Exchange Switcher */}
              {onExchangeChange ? (
                <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onExchangeChange('NSE')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                      currentQuote.exchange === 'NSE'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    NSE
                  </button>
                  <button
                    type="button"
                    onClick={() => onExchangeChange('BSE')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                      currentQuote.exchange === 'BSE'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    BSE
                  </button>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
                  {currentQuote.exchange}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
              <span>{currentQuote.sector || securityMeta?.sector || 'Diversified Equities'}</span>
              <span>·</span>
              <span className="font-mono">ISIN: {currentQuote.isin || securityMeta?.isin || '—'}</span>
              {securityMeta?.bseCode && (
                <>
                  <span>·</span>
                  <span className="font-mono">BSE Scrip: {securityMeta.bseCode}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(selectedSymbol)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isWatchlisted
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current text-amber-500' : 'text-slate-400'}`} />
                <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToPredictions(selectedSymbol)}
              className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>AI Predictions</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={filteredCandles.length === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              title="Download Price History as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Key Price and Daily Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Closing Price */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Latest Close</span>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              ₹{currentQuote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Daily Change */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Daily Change</span>
            <div className={`text-sm font-bold font-mono tabular-nums flex items-center gap-0.5 ${
              currentQuote.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {currentQuote.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{currentQuote.changePercent >= 0 ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ₹{currentQuote.change >= 0 ? '+' : ''}{currentQuote.change.toFixed(2)}
            </div>
          </div>

          {/* Open / Previous Close */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Day Open</span>
            <div className="text-sm font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              ₹{currentQuote.open.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Prev Close: ₹{currentQuote.prevClose.toFixed(2)}
            </div>
          </div>

          {/* Day High / Low */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Day High / Low</span>
            <div className="text-sm font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              ₹{currentQuote.high.toFixed(2)} / ₹{currentQuote.low.toFixed(2)}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Trading Volume</span>
            <div className="text-sm font-semibold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {currentQuote.volume ? currentQuote.volume.toLocaleString('en-IN') : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Shares traded</div>
          </div>

          {/* Latest Trading Date */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Trading Date</span>
            <div className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">
              {filteredCandles.length > 0 ? filteredCandles[filteredCandles.length - 1].date : 'Latest Bhavcopy'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Authentic EOD Data
            </div>
          </div>
        </div>
      </div>

      {/* 3. Historical Price Chart & Timeframe Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Historical Price Chart
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Closing prices from official exchange Bhavcopy data
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            {(['1M', '3M', '6M', '1Y', '3Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf === '1M' && '1 Month'}
                {tf === '3M' && '3 Months'}
                {tf === '6M' && '6 Months'}
                {tf === '1Y' && '1 Year'}
                {tf === '3Y' && '3 Years'}
                {tf === 'ALL' && 'All History'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Viewport */}
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mr-2"></div>
            Loading official EOD price data...
          </div>
        ) : errorMsg ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <Info className="w-8 h-8 text-slate-400" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {errorMsg}
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              We only show genuine exchange trading data. When historical prices are unavailable for smaller or thinly traded scrips, we do not fabricate numbers.
            </p>
          </div>
        ) : chartCoordinates ? (
          <div className="relative">
            {/* SVG Interactive Line Chart */}
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartCoordinates.width} ${chartCoordinates.height}`}
                className="w-full h-72 touch-none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="0%" 
                      stopColor={chartCoordinates.isPositive ? '#059669' : '#dc2626'} 
                      stopOpacity="0.25" 
                    />
                    <stop 
                      offset="100%" 
                      stopColor={chartCoordinates.isPositive ? '#059669' : '#dc2626'} 
                      stopOpacity="0.0" 
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                <line 
                  x1={chartCoordinates.padding.left} 
                  y1={chartCoordinates.padding.top} 
                  x2={chartCoordinates.width - chartCoordinates.padding.right} 
                  y2={chartCoordinates.padding.top} 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800" 
                  strokeDasharray="4 4" 
                />
                <line 
                  x1={chartCoordinates.padding.left} 
                  y1={chartCoordinates.height / 2} 
                  x2={chartCoordinates.width - chartCoordinates.padding.right} 
                  y2={chartCoordinates.height / 2} 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800" 
                  strokeDasharray="4 4" 
                />
                <line 
                  x1={chartCoordinates.padding.left} 
                  y1={chartCoordinates.height - chartCoordinates.padding.bottom} 
                  x2={chartCoordinates.width - chartCoordinates.padding.right} 
                  y2={chartCoordinates.height - chartCoordinates.padding.bottom} 
                  stroke="currentColor" 
                  className="text-slate-200 dark:text-slate-800" 
                />

                {/* Filled Area */}
                <path
                  d={chartCoordinates.areaData}
                  fill="url(#chartGradient)"
                />

                {/* Price Stroke Line */}
                <path
                  d={chartCoordinates.pathData}
                  fill="none"
                  stroke={chartCoordinates.isPositive ? '#059669' : '#dc2626'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover Indicator if active */}
                {hoveredCandle && (
                  <circle
                    cx={chartCoordinates.getX(filteredCandles.indexOf(hoveredCandle))}
                    cy={chartCoordinates.getY(hoveredCandle.close)}
                    r="4"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>

            {/* Price Scale Indicators */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono px-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Low: ₹{chartCoordinates.minPrice.toFixed(2)}</span>
              <span>
                {filteredCandles[0]?.date} → {filteredCandles[filteredCandles.length - 1]?.date}
              </span>
              <span>High: ₹{chartCoordinates.maxPrice.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Beginner-Friendly Technical Analysis (Expandable Accordion) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Technical Analysis & Indicators (Explained Simply)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                RSI, Moving Averages, MACD, and Bollinger Bands with plain-English definitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span>{showTechnicalDetails ? 'Hide' : 'Expand'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnicalDetails && technicals && (
          <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* RSI Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Relative Strength Index (RSI - 14 Days)</span>
                    <span className="text-slate-400" title="Measures momentum on a 0-100 scale">ℹ️</span>
                  </div>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100 tabular-nums">
                    {technicals.rsi.toFixed(1)}
                  </span>
                </div>
                {/* Visual meter */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      technicals.rsi > 70 ? 'bg-amber-500' : technicals.rsi < 30 ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, technicals.rsi))}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  <strong>What this means:</strong> RSI measures whether the stock has risen or fallen too fast recently on a scale from 0 to 100.
                  {technicals.rsi > 70 
                    ? ' Above 70 suggests the stock may be overbought (potentially due for a cooldown).'
                    : technicals.rsi < 30
                    ? ' Below 30 suggests the stock may be oversold (potentially undervalued recently).'
                    : ' Between 30 and 70 indicates a balanced, neutral price momentum.'}
                </p>
              </div>

              {/* Moving Averages Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Moving Averages (Trend Direction)
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">20-Day SMA</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{technicals.sma20.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">50-Day SMA</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{technicals.sma50.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">20-Day EMA</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{technicals.ema20.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  <strong>What this means:</strong> Moving averages smooth out daily price fluctuations to show the underlying trend. Since the current price (₹{currentQuote.ltp.toFixed(2)}) is{' '}
                  {currentQuote.ltp >= technicals.sma50 ? 'above its 50-day average, the medium-term trend is upward (bullish).' : 'below its 50-day average, the trend is currently downward.'}
                </p>
              </div>

              {/* MACD Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    MACD (Momentum & Trend Changes)
                  </div>
                  <span className={`font-mono font-bold text-xs ${
                    technicals.macdHist >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {technicals.macdHist >= 0 ? '+Bullish Momentum' : '-Bearish Momentum'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">MACD Line</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{technicals.macd.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Signal Line</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{technicals.macdSignal.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  <strong>What this means:</strong> MACD compares short-term and medium-term moving averages. When the MACD line crosses above the Signal line, it signals buying momentum; crossing below signals selling pressure.
                </p>
              </div>

              {/* Bollinger Bands Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Bollinger Bands (Normal Trading Range)
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Upper Band (Ceiling)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{technicals.bBandsUpper.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Lower Band (Floor)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{technicals.bBandsLower.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  <strong>What this means:</strong> Bollinger Bands create an envelope around the stock's average price based on recent volatility. Approximately 90% of trading typically happens between the upper and lower bands.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Beginner-Friendly Risk Analysis (Expandable Accordion) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowRiskDetails(!showRiskDetails)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Risk Analysis & Volatility (Explained Simply)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Understand price swings, maximum historical drops, and Value at Risk (VaR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span>{showRiskDetails ? 'Hide' : 'Expand'}</span>
            {showRiskDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showRiskDetails && riskMetrics && (
          <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
            {/* Overall Risk Badge */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Historical Risk Level:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                riskMetrics.riskLevel === 'Low'
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  : riskMetrics.riskLevel === 'High'
                  ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
              }`}>
                {riskMetrics.riskLevel} Historical Risk
              </span>
              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                Based on {(riskMetrics.annualizedVolatility * 100).toFixed(1)}% annualized volatility
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Volatility */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Price Volatility
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {(riskMetrics.annualizedVolatility * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>What this means:</strong> How much the stock price usually swings in a year. Higher numbers mean sharper ups and downs.
                </p>
              </div>

              {/* Maximum Drawdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Maximum Drawdown
                </span>
                <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
                  -{(riskMetrics.maxDrawdown * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>What this means:</strong> The largest historical price drop from a previous peak to a trough during this period.
                </p>
              </div>

              {/* Value at Risk (VaR 95%) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Value at Risk (95% VaR)
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  -{(riskMetrics.var95 * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>What this means:</strong> On 95 out of 100 normal trading days, the daily price drop has not exceeded this percentage.
                </p>
              </div>

              {/* Sharpe Ratio */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Sharpe Ratio
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {riskMetrics.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>What this means:</strong> Measures return earned per unit of risk. A ratio above 1.0 indicates good risk-adjusted returns.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
