/**
 * NSE Market Highlights Test Suite
 * Validates:
 * 1. Latest available session selection (excludes stale earlier-date symbols)
 * 2. Accurate daily change and daily percentage change from previous available session close
 * 3. Strict sorting order for Top Gainers (desc %), Top Losers (asc %), Most Active (desc volume)
 * 4. Exchange isolation (NSE vs BSE)
 * 5. Graceful empty / single-session handling with zero fabricated prices
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { HistoricalDataRepository } from '../src/services/historicalDataRepository';
import { MarketHighlightsService } from '../src/services/marketHighlightsService';
import { NormalizedOHLCVRecord } from '../src/types/marketDataEngine';

function makeRecord(
  partial: Partial<NormalizedOHLCVRecord> & {
    symbol: string;
    tradeDate: string;
    close: number;
    volume: number;
  }
): NormalizedOHLCVRecord {
  return {
    exchange: partial.exchange ?? 'NSE',
    symbol: partial.symbol,
    companyName: partial.companyName,
    tradeDate: partial.tradeDate,
    open: partial.open ?? partial.close,
    high: partial.high ?? partial.close,
    low: partial.low ?? partial.close,
    close: partial.close,
    volume: partial.volume,
    dataSource: partial.dataSource ?? 'TEJHQ_NSE_EOD',
    ingestedAt: partial.ingestedAt ?? '2026-11-10T00:00:00.000Z',
    isEOD: true,
  };
}

describe('NSE Market Highlights Service (Isolated SQLite)', () => {
  before(() => {
    HistoricalDataRepository.initialize('data/test_market_highlights.db');
  });

  after(() => {
    HistoricalDataRepository.clear();
    HistoricalDataRepository.initialize('data/market_history.db');
  });

  beforeEach(() => {
    HistoricalDataRepository.clear();
  });

  test('computes gainers, losers, and most active from latest session vs previous available session', () => {
    HistoricalDataRepository.saveRecords([
      // Previous session (2026-11-06)
      makeRecord({ symbol: 'RELIANCE', tradeDate: '2026-11-06', close: 1000, volume: 5000000 }),
      makeRecord({ symbol: 'TCS', tradeDate: '2026-11-06', close: 4000, volume: 2000000 }),
      makeRecord({ symbol: 'INFY', tradeDate: '2026-11-06', close: 2000, volume: 3000000 }),
      makeRecord({ symbol: 'HDFCBANK', tradeDate: '2026-11-06', close: 1500, volume: 8000000 }),
      makeRecord({ symbol: 'IDEA', tradeDate: '2026-11-06', close: 10, volume: 100000000 }),

      // Latest session (2026-11-09)
      // RELIANCE: +10.00% (+100)
      makeRecord({ symbol: 'RELIANCE', tradeDate: '2026-11-09', close: 1100, volume: 9000000 }),
      // TCS: +2.50% (+100)
      makeRecord({ symbol: 'TCS', tradeDate: '2026-11-09', close: 4100, volume: 2500000 }),
      // INFY: -5.00% (-100)
      makeRecord({ symbol: 'INFY', tradeDate: '2026-11-09', close: 1900, volume: 4000000 }),
      // HDFCBANK: -2.00% (-30)
      makeRecord({ symbol: 'HDFCBANK', tradeDate: '2026-11-09', close: 1470, volume: 12000000 }),
      // IDEA: 0.00% (unchanged), highest volume
      makeRecord({ symbol: 'IDEA', tradeDate: '2026-11-09', close: 10, volume: 150000000 }),

      // Stale symbol from 2026-10-01 — must NOT appear on 2026-11-09
      makeRecord({ symbol: 'WIPRO', tradeDate: '2026-09-30', close: 300, volume: 1000000 }),
      makeRecord({ symbol: 'WIPRO', tradeDate: '2026-10-01', close: 450, volume: 999999999 }),

      // BSE record on 2026-11-09 — must stay isolated from NSE
      makeRecord({
        exchange: 'BSE',
        symbol: 'RELIANCE',
        tradeDate: '2026-11-06',
        close: 1000,
        volume: 100000,
        dataSource: 'BSE_UDIFF_OFFICIAL',
      }),
      makeRecord({
        exchange: 'BSE',
        symbol: 'RELIANCE',
        tradeDate: '2026-11-09',
        close: 1200,
        volume: 200000,
        dataSource: 'BSE_UDIFF_OFFICIAL',
      }),
    ]);

    const res = MarketHighlightsService.buildFromRepository('NSE', 5);

    assert.equal(res.exchange, 'NSE');
    assert.equal(res.catalogueCount, 2632);
    assert.equal(res.latestDate, '2026-11-09');
    assert.equal(res.previousDate, '2026-11-06');
    assert.equal(res.isHistoricalEOD, true);
    assert.equal(res.evaluatedCount, 5); // WIPRO excluded, BSE RELIANCE excluded

    // Top Gainers sorted descending
    assert.deepEqual(
      res.gainers.map((g) => g.symbol),
      ['RELIANCE', 'TCS']
    );
    assert.equal(res.gainers[0].dailyChange, 100);
    assert.equal(res.gainers[0].dailyChangePercent, 10);
    assert.equal(res.gainers[1].dailyChangePercent, 2.5);

    // Top Losers sorted ascending (most negative first)
    assert.deepEqual(
      res.losers.map((l) => l.symbol),
      ['INFY', 'HDFCBANK']
    );
    assert.equal(res.losers[0].dailyChange, -100);
    assert.equal(res.losers[0].dailyChangePercent, -5);
    assert.equal(res.losers[1].dailyChange, -30);
    assert.equal(res.losers[1].dailyChangePercent, -2);

    // Most Active sorted descending by volume
    assert.deepEqual(
      res.mostActive.map((a) => a.symbol),
      ['IDEA', 'HDFCBANK', 'RELIANCE', 'INFY', 'TCS']
    );
    assert.equal(res.mostActive[0].volume, 150000000);
  });

  test('handles empty repository cleanly without fabricating stocks', () => {
    const res = MarketHighlightsService.buildFromRepository('NSE', 5);
    assert.equal(res.latestDate, null);
    assert.equal(res.evaluatedCount, 0);
    assert.equal(res.gainers.length, 0);
    assert.equal(res.losers.length, 0);
    assert.equal(res.mostActive.length, 0);
  });

  test('handles single-session equity without previous close gracefully', () => {
    HistoricalDataRepository.saveRecords([
      makeRecord({ symbol: 'SUZLON', tradeDate: '2026-11-09', close: 65.5, volume: 42000000 }),
    ]);

    const res = MarketHighlightsService.buildFromRepository('NSE', 5);
    assert.equal(res.latestDate, '2026-11-09');
    assert.equal(res.gainers.length, 0);
    assert.equal(res.losers.length, 0);
    assert.equal(res.mostActive.length, 1);
    assert.equal(res.mostActive[0].symbol, 'SUZLON');
    assert.equal(res.mostActive[0].dailyChange, null);
    assert.equal(res.mostActive[0].dailyChangePercent, null);
  });
});

describe('NSE Market Highlights Production Read-Only Check', () => {
  test('reads genuine EOD NSE data from production database without modifying records', () => {
    HistoricalDataRepository.initialize('data/market_history.db');
    const res = MarketHighlightsService.buildFromRepository('NSE', 5);

    assert.equal(res.exchange, 'NSE');
    assert.equal(res.isHistoricalEOD, true);
    assert.equal(res.catalogueCount, 2632);
    assert.ok(res.latestDate !== null);
    assert.ok(res.gainers.length > 0);
    assert.ok(res.losers.length > 0);
    assert.ok(res.mostActive.length > 0);

    // Verify sorting invariants
    for (let i = 1; i < res.gainers.length; i++) {
      assert.ok((res.gainers[i - 1].dailyChangePercent ?? 0) >= (res.gainers[i].dailyChangePercent ?? 0));
    }
    for (let i = 1; i < res.losers.length; i++) {
      assert.ok((res.losers[i - 1].dailyChangePercent ?? 0) <= (res.losers[i].dailyChangePercent ?? 0));
    }
    for (let i = 1; i < res.mostActive.length; i++) {
      assert.ok(res.mostActive[i - 1].volume >= res.mostActive[i].volume);
    }
  });
});
