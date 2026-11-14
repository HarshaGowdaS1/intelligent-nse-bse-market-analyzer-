/**
 * Market Highlights Service
 *
 * Computes Top Gainers, Top Losers, and Most Active stocks strictly from
 * genuine historical End-of-Day (EOD) records stored in `data/market_history.db`
 * for the latest available trading session on the selected exchange.
 *
 * Daily price change and daily percentage change are calculated strictly from:
 * - Current session closing price
 * - Previous available trading session closing price in `daily_ohlcv`
 */

import { Exchange } from '../types/market';
import { HistoricalDataRepository } from './historicalDataRepository';
import { SecurityMaster } from './securityMaster';

export type MarketHighlightTab = 'gainers' | 'losers' | 'active';

export interface MarketHighlightItem {
  exchange: Exchange;
  symbol: string;
  name: string;
  sector: string;
  tradeDate: string;
  prevTradeDate: string | null;
  closePrice: number;
  prevClosePrice: number | null;
  dailyChange: number | null;
  dailyChangePercent: number | null;
  volume: number;
  dataSource: string;
}

export interface MarketHighlightsResponse {
  exchange: Exchange;
  catalogueCount: number;
  latestDate: string | null;
  previousDate: string | null;
  evaluatedCount: number;
  isHistoricalEOD: true;
  gainers: MarketHighlightItem[];
  losers: MarketHighlightItem[];
  mostActive: MarketHighlightItem[];
}

export const MarketHighlightsService = {
  /**
   * Build highlights directly from HistoricalDataRepository (Server / Node.js tests)
   */
  buildFromRepository(exchange: Exchange = 'NSE', limit = 5): MarketHighlightsResponse {
    const stats = SecurityMaster.getStats();
    const catalogueCount = exchange === 'NSE' ? stats.nseCount : stats.bseCount;
    const safeLimit = Math.max(1, Math.min(25, Math.floor(limit) || 5));

    const { latestDate, rows } = HistoricalDataRepository.getLatestSessionHighlightsRaw(exchange);

    if (!latestDate || rows.length === 0) {
      return {
        exchange,
        catalogueCount,
        latestDate: null,
        previousDate: null,
        evaluatedCount: 0,
        isHistoricalEOD: true,
        gainers: [],
        losers: [],
        mostActive: [],
      };
    }

    const prevDateCounts = new Map<string, number>();

    const items: MarketHighlightItem[] = rows.map((row) => {
      const secMeta = SecurityMaster.getBySymbol(row.symbol, exchange);
      const name = secMeta?.name || row.companyName || row.symbol;
      const sector = secMeta?.sector || 'Diversified';

      let dailyChange: number | null = null;
      let dailyChangePercent: number | null = null;

      if (row.prevSessionClose !== null && row.prevSessionClose > 0) {
        dailyChange = Number((row.closePrice - row.prevSessionClose).toFixed(2));
        dailyChangePercent = Number(
          (((row.closePrice - row.prevSessionClose) / row.prevSessionClose) * 100).toFixed(2)
        );
      }

      if (row.prevSessionDate) {
        prevDateCounts.set(row.prevSessionDate, (prevDateCounts.get(row.prevSessionDate) || 0) + 1);
      }

      return {
        exchange: row.exchange,
        symbol: row.symbol,
        name,
        sector,
        tradeDate: row.tradeDate,
        prevTradeDate: row.prevSessionDate,
        closePrice: row.closePrice,
        prevClosePrice: row.prevSessionClose,
        dailyChange,
        dailyChangePercent,
        volume: row.volume,
        dataSource: row.dataSource,
      };
    });

    // Pick the primary previous trading session date across evaluated equities
    let previousDate: string | null = null;
    let maxPrevCount = -1;
    for (const [dt, count] of prevDateCounts.entries()) {
      if (count > maxPrevCount || (count === maxPrevCount && previousDate && dt > previousDate)) {
        maxPrevCount = count;
        previousDate = dt;
      }
    }

    // Top Gainers: highest positive daily % change (descending)
    const gainers = items
      .filter((item) => item.dailyChangePercent !== null && item.dailyChangePercent > 0)
      .sort((a, b) => {
        const diff = (b.dailyChangePercent ?? 0) - (a.dailyChangePercent ?? 0);
        return diff !== 0 ? diff : b.volume - a.volume;
      })
      .slice(0, safeLimit);

    // Top Losers: largest negative daily % change (ascending, i.e., most negative first)
    const losers = items
      .filter((item) => item.dailyChangePercent !== null && item.dailyChangePercent < 0)
      .sort((a, b) => {
        const diff = (a.dailyChangePercent ?? 0) - (b.dailyChangePercent ?? 0);
        return diff !== 0 ? diff : b.volume - a.volume;
      })
      .slice(0, safeLimit);

    // Most Active: highest trading volume in the latest available session (descending)
    const mostActive = items
      .filter((item) => item.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, safeLimit);

    return {
      exchange,
      catalogueCount,
      latestDate,
      previousDate,
      evaluatedCount: items.length,
      isHistoricalEOD: true,
      gainers,
      losers,
      mostActive,
    };
  },

  /**
   * Fetch genuine EOD market highlights from the Node/SQLite backend API (Browser runtime)
   */
  async fetchMarketHighlights(
    exchange: Exchange = 'NSE',
    limit = 5,
    signal?: AbortSignal
  ): Promise<MarketHighlightsResponse> {
    const params = new URLSearchParams({
      exchange,
      limit: String(limit),
    });

    const response = await fetch(`/api/market/highlights?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      let message = `Unable to load ${exchange} market highlights (HTTP ${response.status}).`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch {
        // Keep default message
      }
      throw new Error(message);
    }

    return (await response.json()) as MarketHighlightsResponse;
  },
};
