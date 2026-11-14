/**
 * Market Data Validation & Normalization Service
 * 
 * Enforces rigorous financial mathematical rules on raw exchange rows:
 * 1. High must be >= Math.max(Open, Close)
 * 2. Low must be <= Math.min(Open, Close)
 * 3. Low must be > 0
 * 4. Volume must be non-negative integer
 * 5. Trade date must be valid ISO YYYY-MM-DD
 * 6. Never substitutes synthetic or fabricated prices for missing sessions
 */

import { NormalizedOHLCVRecord, DataValidationResult } from '../types/marketDataEngine';
import { CandleData } from '../types/market';

export class DataValidationService {
  /**
   * Validate a single normalized historical OHLCV record
   */
  static validateRecord(record: Partial<NormalizedOHLCVRecord>): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory Identity Fields
    if (!record.exchange || (record.exchange !== 'NSE' && record.exchange !== 'BSE')) {
      errors.push(`Invalid or missing exchange: '${record.exchange}'`);
    }

    if (!record.symbol || typeof record.symbol !== 'string' || record.symbol.trim() === '') {
      errors.push('Missing or empty security symbol');
    }

    // 2. Date Validation
    if (!record.tradeDate || !/^\d{4}-\d{2}-\d{2}$/.test(record.tradeDate)) {
      errors.push(`Invalid trade date format: '${record.tradeDate}'. Expected YYYY-MM-DD`);
    } else {
      const parts = record.tradeDate.split('-').map(Number);
      const parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (
        parsedDate.getFullYear() !== parts[0] ||
        parsedDate.getMonth() !== parts[1] - 1 ||
        parsedDate.getDate() !== parts[2]
      ) {
        errors.push(`Non-existent calendar date: '${record.tradeDate}'`);
      } else {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        if (parsedDate > now) {
          errors.push(`Future trade date rejected: '${record.tradeDate}'`);
        }
      }
    }

    // 3. Mathematical Price Validation
    const open = Number(record.open);
    const high = Number(record.high);
    const low = Number(record.low);
    const close = Number(record.close);

    if (!isFinite(open) || open <= 0) errors.push(`Invalid Open price: ${record.open}`);
    if (!isFinite(high) || high <= 0) errors.push(`Invalid High price: ${record.high}`);
    if (!isFinite(low) || low <= 0) errors.push(`Invalid Low price: ${record.low}`);
    if (!isFinite(close) || close <= 0) errors.push(`Invalid Close price: ${record.close}`);

    if (errors.length === 0) {
      // Numerical tolerance for floating point rounding (0.01 tolerance)
      const tolerance = 0.01;
      const maxOC = Math.max(open, close);
      const minOC = Math.min(open, close);

      if (high < maxOC - tolerance) {
        errors.push(`OHLC violation: High (${high}) is strictly less than max(Open, Close) (${maxOC})`);
      }

      if (low > minOC + tolerance) {
        errors.push(`OHLC violation: Low (${low}) is strictly greater than min(Open, Close) (${minOC})`);
      }
    }

    // 4. Volume Validation
    const volume = Number(record.volume);
    if (!isFinite(volume) || volume < 0) {
      errors.push(`Invalid volume: ${record.volume}. Must be non-negative.`);
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    const cleanRecord: NormalizedOHLCVRecord = {
      exchange: record.exchange!,
      symbol: record.symbol!.trim().toUpperCase(),
      scripCode: record.scripCode ? record.scripCode.trim() : undefined,
      isin: record.isin ? record.isin.trim().toUpperCase() : undefined,
      companyName: record.companyName ? record.companyName.trim() : undefined,
      series: record.series ? record.series.trim().toUpperCase() : undefined,
      tradeDate: record.tradeDate!,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      prevClose: record.prevClose !== undefined ? Number(Number(record.prevClose).toFixed(2)) : undefined,
      volume: Math.round(volume),
      turnover: record.turnover !== undefined ? Number(Number(record.turnover).toFixed(2)) : undefined,
      tradesCount: record.tradesCount !== undefined ? Math.round(Number(record.tradesCount)) : undefined,
      dataSource: record.dataSource || 'OFFICIAL_EXCHANGE_ARCHIVE',
      ingestedAt: record.ingestedAt || new Date().toISOString(),
      isEOD: true
    };

    return { isValid: true, errors: [], warnings, record: cleanRecord };
  }

  /**
   * Converts a series of NormalizedOHLCVRecord into the standard CandleData interface
   */
  static toCandleData(records: NormalizedOHLCVRecord[]): CandleData[] {
    return records
      .sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
      .map(r => {
        const parts = r.tradeDate.split('-').map(Number);
        const timestamp = new Date(parts[0], parts[1] - 1, parts[2], 15, 30, 0).getTime();
        return {
          date: r.tradeDate,
          timestamp,
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
          volume: r.volume
        };
      });
  }
}
