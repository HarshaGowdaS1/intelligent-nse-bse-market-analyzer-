/**
 * Official BSE India Historical Bhavcopy Importer
 * 
 * Supports:
 * 1. Legacy BSE Archive Importer (Pre-July 8, 2024 ZIP & CSV formats)
 * 2. Modern BSE UDiFF Daily Importer (Post-July 8, 2024 SEBI Unified Distilled File Format)
 * 3. 100% Genuine Exchange Records • Zero Fabricated Prices
 */

import { NormalizedOHLCVRecord } from '../types/marketDataEngine';
import { DataValidationService } from './dataValidationService';
import { SecurityMaster } from './securityMaster';

const MONTH_MAP: Record<string, string> = {
  'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
  'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
  'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
};

export class BSELegacyImporter {
  /**
   * Parse raw CSV content from a legacy BSE Bhavcopy (e.g. EQ_ISINCODE_150124.CSV or EQ150124.CSV)
   */
  static parseLegacyCSV(csvContent: string, defaultDateStr?: string): NormalizedOHLCVRecord[] {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim().toUpperCase());
    const scCodeIdx = header.indexOf('SC_CODE');
    const scNameIdx = header.indexOf('SC_NAME');
    const isinIdx = header.indexOf('ISIN_CODE');
    const groupIdx = header.indexOf('SC_GROUP');
    const openIdx = header.indexOf('OPEN');
    const highIdx = header.indexOf('HIGH');
    const lowIdx = header.indexOf('LOW');
    const closeIdx = header.indexOf('CLOSE');
    const prevCloseIdx = header.indexOf('PREVCLOSE');
    const sharesIdx = header.indexOf('NO_OF_SHRS');
    const turnoverIdx = header.indexOf('NET_TURNOV');
    const tradesIdx = header.indexOf('NO_TRADES');
    const dateIdx = header.indexOf('TRADING_DATE');

    if (scCodeIdx === -1 || closeIdx === -1) {
      console.warn('Invalid legacy BSE CSV header structure:', lines[0]);
      return [];
    }

    const records: NormalizedOHLCVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      if (cols.length <= closeIdx) continue;

      const scCode = cols[scCodeIdx]?.trim();
      if (!scCode || !/^\d{5,6}$/.test(scCode)) continue;

      // Extract and normalize trading date
      let rawDate = dateIdx !== -1 ? cols[dateIdx]?.trim() : defaultDateStr;
      if (!rawDate && defaultDateStr) rawDate = defaultDateStr;
      const normalizedDate = this.normalizeLegacyDate(rawDate);
      if (!normalizedDate) continue;

      // Resolve official symbol and company name from SecurityMaster
      const secMeta = SecurityMaster.getByBseCode(scCode);
      const isin = (isinIdx !== -1 ? cols[isinIdx]?.trim() : '') || secMeta?.isin || `INE_BSE_${scCode}`;
      const symbol = secMeta?.symbol || (scNameIdx !== -1 ? cols[scNameIdx]?.trim().replace(/\s+/g, '_') : '') || `BSE_${scCode}`;
      const companyName = secMeta?.name || (scNameIdx !== -1 ? cols[scNameIdx]?.trim() : `BSE Scrip ${scCode}`);
      const series = groupIdx !== -1 ? cols[groupIdx]?.trim() : secMeta?.series || 'A';

      const open = parseFloat(cols[openIdx]);
      const high = parseFloat(cols[highIdx]);
      const low = parseFloat(cols[lowIdx]);
      const close = parseFloat(cols[closeIdx]);
      const prevClose = prevCloseIdx !== -1 ? parseFloat(cols[prevCloseIdx]) : undefined;
      const volume = sharesIdx !== -1 ? parseInt(cols[sharesIdx], 10) : 0;
      const turnover = turnoverIdx !== -1 ? parseFloat(cols[turnoverIdx]) : undefined;
      const tradesCount = tradesIdx !== -1 ? parseInt(cols[tradesIdx], 10) : undefined;

      const validation = DataValidationService.validateRecord({
        exchange: 'BSE',
        symbol,
        scripCode: scCode,
        isin,
        companyName,
        series,
        tradeDate: normalizedDate,
        open,
        high,
        low,
        close,
        prevClose,
        volume: isNaN(volume) ? 0 : volume,
        turnover: isNaN(turnover as number) ? undefined : turnover,
        tradesCount: isNaN(tradesCount as number) ? undefined : tradesCount,
        dataSource: 'BSE_LEGACY_ZIP',
        ingestedAt: new Date().toISOString()
      });

