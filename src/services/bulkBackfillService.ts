/**
 * Large-Scale Historical NSE & BSE Bulk Backfill & Coverage Engine
 * 
 * Capstone Project: Intelligent NSE-BSE Market Analyzer
 * Strictly Genuine EOD Bhavcopy Data • Zero Synthetic Price Fabrication
 */

import { Exchange } from '../types/market';
import { NormalizedOHLCVRecord, ImportBatchSummary } from '../types/marketDataEngine';
import { HistoricalDataRepository } from './historicalDataRepository';
import { DataValidationService } from './dataValidationService';
import { SecurityMaster } from './securityMaster';

export interface BackfillBatchProgress {
  source: string;
  totalTargetSecurities: number;
  processedSecurities: number;
  successfulSecurities: number;
  failedSecurities: number;
  totalRecordsInserted: number;
  skippedDuplicates: number;
  durationMs: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  lastProcessedSymbol?: string;
  errorMessage?: string;
}

export interface DetailedCoverageReport {
  timestamp: string;
  totalCatalogueSecurities: number;
  totalNSECatalogue: number;
  totalBSECatalogue: number;
  totalDualListed: number;
  totalBSEOnly: number;
  totalBSESME: number;

  // NSE Bins
  nse: {
    total: number;
    withAtLeast1: number;
    withAtLeast30: number;
    withAtLeast90: number;
    withAtLeast252: number;
    withAtLeast500: number;
    withAtLeast700: number;
    zeroSessions: number;
    coveragePct: number;
  };

  // BSE Bins
  bse: {
    total: number;
    withAtLeast1: number;
    withAtLeast30: number;
    withAtLeast90: number;
    withAtLeast252: number;
    withAtLeast500: number;
    withAtLeast700: number;
    zeroSessions: number;
    coveragePct: number;
  };

  // Segments
  bseOnlyWithData: number;
  bseOnlyTotal: number;
  bseSMEWithData: number;
  bseSMETotal: number;
  dualListedWithData: number;
  dualListedTotal: number;

  // Breakdown by Year & Source
  yearCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  totalDatabaseRecords: number;
  totalDatabaseSizeBytes: number;
}

export class BulkBackfillService {
  private static progress: BackfillBatchProgress = {
    source: 'IDLE',
    totalTargetSecurities: 0,
    processedSecurities: 0,
    successfulSecurities: 0,
    failedSecurities: 0,
    totalRecordsInserted: 0,
    skippedDuplicates: 0,
    durationMs: 0,
    status: 'IDLE'
  };

  /**
   * Get current progress of the bulk backfill
   */
  static getProgress(): BackfillBatchProgress {
    return { ...this.progress };
  }

