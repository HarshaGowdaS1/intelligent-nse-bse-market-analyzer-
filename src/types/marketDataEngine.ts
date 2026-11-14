/**
 * Type Definitions for Unified Market Data Engine
 * Capstone Project: Intelligent NSE-BSE Market Analyzer
 * Strictly Real EOD Exchange Data • Zero Synthetic Price Fabrication
 */

import { Exchange, CandleData } from './market';

export type MarketDataSource = 
  | 'BSE_UDIFF_OFFICIAL' 
  | 'BSE_LEGACY_ZIP' 
  | 'TEJHQ_NSE_EOD' 
  | 'OFFICIAL_EXCHANGE_ARCHIVE';

export interface NormalizedOHLCVRecord {
  exchange: Exchange;
  symbol: string;
  scripCode?: string;
  isin?: string;
  companyName?: string;
  series?: string;
  tradeDate: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose?: number;
  volume: number;
  turnover?: number;
  tradesCount?: number;
  dataSource: MarketDataSource;
  ingestedAt: string;
  isEOD: boolean;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  record?: NormalizedOHLCVRecord;
}

export interface ImportBatchSummary {
  jobId: string;
  source: MarketDataSource;
  dateStr: string;
  totalRecordsInFile: number;
  validRecords: number;
  insertedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  durationMs: number;
  timestamp: string;
}

export interface SecurityCoverageInfo {
  exchange: Exchange;
  symbol: string;
  companyName: string;
  isin: string;
  scripCode?: string;
  category?: string;
  hasHistoricalData: boolean;
  earliestDate?: string;
  latestDate?: string;
  sessionCount: number;
  dataSource?: MarketDataSource;
}

export interface SystemCoverageAuditResult {
  auditTimestamp: string;
  totalCatalogueEntries: number;
  totalNSEEntries: number;
  totalBSEEntries: number;
  totalDualListed: number;
  totalSMEEntries: number;
  
  // Historical session thresholds
  securitiesWithAtLeast1Session: number;
  securitiesWithAtLeast30Sessions: number;
  securitiesWithAtLeast90Sessions: number;
  securitiesWithAtLeast252Sessions: number;
  securitiesWithZeroSessions: number;

  // Percentage coverage
  overallCoveragePct: number;
  nseCoveragePct: number;
  bseCoveragePct: number;
  bseOnlyCoveragePct: number;
  smeCoveragePct: number;
}