      if (validation.isValid && validation.record) {
        records.push(validation.record);
      }
    }

    return records;
  }

  /**
   * Normalize various legacy date formats (e.g. "15-Jan-24", "15/01/2024", "20240115") to ISO YYYY-MM-DD
   */
  static normalizeLegacyDate(dateStr?: string): string | null {
    if (!dateStr) return null;
    const clean = dateStr.trim();

    // Format 1: 15-Jan-24 or 15-Jan-2024
    const matchDMMMY = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
    if (matchDMMMY) {
      const day = matchDMMMY[1].padStart(2, '0');
      const mon = MONTH_MAP[matchDMMMY[2].toUpperCase()] || '01';
      let year = matchDMMMY[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${mon}-${day}`;
    }

    // Format 2: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }

    // Format 3: DDMMYY (e.g. "150124")
    const matchDDMMYY = clean.match(/^(\d{2})(\d{2})(\d{2})$/);
    if (matchDDMMYY) {
      return `20${matchDDMMYY[3]}-${matchDDMMYY[2]}-${matchDDMMYY[1]}`;
    }

    // Format 4: YYYYMMDD (e.g. "20240115")
    const matchYYYYMMDD = clean.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (matchYYYYMMDD) {
      return `${matchYYYYMMDD[1]}-${matchYYYYMMDD[2]}-${matchYYYYMMDD[3]}`;
    }

    return null;
  }

  /**
   * Pure Node/JS uncompressed ZIP buffer extractor for legacy archives
   */
  static extractZipBuffer(zipBuffer: Buffer): { filename: string; content: string }[] {
    try {
      const getBuiltin = typeof process !== 'undefined' ? (process as any).getBuiltinModule : null;
      const zlib = typeof getBuiltin === 'function' 
        ? getBuiltin('node:zlib') 
        : (typeof require !== 'undefined' ? require('node:zlib') : null);
      if (!zlib) {
        console.warn('zlib unavailable in current environment');
        return [];
      }

      const files: { filename: string; content: string }[] = [];
      let offset = 0;

      while (offset < zipBuffer.length - 30) {
        // Look for local file header signature 0x04034b50 (PK\x03\x04)
        if (zipBuffer.readUInt32LE(offset) !== 0x04034b50) {
          offset++;
          continue;
        }

        const compression = zipBuffer.readUInt16LE(offset + 8);
        const compressedSize = zipBuffer.readUInt32LE(offset + 18);
        const filenameLen = zipBuffer.readUInt16LE(offset + 26);
        const extraLen = zipBuffer.readUInt16LE(offset + 28);
        const filename = zipBuffer.toString('utf8', offset + 30, offset + 30 + filenameLen);

        const dataStart = offset + 30 + filenameLen + extraLen;
        const compressedData = zipBuffer.slice(dataStart, dataStart + compressedSize);

        let decompressed: Buffer;
        if (compression === 8) {
          decompressed = zlib.inflateRawSync(compressedData);
        } else if (compression === 0) {
          decompressed = compressedData;
        } else {
          offset = dataStart + compressedSize;
          continue;
        }

        files.push({
          filename,
          content: decompressed.toString('utf8')
        });

        offset = dataStart + compressedSize;
      }

      return files;
    } catch (err) {
      console.warn('ZIP extraction error:', err);
      return [];
    }
  }
}

export class BSEUDiFFImporter {
  /**
   * Parse modern SEBI UDiFF BSE Cash Market Bhavcopy (Post-July 8, 2024)
   */
  static parseUDiFFCSV(csvContent: string): NormalizedOHLCVRecord[] {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim());
    const tradDtIdx = header.indexOf('TradDt');
    const finInstrmIdIdx = header.indexOf('FinInstrmId');
    const isinIdx = header.indexOf('ISIN');
    const tckrSymbIdx = header.indexOf('TckrSymb');
    const sctySrsIdx = header.indexOf('SctySrs');
    const finInstrmNmIdx = header.indexOf('FinInstrmNm');
    const opnPricIdx = header.indexOf('OpnPric');
    const hghPricIdx = header.indexOf('HghPric');
    const lwPricIdx = header.indexOf('LwPric');
    const clsPricIdx = header.indexOf('ClsPric');
    const prvsClsgPricIdx = header.indexOf('PrvsClsgPric');
    const ttlTradgVolIdx = header.indexOf('TtlTradgVol');
    const ttlTrfValIdx = header.indexOf('TtlTrfVal');
    const ttlTradesIdx = header.indexOf('TtlNbOfTxsExctd');

    if (tckrSymbIdx === -1 || clsPricIdx === -1 || tradDtIdx === -1) {
      console.warn('Invalid BSE UDiFF header structure:', lines[0]);
      return [];
    }

    const records: NormalizedOHLCVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      if (cols.length <= clsPricIdx) continue;

      const tradeDate = cols[tradDtIdx]?.trim();
      if (!tradeDate || !/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) continue;

      const scripCode = finInstrmIdIdx !== -1 ? cols[finInstrmIdIdx]?.trim() : undefined;
      const isin = isinIdx !== -1 ? cols[isinIdx]?.trim() : undefined;
      const symbol = cols[tckrSymbIdx]?.trim();
      const series = sctySrsIdx !== -1 ? cols[sctySrsIdx]?.trim() : 'A';
      const companyName = finInstrmNmIdx !== -1 ? cols[finInstrmNmIdx]?.trim() : undefined;

      const open = parseFloat(cols[opnPricIdx]);
      const high = parseFloat(cols[hghPricIdx]);
      const low = parseFloat(cols[lwPricIdx]);
      const close = parseFloat(cols[clsPricIdx]);
      const prevClose = prvsClsgPricIdx !== -1 ? parseFloat(cols[prvsClsgPricIdx]) : undefined;
      const volume = ttlTradgVolIdx !== -1 ? parseInt(cols[ttlTradgVolIdx], 10) : 0;
      const turnover = ttlTrfValIdx !== -1 ? parseFloat(cols[ttlTrfValIdx]) : undefined;
      const tradesCount = ttlTradesIdx !== -1 ? parseInt(cols[ttlTradesIdx], 10) : undefined;

      const validation = DataValidationService.validateRecord({
        exchange: 'BSE',
        symbol,
        scripCode,
        isin,
        companyName,
        series,
        tradeDate,
        open,
        high,
        low,
        close,
        prevClose,
        volume: isNaN(volume) ? 0 : volume,
        turnover: isNaN(turnover as number) ? undefined : turnover,
        tradesCount: isNaN(tradesCount as number) ? undefined : tradesCount,
        dataSource: 'BSE_UDIFF_OFFICIAL',
        ingestedAt: new Date().toISOString()
      });

      if (validation.isValid && validation.record) {
        records.push(validation.record);
      }
    }

    return records;
  }
}
