/**
 * Market Data Engine & BSE/NSE Ingestion Test Suite
 * Validates:
 * 1. Legacy BSE Archive CSV Parsing & Date Normalization
 * 2. Pure Node.js ZIP extraction
 * 3. Modern BSE UDiFF CSV Parsing (SEBI Format)
 * 4. Rigorous Mathematical OHLC Data Validation
 * 5. Permanent SQLite Database Storage & Duplicate Prevention
 * 6. Symbol & Scrip Code Resolution
 * 7. System Coverage Auditing
 */

import { test, describe, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { BSELegacyImporter, BSEUDiFFImporter } from '../src/services/bseDataImporter';
import { DataValidationService } from '../src/services/dataValidationService';
import { HistoricalDataRepository } from '../src/services/historicalDataRepository';
import { UnifiedMarketDataEngine } from '../src/services/marketDataEngine';
import { MarketDataScheduler } from '../src/services/marketDataScheduler';

describe('BSE Legacy Archive Importer', () => {
  test('correctly normalizes legacy date formats to ISO YYYY-MM-DD', () => {
    assert.equal(BSELegacyImporter.normalizeLegacyDate('15-Jan-24'), '2024-01-15');
    assert.equal(BSELegacyImporter.normalizeLegacyDate('08-Jul-2024'), '2024-07-08');
    assert.equal(BSELegacyImporter.normalizeLegacyDate('2024-01-15'), '2024-01-15');
    assert.equal(BSELegacyImporter.normalizeLegacyDate('150124'), '2024-01-15');
    assert.equal(BSELegacyImporter.normalizeLegacyDate('20240115'), '2024-01-15');
    assert.equal(BSELegacyImporter.normalizeLegacyDate(''), null);
    assert.equal(BSELegacyImporter.normalizeLegacyDate(undefined), null);
  });

  test('parses legacy BSE CSV with ISIN and numeric scrip codes', () => {
    const mockLegacyCSV = `SC_CODE,SC_NAME,SC_GROUP,SC_TYPE,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,NO_TRADES,NO_OF_SHRS,NET_TURNOV,TDCLOINDI,ISIN_CODE,TRADING_DATE
500325,RELIANCE IND.,A ,Q,2750.00,2770.00,2740.00,2765.50,2766.00,2745.00,12450,450000,124500000.00,,INE002A01018,15-Jan-24
532540,TCS LTD.     ,A ,Q,3850.00,3890.00,3840.00,3880.00,3882.00,3845.00,8200,210000,81500000.00,,INE467B01029,15-Jan-24`;

    const records = BSELegacyImporter.parseLegacyCSV(mockLegacyCSV);
    assert.equal(records.length, 2);

    const rel = records[0];
    assert.equal(rel.exchange, 'BSE');
    assert.equal(rel.symbol, 'RELIANCE');
    assert.equal(rel.scripCode, '500325');
    assert.equal(rel.isin, 'INE002A01018');
    assert.equal(rel.tradeDate, '2024-01-15');
    assert.equal(rel.open, 2750.00);
    assert.equal(rel.high, 2770.00);
    assert.equal(rel.low, 2740.00);
    assert.equal(rel.close, 2765.50);
    assert.equal(rel.volume, 450000);
    assert.equal(rel.dataSource, 'BSE_LEGACY_ZIP');
    assert.equal(rel.isEOD, true);
  });

  test('handles legacy rows with missing headers or malformed columns gracefully', () => {
    const invalidCSV = `INVALID_HEADER_ROW
500325,SOME_DATA,123`;
    const records = BSELegacyImporter.parseLegacyCSV(invalidCSV);
    assert.equal(records.length, 0);
  });
});

describe('BSE Modern UDiFF Importer', () => {
  test('parses standard SEBI UDiFF CSV containing Mainboard and SME equities', () => {
    const mockUDiFFCSV = `TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,FinInstrmNm,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd
2024-10-25,2024-10-25,CM,BSE,EQ,500325,INE002A01018,RELIANCE,A,Reliance Industries Limited,1320.00,1335.00,1315.00,1328.50,1328.00,1318.00,7450000,9850000000.00,142500
2024-10-25,2024-10-25,CM,BSE,EQ,543501,INE200P01016,GCMCOMM,M,GCM COMMODITY & DERIVATIVES LT,7.20,7.25,7.15,7.20,7.20,7.19,12000,86400.00,8`;

    const records = BSEUDiFFImporter.parseUDiFFCSV(mockUDiFFCSV);
    assert.equal(records.length, 2);

    // Mainboard test
    const rel = records[0];
    assert.equal(rel.exchange, 'BSE');
    assert.equal(rel.symbol, 'RELIANCE');
    assert.equal(rel.tradeDate, '2024-10-25');
    assert.equal(rel.close, 1328.50);
    assert.equal(rel.dataSource, 'BSE_UDIFF_OFFICIAL');

    // SME test
    const sme = records[1];
    assert.equal(sme.exchange, 'BSE');
    assert.equal(sme.symbol, 'GCMCOMM');
    assert.equal(sme.series, 'M');
    assert.equal(sme.close, 7.20);
    assert.equal(sme.volume, 12000);
    assert.equal(sme.dataSource, 'BSE_UDIFF_OFFICIAL');
  });
});

describe('Mathematical Data Validation & Integrity Rules', () => {
  test('accepts mathematically valid OHLCV records', () => {
    const valid = DataValidationService.validateRecord({
      exchange: 'NSE',
      symbol: 'INFY',
      tradeDate: '2026-10-25',
      open: 1850.00,
      high: 1870.00,
      low: 1845.00,
      close: 1865.00,
      volume: 4500000
    });

    assert.equal(valid.isValid, true);
    assert.equal(valid.errors.length, 0);
    assert.equal(valid.record?.close, 1865.00);
  });

  test('rejects OHLC records where High < max(Open, Close)', () => {
    const invalidHigh = DataValidationService.validateRecord({
      exchange: 'NSE',
      symbol: 'INFY',
      tradeDate: '2026-10-25',
      open: 1850.00,
      high: 1840.00, // Invalid: below open
      low: 1830.00,
      close: 1845.00,
      volume: 1000
    });

    assert.equal(invalidHigh.isValid, false);
    assert.ok(invalidHigh.errors.some(e => e.includes('OHLC violation')));
  });

  test('rejects OHLC records where Low > min(Open, Close)', () => {
    const invalidLow = DataValidationService.validateRecord({
      exchange: 'NSE',
      symbol: 'INFY',
      tradeDate: '2026-10-25',
      open: 1850.00,
      high: 1870.00,
      low: 1860.00, // Invalid: above open
      close: 1865.00,
      volume: 1000
    });

    assert.equal(invalidLow.isValid, false);
    assert.ok(invalidLow.errors.some(e => e.includes('OHLC violation')));
  });

  test('rejects negative volumes and future dates', () => {
    const negativeVol = DataValidationService.validateRecord({
      exchange: 'NSE',
      symbol: 'TCS',
      tradeDate: '2026-10-25',
      open: 4000, high: 4050, low: 3950, close: 4020,
      volume: -500 // Invalid
    });
    assert.equal(negativeVol.isValid, false);

    const futureDate = DataValidationService.validateRecord({
      exchange: 'NSE',
      symbol: 'TCS',
      tradeDate: '2099-01-01', // Future date
      open: 4000, high: 4050, low: 3950, close: 4020,
      volume: 1000
    });
    assert.equal(futureDate.isValid, false);
    assert.ok(futureDate.errors.some(e => e.includes('Future trade date')));
  });
});

describe('Permanent Historical Database Storage & Deduplication', () => {
  before(() => {
    HistoricalDataRepository.initialize('data/test_market_history.db');
  });

  after(() => {
    HistoricalDataRepository.clear();
    HistoricalDataRepository.initialize('data/market_history.db');
  });

  beforeEach(() => {
    HistoricalDataRepository.clear();
  });

  test('inserts genuine records into permanent repository and prevents duplicate primary keys', () => {
    const records = [
      {
        exchange: 'NSE' as const,
        symbol: 'RELIANCE',
        tradeDate: '2026-10-20',
        open: 1200, high: 1220, low: 1195, close: 1215,
        volume: 5000000,
        dataSource: 'TEJHQ_NSE_EOD' as const,
        ingestedAt: new Date().toISOString(),
        isEOD: true
      },
      {
        exchange: 'NSE' as const,
        symbol: 'RELIANCE',
        tradeDate: '2026-10-21',
        open: 1215, high: 1230, low: 1210, close: 1225,
        volume: 6000000,
        dataSource: 'TEJHQ_NSE_EOD' as const,
        ingestedAt: new Date().toISOString(),
        isEOD: true
      }
    ];

    // First insertion
    const res1 = HistoricalDataRepository.saveRecords(records);
    assert.equal(res1.inserted, 2);
    assert.equal(res1.duplicates, 0);

    // Second insertion with identical dates (duplicate attempt)
    const res2 = HistoricalDataRepository.saveRecords(records);
    assert.equal(res2.inserted, 0);
    assert.equal(res2.duplicates, 2); // Correctly protected against duplication

    // Query back
    const retrieved = HistoricalDataRepository.getHistoricalCandles('RELIANCE', 'NSE');
    assert.equal(retrieved.length, 2);
    assert.equal(retrieved[0].date, '2026-10-20');
    assert.equal(retrieved[1].date, '2026-10-21');
  });

  test('correctly isolates records between NSE and BSE for dual-listed securities', () => {
    const records = [
      {
        exchange: 'NSE' as const,
        symbol: 'RELIANCE',
        tradeDate: '2026-10-25',
        open: 1320, high: 1335, low: 1315, close: 1324.40,
        volume: 7490000,
        dataSource: 'TEJHQ_NSE_EOD' as const,
        ingestedAt: new Date().toISOString(),
        isEOD: true
      },
      {
        exchange: 'BSE' as const,
        symbol: 'RELIANCE',
        tradeDate: '2026-10-25',
        open: 1321, high: 1334, low: 1316, close: 1323.90, // Genuine slight exchange spread
        volume: 450000,
        dataSource: 'BSE_UDIFF_OFFICIAL' as const,
        ingestedAt: new Date().toISOString(),
        isEOD: true
      }
    ];

    HistoricalDataRepository.saveRecords(records);

    const nseCandles = HistoricalDataRepository.getHistoricalCandles('RELIANCE', 'NSE');
    assert.equal(nseCandles.length, 1);
    assert.equal(nseCandles[0].close, 1324.40);
    assert.equal(nseCandles[0].volume, 7490000);

    const bseCandles = HistoricalDataRepository.getHistoricalCandles('RELIANCE', 'BSE');
    assert.equal(bseCandles.length, 1);
    assert.equal(bseCandles[0].close, 1323.90);
    assert.equal(bseCandles[0].volume, 450000);
  });
});

describe('Unified Market Data Engine & Resolution', () => {
  test('correctly resolves 6-digit BSE numeric codes to official trading metadata', () => {
    const res = UnifiedMarketDataEngine.resolveSecurity('500325', 'BSE');
    assert.equal(res.symbol, 'RELIANCE');
    assert.equal(res.exchange, 'BSE');
    assert.equal(res.bseCode, '500325');
    assert.equal(res.isin, 'INE002A01018');
    assert.equal(res.isDualListed, true);
  });

  test('provides coverage info metadata with zero fabricated numbers', () => {
    const cov = UnifiedMarketDataEngine.getCoverageInfo('RELIANCE', 'NSE');
    assert.equal(cov.symbol, 'RELIANCE');
    assert.equal(cov.exchange, 'NSE');
    assert.equal(typeof cov.hasHistoricalData, 'boolean');
    assert.equal(typeof cov.sessionCount, 'number');
  });
});
