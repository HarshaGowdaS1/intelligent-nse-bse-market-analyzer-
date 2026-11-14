import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Exchange } from '../../types/market';
import { SecurityMaster } from '../../services/securityMaster';
import {
  MarketHighlightItem,
  MarketHighlightsResponse,
  MarketHighlightsService,
  MarketHighlightTab,
} from '../../services/marketHighlightsService';

interface NseMarketHighlightsProps {
  exchange?: Exchange;
  onSelectStock: (symbol: string, targetExchange?: Exchange) => void;
}

export const NseMarketHighlights: React.FC<NseMarketHighlightsProps> = ({
  exchange = 'NSE',
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<MarketHighlightTab>('gainers');
  const [data, setData] = useState<MarketHighlightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackCatalogueCount = useMemo(() => {
    const stats = SecurityMaster.getStats();
    return exchange === 'NSE' ? stats.nseCount : stats.bseCount;
  }, [exchange]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    MarketHighlightsService.fetchMarketHighlights(exchange, 5, controller.signal)
      .then((res) => {
        if (!active) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!active || err?.name === 'AbortError') return;
        setData(null);
        setError(
          err?.message ||
            `Historical EOD market highlights for ${exchange} are currently unavailable.`
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [exchange]);

  const catalogueCount = data?.catalogueCount ?? fallbackCatalogueCount;

  const activeRows: MarketHighlightItem[] = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'gainers') return data.gainers;
    if (activeTab === 'losers') return data.losers;
    return data.mostActive;
  }, [data, activeTab]);

  const exchangeFullName =
    exchange === 'NSE' ? 'National Stock Exchange' : 'Bombay Stock Exchange';

  const emptyMessage = useMemo(() => {
    if (error) return error;
    if (!data || !data.latestDate || data.evaluatedCount === 0) {
      return `No historical EOD trading records are currently available for ${exchange}.`;
    }
    if (activeTab === 'gainers') {
      return `No ${exchange} equities posted positive daily gains on session ${data.latestDate}.`;
    }
    if (activeTab === 'losers') {
      return `No ${exchange} equities posted negative daily declines on session ${data.latestDate}.`;
    }
    return `No ${exchange} trading volume records are available for session ${data.latestDate}.`;
  }, [error, data, exchange, activeTab]);

  return (
    <section
      aria-label={`${exchange} Market Highlights`}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {exchange} Market Highlights
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                exchange === 'NSE'
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {exchange} Only ({catalogueCount.toLocaleString('en-IN')} Equities)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Significant market movers on {exchangeFullName} from latest session.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>
                Historical EOD
                {data?.latestDate ? ` · Session ${data.latestDate}` : ''}
                {data?.previousDate ? ` vs ${data.previousDate}` : ''}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              <span>End-of-Day Bhavcopy · Not live intraday</span>
            </span>
          </div>
        </div>

        {/* Horizontal Tab Selector */}
        <div
          role="tablist"
          aria-label="Market highlight categories"
          className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'gainers'}
            onClick={() => setActiveTab('gainers')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'gainers'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Top Gainers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'losers'}
            onClick={() => setActiveTab('losers')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'losers'
                ? 'bg-white dark:bg-slate-700 text-red-700 dark:text-red-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Top Losers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Most Active
          </button>
        </div>
      </div>

      {/* Responsive Table / States */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-6 space-y-2.5" aria-busy="true" aria-label="Loading market highlights">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : activeRows.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {emptyMessage}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Only verified historical End-of-Day exchange records are displayed.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3 text-right">Closing Price</th>
                <th className="py-2.5 px-3 text-right">Daily Change</th>
                <th className="py-2.5 px-3 text-right">Trading Volume</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeRows.map((stk) => {
                const pct = stk.dailyChangePercent;
                const delta = stk.dailyChange;
                const isPositive = pct !== null && pct >= 0;

                return (
                  <tr
                    key={`${stk.exchange}-${stk.symbol}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectStock(stk.symbol, stk.exchange)}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 text-left"
                      >
                        {stk.name}
                      </button>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {stk.symbol} · {stk.exchange}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {stk.sector}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                      ₹{stk.closePrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {pct !== null ? (
                        <div className="inline-flex flex-col items-end">
                          <span
                            className={`inline-flex items-center gap-0.5 font-semibold ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {pct >= 0 ? '+' : ''}
                              {pct.toFixed(2)}%
                            </span>
                          </span>
                          {delta !== null && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {delta >= 0 ? '+' : '-'}₹
                              {Math.abs(delta).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {stk.volume > 0
                        ? `${stk.volume.toLocaleString('en-IN')} shares`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectStock(stk.symbol, stk.exchange)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white font-medium text-[11px] transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