  /**
   * Generate comprehensive, empirical coverage report directly from SQLite database
   */
  static generateCoverageReport(): DetailedCoverageReport {
    HistoricalDataRepository.initialize();

    const catalogue = SecurityMaster.getAll();
    const nseCatalogue = catalogue.filter(c => c.exchange === 'NSE');
    const bseCatalogue = catalogue.filter(c => c.exchange === 'BSE');
    const dualListed = catalogue.filter(c => c.isDualListed);
    const bseOnly = catalogue.filter(c => c.exchange === 'BSE' && !c.isDualListed);
    const bseSme = catalogue.filter(c => c.category === 'SME');

    // Query session counts per security from SQLite
    const nseSessionMap = new Map<string, number>();
    const bseSessionMap = new Map<string, number>();
    const yearCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let totalRecords = 0;

    const db = (HistoricalDataRepository as any).sqliteDb;

    if (db) {
      try {
        // NSE sessions
        const nseRows = db.prepare(`
          SELECT symbol, COUNT(*) as cnt 
          FROM daily_ohlcv 
          WHERE exchange = 'NSE' 
          GROUP BY symbol
        `).all() as any[];
        for (const r of nseRows) {
          nseSessionMap.set(r.symbol.toUpperCase(), r.cnt);
        }

        // BSE sessions
        const bseRows = db.prepare(`
          SELECT symbol, COUNT(*) as cnt 
          FROM daily_ohlcv 
          WHERE exchange = 'BSE' 
          GROUP BY symbol
        `).all() as any[];
        for (const r of bseRows) {
          bseSessionMap.set(r.symbol.toUpperCase(), r.cnt);
        }

        // Year breakdown
        const yRows = db.prepare(`
          SELECT substr(trade_date, 1, 4) as yr, COUNT(*) as cnt 
          FROM daily_ohlcv 
          GROUP BY yr
        `).all() as any[];
        for (const r of yRows) {
          yearCounts[r.yr] = r.cnt;
        }

        // Source breakdown
        const sRows = db.prepare(`
          SELECT data_source, COUNT(*) as cnt 
          FROM daily_ohlcv 
          GROUP BY data_source
        `).all() as any[];
        for (const r of sRows) {
          sourceCounts[r.data_source] = r.cnt;
        }

        const totalRow = db.prepare('SELECT COUNT(*) as cnt FROM daily_ohlcv').get() as any;
        totalRecords = totalRow?.cnt || 0;
      } catch (err) {
        console.warn('Coverage report query error:', err);
      }
    }

    // Bin calculations for NSE
    let nse1 = 0, nse30 = 0, nse90 = 0, nse252 = 0, nse500 = 0, nse700 = 0, nse0 = 0;
    for (const sec of nseCatalogue) {
      const count = nseSessionMap.get(sec.symbol.toUpperCase()) || 0;
      if (count >= 1) nse1++;
      if (count >= 30) nse30++;
      if (count >= 90) nse90++;
      if (count >= 252) nse252++;
      if (count >= 500) nse500++;
      if (count >= 700) nse700++;
      if (count === 0) nse0++;
    }

    // Bin calculations for BSE
    let bse1 = 0, bse30 = 0, bse90 = 0, bse252 = 0, bse500 = 0, bse700 = 0, bse0 = 0;
    for (const sec of bseCatalogue) {
      const count = bseSessionMap.get(sec.symbol.toUpperCase()) || 0;
      if (count >= 1) bse1++;
      if (count >= 30) bse30++;
      if (count >= 90) bse90++;
      if (count >= 252) bse252++;
      if (count >= 500) bse500++;
      if (count >= 700) bse700++;
      if (count === 0) bse0++;
    }

    // Segment stats
    let bseOnlyWithData = 0;
    for (const sec of bseOnly) {
      if ((bseSessionMap.get(sec.symbol.toUpperCase()) || 0) > 0) bseOnlyWithData++;
    }

    let bseSMEWithData = 0;
    for (const sec of bseSme) {
      if ((bseSessionMap.get(sec.symbol.toUpperCase()) || 0) > 0) bseSMEWithData++;
    }

    let dualWithData = 0;
    for (const sec of dualListed) {
      const hasNse = (nseSessionMap.get(sec.symbol.toUpperCase()) || 0) > 0;
      const hasBse = (bseSessionMap.get(sec.symbol.toUpperCase()) || 0) > 0;
      if (hasNse || hasBse) dualWithData++;
    }

    let dbSizeBytes = 0;
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const getBuiltin = (process as any).getBuiltinModule;
        const fs = typeof getBuiltin === 'function' ? getBuiltin('node:fs') : (typeof require !== 'undefined' ? require('node:fs') : null);
        if (fs && fs.existsSync('data/market_history.db')) {
          dbSizeBytes = fs.statSync('data/market_history.db').size;
        }
      } catch {}
    }

    return {
      timestamp: new Date().toISOString(),
      totalCatalogueSecurities: catalogue.length,
      totalNSECatalogue: nseCatalogue.length,
      totalBSECatalogue: bseCatalogue.length,
      totalDualListed: dualListed.length,
      totalBSEOnly: bseOnly.length,
      totalBSESME: bseSme.length,
      nse: {
        total: nseCatalogue.length,
        withAtLeast1: nse1,
        withAtLeast30: nse30,
        withAtLeast90: nse90,
        withAtLeast252: nse252,
        withAtLeast500: nse500,
        withAtLeast700: nse700,
        zeroSessions: nse0,
        coveragePct: Number(((nse1 / (nseCatalogue.length || 1)) * 100).toFixed(2))
      },
      bse: {
        total: bseCatalogue.length,
        withAtLeast1: bse1,
        withAtLeast30: bse30,
        withAtLeast90: bse90,
        withAtLeast252: bse252,
        withAtLeast500: bse500,
        withAtLeast700: bse700,
        zeroSessions: bse0,
        coveragePct: Number(((bse1 / (bseCatalogue.length || 1)) * 100).toFixed(2))
      },
      bseOnlyWithData,
      bseOnlyTotal: bseOnly.length,
      bseSMEWithData,
      bseSMETotal: bseSme.length,
      dualListedWithData: Math.floor(dualWithData / 2),
      dualListedTotal: Math.floor(dualListed.length / 2),
      yearCounts,
      sourceCounts,
      totalDatabaseRecords: totalRecords,
      totalDatabaseSizeBytes: dbSizeBytes
    };
  }

  /**
   * Export database records to CSV string for academic analysis
   */
  static exportToCSV(filter?: {
    exchange?: Exchange | 'ALL';
    symbol?: string;
    isin?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): string {
    HistoricalDataRepository.initialize();
    const db = (HistoricalDataRepository as any).sqliteDb;
    if (!db) return 'No database connection available';

    let query = `
      SELECT 
        exchange, symbol, scrip_code, isin, company_name, series,
        trade_date, open_price, high_price, low_price, close_price,
        prev_close, volume, turnover, trades_count, data_source, is_eod
      FROM daily_ohlcv
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.exchange && filter.exchange !== 'ALL') {
      query += ' AND exchange = ?';
      params.push(filter.exchange);
    }
    if (filter?.symbol) {
      query += ' AND symbol = ?';
      params.push(filter.symbol.trim().toUpperCase());
    }
    if (filter?.isin) {
      query += ' AND isin = ?';
      params.push(filter.isin.trim().toUpperCase());
    }
    if (filter?.fromDate) {
      query += ' AND trade_date >= ?';
      params.push(filter.fromDate);
    }
    if (filter?.toDate) {
      query += ' AND trade_date <= ?';
      params.push(filter.toDate);
    }

    query += ' ORDER BY exchange, symbol, trade_date ASC';
    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    try {
      const rows = db.prepare(query).all(...params) as any[];
      if (rows.length === 0) return 'No records match filter criteria';

      const headers = [
        'Exchange', 'Symbol', 'ScripCode', 'ISIN', 'CompanyName', 'Series',
        'TradeDate', 'Open', 'High', 'Low', 'Close', 'PrevClose',
        'Volume', 'Turnover', 'TradesCount', 'DataSource', 'IsEOD'
      ];

      const csvLines = [headers.join(',')];
      for (const r of rows) {
        csvLines.push([
          r.exchange,
          r.symbol,
          r.scrip_code || '',
          r.isin || '',
          `"${(r.company_name || '').replace(/"/g, '""')}"`,
          r.series || '',
          r.trade_date,
          r.open_price,
          r.high_price,
          r.low_price,
          r.close_price,
          r.prev_close || '',
          r.volume,
          r.turnover || '',
          r.trades_count || '',
          r.data_source,
          r.is_eod
        ].join(','));
      }

      return csvLines.join('\n');
    } catch (err: any) {
      return `CSV Export Error: ${err.message}`;
    }
  }
}
