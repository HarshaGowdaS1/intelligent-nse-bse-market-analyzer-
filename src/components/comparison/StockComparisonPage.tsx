import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  BarChart2, 
  Download, 
  Info,
  CheckCircle2,
  ArrowRight,
  Search
} from 'lucide-react';
import { StockQuote, CandleData, Timeframe, Exchange } from '../../types/market';
import { SampleDataService } from '../../services/dataService';
import { MarketDataService } from '../../services/marketDataService';
import { calculateRSI, calculateRiskMetrics, calculateBeta } from '../../services/indicators';
import { generateCSVString } from '../../utils/csvExport';
import { SecurityMaster } from '../../services/securityMaster';

interface StockComparisonPageProps {
  allStocks: StockQuote[];
  onSelectStockForAnalysis: (symbol: string) => void;
  currentExchange?: Exchange;
  onExchangeChange?: (exchange: Exchange) => void;
}

const PALETTE = ['#0284c7', '#059669', '#d97706', '#7c3aed'];

export const StockComparisonPage: React.FC<StockComparisonPageProps> = ({
  allStocks,
  onSelectStockForAnalysis,
  currentExchange = 'NSE',
  onExchangeChange
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK']);
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [stockCandles, setStockCandles] = useState<Record<string, CandleData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Autocomplete suggestions filtered by current exchange
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return SecurityMaster.searchQuick(q, 6, currentExchange);
  }, [searchQuery, currentExchange]);

  // Load candle data for all selected symbols
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadAll = selectedSymbols.map(sym => {
      const stock = allStocks.find(s => 
        s.symbol.toUpperCase() === sym.toUpperCase() && 
        (!currentExchange || s.exchange === currentExchange)
      ) || allStocks.find(s => s.symbol.toUpperCase() === sym.toUpperCase());
      const ex = currentExchange || stock?.exchange || 'NSE';
      return MarketDataService.getHistoricalCandles(sym, ex, timeframe)
        .then(res => ({
          sym,
          candles: res.candles.length > 0 ? res.candles : null
        }))
        .catch(() => ({ sym, candles: null }));
    });

    Promise.all(loadAll).then(async (results) => {
      if (!isMounted) return;
      const dict: Record<string, CandleData[]> = {};

      for (const res of results) {
        if (res.candles && res.candles.length > 0) {
          dict[res.sym] = res.candles;
        } else {
          dict[res.sym] = await SampleDataService.getHistoricalCandles(res.sym, timeframe);
        }
      }

      setStockCandles(dict);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbols, timeframe, allStocks, currentExchange]);

  const handleAddStock = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (clean && !selectedSymbols.includes(clean) && selectedSymbols.length < 4) {
      setSelectedSymbols([...selectedSymbols, clean]);
      setSearchQuery('');
    }
  };

  const handleRemoveStock = (sym: string) => {
    if (selectedSymbols.length > 2) {
      setSelectedSymbols(selectedSymbols.filter(s => s !== sym));
    }
  };

  // Rebased (Base 100) performance series for comparison chart
  const rebasedSeries = useMemo(() => {
    const series: Record<string, { date: string; rebased: number }[]> = {};

    for (const sym of selectedSymbols) {
      const candles = stockCandles[sym];
      if (!candles || candles.length === 0) continue;
      const baseClose = candles[0].close || 1;

      series[sym] = candles.map(c => ({
        date: c.date,
        rebased: Number(((c.close / baseClose) * 100).toFixed(2))
      }));
    }

    return series;
  }, [selectedSymbols, stockCandles]);

  // Compute comparative metric profile for each selected stock
  const comparisonProfiles = useMemo(() => {
    return selectedSymbols.map((sym, idx) => {
      const stock = allStocks.find(s => s.symbol === sym) || allStocks[0];
      const candles = stockCandles[sym] || [];
      const closes = candles.map(c => c.close);

      const rsi = calculateRSI(closes, 14);
      const currentRsi = rsi.length > 0 ? (rsi[rsi.length - 1] ?? 50) : 50;

      const risk = calculateRiskMetrics(closes, 6.85);
      const benchCandles = stockCandles['RELIANCE'] || candles;
      const beta = calculateBeta(closes, benchCandles.map(c => c.close));

      const totalReturn = closes.length >= 2 
        ? Number((((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2))
        : 0;

      const latestPrice = closes.length > 0 ? closes[closes.length - 1] : (stock?.ltp || 0);

      return {
        symbol: sym,
        name: stock?.name || sym,
        color: PALETTE[idx % PALETTE.length],
        latestPrice,
        totalReturn,
        volatility: risk.annualizedVolatility,
        beta,
        maxDrawdown: risk.maxDrawdown,
        rsi: currentRsi,
        sharpe: risk.sharpeRatio
      };
    });
  }, [selectedSymbols, allStocks, stockCandles]);

  // Download Comparison as CSV
  const handleExportCSV = () => {
    const headers = ['Metric', ...comparisonProfiles.map(p => p.symbol)];
    const rows = [
      ['Company Name', ...comparisonProfiles.map(p => p.name)],
      ['Latest Price (INR)', ...comparisonProfiles.map(p => p.latestPrice.toFixed(2))],
      ['Total Period Return (%)', ...comparisonProfiles.map(p => p.totalReturn.toFixed(2) + '%')],
      ['Annualized Volatility (%)', ...comparisonProfiles.map(p => (p.volatility * 100).toFixed(2) + '%')],
      ['Beta (vs NIFTY)', ...comparisonProfiles.map(p => p.beta.toFixed(2))],
      ['Max Drawdown (%)', ...comparisonProfiles.map(p => (p.maxDrawdown * 100).toFixed(2) + '%')],
      ['RSI (14-Day)', ...comparisonProfiles.map(p => p.rsi.toFixed(1))],
      ['Sharpe Ratio', ...comparisonProfiles.map(p => p.sharpe.toFixed(2))]
    ];

    const csvContent = generateCSVString(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stock_Comparison_${selectedSymbols.join('_')}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Compare Stocks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare 2 to 4 Indian stocks side-by-side to understand relative returns, volatility, and risk.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start sm:self-auto px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Comparison CSV</span>
        </button>
      </div>

      {/* 2. Stock Selector Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {onExchangeChange && (
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 mr-1">
                <button
                  type="button"
                  onClick={() => onExchangeChange('NSE')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    currentExchange === 'NSE'
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
                    currentExchange === 'BSE'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  BSE
                </button>
              </div>
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Comparing ({selectedSymbols.length}/4 stocks):
            </span>
            {selectedSymbols.map((sym, idx) => (
              <div
                key={sym}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2 text-xs font-semibold"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                <span className="text-slate-900 dark:text-slate-100">{sym}</span>
                {selectedSymbols.length > 2 && (
                  <button
                    onClick={() => handleRemoveStock(sym)}
                    className="text-slate-400 hover:text-red-500"
                    title={`Remove ${sym}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Stock Input with 8,950-Stock Autocomplete */}
          {selectedSymbols.length < 4 && (
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleAddStock(searchQuery);
                    }
                  }}
                  placeholder="Add stock (e.g. INFY, SBIN)..."
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 w-52"
                />

                {/* Suggestions Dropdown */}
                {searchQuery.trim() && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((s) => (
                      <button
                        key={`${s.exchange}-${s.symbol}`}
                        type="button"
                        onClick={() => handleAddStock(s.symbol)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{s.symbol}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.exchange}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAddStock(searchQuery)}
                disabled={!searchQuery.trim()}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Rebased Performance Growth Chart (Base 100) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Normalized Performance Growth (Base 100)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sets starting value of every stock to ₹100 so you can clearly compare percentage growth over time
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            {(['1M', '3M', '6M', '1Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-line Comparison SVG Chart */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full mr-2" />
            Loading historical comparison data...
          </div>
        ) : (
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 800 240" className="w-full h-full">
              {/* Baseline 100 Reference Line */}
              <line 
                x1="40" 
                y1="120" 
                x2="780" 
                y2="120" 
                stroke="currentColor" 
                className="text-slate-300 dark:text-slate-700" 
                strokeDasharray="4 4" 
              />
              <text x="45" y="115" className="text-[10px] fill-slate-400 font-mono">
                Base ₹100
              </text>

              {/* Render each stock's rebased curve */}
              {selectedSymbols.map((sym, sIdx) => {
                const data = rebasedSeries[sym] || [];
                if (data.length < 2) return null;

                const color = PALETTE[sIdx % PALETTE.length];
                const minVal = 80;
                const maxVal = 140;
                const range = maxVal - minVal;

                const getX = (i: number) => 40 + (i / (data.length - 1)) * 740;
                const getY = (val: number) => 220 - ((val - minVal) / range) * 200;

                const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.rebased).toFixed(1)}`).join(' ');

                return (
                  <g key={sym}>
                    <path
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              {comparisonProfiles.map((p) => (
                <div key={p.symbol} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{p.symbol}</span>
                  <span className={`font-mono text-[11px] ${p.totalReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    ({p.totalReturn >= 0 ? '+' : ''}{p.totalReturn}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Side-by-Side Metrics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Side-by-Side Metric Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive comparison across returns, volatility, risk, and technical momentum
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-1/4">Metric</th>
                {comparisonProfiles.map((p) => (
                  <th key={p.symbol} className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-bold text-slate-900 dark:text-slate-100">{p.symbol}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[130px] ml-auto">
                      {p.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
              {/* Latest Price */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Closing Price
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{p.latestPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* Total Return */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Total Period Return
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right font-bold">
                    <span className={p.totalReturn >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      {p.totalReturn >= 0 ? '+' : ''}{p.totalReturn.toFixed(2)}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Annualized Volatility */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Annualized Volatility (Price Swings)
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right text-slate-800 dark:text-slate-200">
                    {(p.volatility * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* Beta */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Beta (Market Sensitivity)
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right text-slate-800 dark:text-slate-200">
                    {p.beta.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Maximum Drawdown */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Max Historical Drawdown
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                    -{(p.maxDrawdown * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* RSI */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  14-Day RSI (Momentum)
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right text-slate-800 dark:text-slate-200">
                    {p.rsi.toFixed(1)}
                  </td>
                ))}
              </tr>

              {/* Action */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                <td className="py-3 px-4 font-sans font-medium text-slate-700 dark:text-slate-300">
                  Action
                </td>
                {comparisonProfiles.map((p) => (
                  <td key={p.symbol} className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectStockForAnalysis(p.symbol)}
                      className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-semibold font-sans text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
