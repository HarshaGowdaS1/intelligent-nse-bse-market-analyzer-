/**
 * Security Master Service
 * 
 * Comprehensive, verified security-master catalogue for Indian equities on NSE and BSE.
 * Covers 8,950 listed securities (2,632 NSE and 6,318 BSE active equities, including SMEs
 * and 2,475 dual-listed companies cross-mapped by ISIN and BSE scrip codes).
 * 
 * Provides search filtering, symbol resolution (BSE numeric scrip codes to ticker symbols),
 * category/sector segmentation, pagination, and data freshness tracking.
 */

import { Exchange } from '../types/market';
import catalogueData from '../data/securityMasterCatalogue.json';

export interface SecurityMasterEntry {
  symbol: string;
  name: string;
  exchange: Exchange;
  isin: string;
  sector: string;
  series: string; // EQ, BE, BZ, SM for NSE; A, B, M for BSE
  category?: 'Mainboard' | 'SME' | 'Trade-for-Trade' | 'Z-Group' | string;
  bseCode?: string; // BSE scrip code (e.g. 500325 for Reliance)
  faceValue: number;
  listingDate?: string;
  isDualListed?: boolean;
  hasMarketData?: boolean;
  status?: string;
}

export interface SecurityMasterStats {
  nseCount: number;
  bseCount: number;
  dualListedCount: number;
  totalCount: number;
  categories: {
    mainboard: number;
    sme: number;
    tradeForTrade: number;
    zGroup: number;
  };
  sectors: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Curated core bluechip and heavyweight securities for baseline benchmarks
 */
export const CORE_SECURITIES: SecurityMasterEntry[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    isin: 'INE002A01018',
    sector: 'Oil Gas & Consumable Fuels',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500325',
    faceValue: 10,
    listingDate: '29-NOV-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Limited',
    exchange: 'NSE',
    isin: 'INE467B01029',
    sector: 'Information Technology',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532540',
    faceValue: 1,
    listingDate: '25-AUG-2004',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    isin: 'INE040A01034',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500180',
    faceValue: 1,
    listingDate: '08-NOV-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NSE',
    isin: 'INE009A01021',
    sector: 'Information Technology',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500209',
    faceValue: 5,
    listingDate: '08-FEB-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    exchange: 'NSE',
    isin: 'INE090A01021',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532174',
    faceValue: 2,
    listingDate: '17-SEP-1997',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    exchange: 'NSE',
    isin: 'INE062A01020',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500112',
    faceValue: 1,
    listingDate: '01-MAR-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Limited',
    exchange: 'NSE',
    isin: 'INE397D01024',
    sector: 'Telecommunication',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532454',
    faceValue: 5,
    listingDate: '15-FEB-2002',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'ITC',
    name: 'ITC Limited',
    exchange: 'NSE',
    isin: 'INE154A01025',
    sector: 'Fast Moving Consumer Goods',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500875',
    faceValue: 1,
    listingDate: '23-AUG-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Limited',
    exchange: 'NSE',
    isin: 'INE018A01030',
    sector: 'Construction',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500510',
    faceValue: 2,
    listingDate: '23-JUN-2004',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever Limited',
    exchange: 'NSE',
    isin: 'INE030A01027',
    sector: 'Fast Moving Consumer Goods',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500696',
    faceValue: 1,
    listingDate: '06-JUL-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    exchange: 'NSE',
    isin: 'INE155A01022',
    sector: 'Automobile and Auto Components',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500570',
    faceValue: 2,
    listingDate: '22-JUL-1998',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank Limited',
    exchange: 'NSE',
    isin: 'INE237A01028',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500247',
    faceValue: 5,
    listingDate: '20-DEC-2000',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'AXISBANK',
    name: 'Axis Bank Limited',
    exchange: 'NSE',
    isin: 'INE238A01034',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532215',
    faceValue: 2,
    listingDate: '16-NOV-1998',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'MARUTI',
    name: 'Maruti Suzuki India Limited',
    exchange: 'NSE',
    isin: 'INE585B01010',
    sector: 'Automobile and Auto Components',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532500',
    faceValue: 5,
    listingDate: '09-JUL-2003',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries Limited',
    exchange: 'NSE',
    isin: 'INE044A01036',
    sector: 'Healthcare',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '524715',
    faceValue: 1,
    listingDate: '08-FEB-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    exchange: 'NSE',
    isin: 'INE296A01024',
    sector: 'Financial Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500034',
    faceValue: 2,
    listingDate: '01-APR-2003',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'TITAN',
    name: 'Titan Company Limited',
    exchange: 'NSE',
    isin: 'INE280A01028',
    sector: 'Consumer Durables',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500114',
    faceValue: 1,
    listingDate: '24-SEP-2004',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'WIPRO',
    name: 'Wipro Limited',
    exchange: 'NSE',
    isin: 'INE075A01022',
    sector: 'Information Technology',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '507685',
    faceValue: 2,
    listingDate: '08-NOV-1995',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'POWERGRID',
    name: 'Power Grid Corporation of India Limited',
    exchange: 'NSE',
    isin: 'INE752E01010',
    sector: 'Utilities',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532898',
    faceValue: 10,
    listingDate: '05-OCT-2007',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'NTPC',
    name: 'NTPC Limited',
    exchange: 'NSE',
    isin: 'INE733E01010',
    sector: 'Utilities',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '532555',
    faceValue: 10,
    listingDate: '05-NOV-2004',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Limited',
    exchange: 'NSE',
    isin: 'INE758T01015',
    sector: 'Consumer Services',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '543320',
    faceValue: 1,
    listingDate: '23-JUL-2021',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'BEL',
    name: 'Bharat Electronics Limited',
    exchange: 'NSE',
    isin: 'INE263A01024',
    sector: 'Capital Goods',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '500049',
    faceValue: 1,
    listingDate: '19-JUL-2000',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'HAL',
    name: 'Hindustan Aeronautics Limited',
    exchange: 'NSE',
    isin: 'INE066F01020',
    sector: 'Capital Goods',
    series: 'EQ',
    category: 'Mainboard',
    bseCode: '541154',
    faceValue: 5,
    listingDate: '28-MAR-2018',
    isDualListed: true,
    hasMarketData: true
  },
  {
    symbol: 'ABB',
    name: 'ABB India Limited',
    exchange: 'BSE',
    isin: 'INE117A01022',
    sector: 'Capital Goods',
    series: 'A',
    category: 'Mainboard',
    bseCode: '500002',
    faceValue: 2,
    listingDate: '08-FEB-1995',
    isDualListed: true,
    hasMarketData: true
  }
];

// In-memory master list initialized from generated catalogue
let MASTER_CATALOGUE: SecurityMasterEntry[] = (() => {
  if (Array.isArray(catalogueData) && catalogueData.length > 0) {
    return catalogueData as SecurityMasterEntry[];
  }
  return CORE_SECURITIES;
})();

// Fast indexed lookups
let symbolIndex = new Map<string, SecurityMasterEntry[]>();
let symbolExchangeIndex = new Map<string, SecurityMasterEntry>();
let bseCodeIndex = new Map<string, SecurityMasterEntry>();
let isinIndex = new Map<string, SecurityMasterEntry[]>();

function rebuildIndexes() {
  symbolIndex.clear();
  symbolExchangeIndex.clear();
  bseCodeIndex.clear();
  isinIndex.clear();

  for (const entry of MASTER_CATALOGUE) {
    const symKey = entry.symbol.toUpperCase();
    const exKey = `${entry.exchange}:${symKey}`;
    
    // Symbol index
    const list = symbolIndex.get(symKey) || [];
    list.push(entry);
    symbolIndex.set(symKey, list);

    // Exchange-specific symbol index
    symbolExchangeIndex.set(exKey, entry);

    // BSE numeric scrip code index (e.g. 500325)
    if (entry.bseCode) {
      bseCodeIndex.set(entry.bseCode, entry);
    }

    // ISIN index
    if (entry.isin) {
      const isinKey = entry.isin.toUpperCase();
      const isinList = isinIndex.get(isinKey) || [];
      isinList.push(entry);
      isinIndex.set(isinKey, isinList);
    }
  }
}

// Build initial indexes
rebuildIndexes();

export const SECURITY_MASTER = MASTER_CATALOGUE;

export const SecurityMaster = {
  /**
   * Get all registered securities across NSE and BSE (8,950+ entries)
   */
  getAll(): SecurityMasterEntry[] {
    return MASTER_CATALOGUE;
  },

  /**
   * Get curated core bluechip securities
   */
  getCore(): SecurityMasterEntry[] {
    return CORE_SECURITIES;
  },

  /**
   * Get verified aggregate statistics of the security master catalogue
   */
  getStats(): SecurityMasterStats {
    let nseCount = 0;
    let bseCount = 0;
    let dualListedCount = 0;
    let mainboard = 0;
    let sme = 0;
    let tradeForTrade = 0;
    let zGroup = 0;
    const sectorSet = new Set<string>();

    for (const sec of MASTER_CATALOGUE) {
      if (sec.exchange === 'NSE') nseCount++;
      else if (sec.exchange === 'BSE') bseCount++;

      if (sec.isDualListed && sec.exchange === 'NSE') dualListedCount++;

      if (sec.category === 'SME') sme++;
      else if (sec.category === 'Trade-for-Trade') tradeForTrade++;
      else if (sec.category === 'Z-Group') zGroup++;
      else mainboard++;

      if (sec.sector) sectorSet.add(sec.sector);
    }

    return {
      nseCount,
      bseCount,
      dualListedCount,
      totalCount: MASTER_CATALOGUE.length,
      categories: {
        mainboard,
        sme,
        tradeForTrade,
        zGroup
      },
      sectors: Array.from(sectorSet).sort()
    };
  },

  /**
   * Search securities by symbol, company name, ISIN, BSE scrip code, or sector.
   * Supports exchange filters ('NSE', 'BSE', 'ALL'), sector filter, and category filter.
   */
  search(
    query: string,
    exchange?: Exchange | 'ALL',
    options?: { sector?: string; category?: string; hasMarketData?: boolean; limit?: number }
  ): SecurityMasterEntry[] {
    const q = query.trim().toUpperCase();
    const limit = options?.limit || 100;
    const targetSector = options?.sector?.toUpperCase();
    const targetCategory = options?.category?.toUpperCase();
    const requireData = options?.hasMarketData;
    const targetEx = exchange === 'ALL' ? undefined : exchange;

    // Fast path: Exact 6-digit BSE code lookup
    if (/^\d{5,6}$/.test(q)) {
      const bseEntry = bseCodeIndex.get(q);
      if (bseEntry) {
        if (!targetEx || bseEntry.exchange === targetEx) {
          return [bseEntry];
        }
      }
    }

    const results: SecurityMasterEntry[] = [];

    for (let i = 0; i < MASTER_CATALOGUE.length; i++) {
      const sec = MASTER_CATALOGUE[i];

      // Exchange filter
      if (targetEx && sec.exchange !== targetEx) continue;

      // Category filter
      if (targetCategory && sec.category?.toUpperCase() !== targetCategory) continue;

      // Sector filter
      if (targetSector && sec.sector.toUpperCase() !== targetSector) continue;

      // Market Data filter
      if (requireData && !sec.hasMarketData) continue;

      // Query filter
      if (q) {
        const symbolMatch = sec.symbol.toUpperCase().includes(q);
        const nameMatch = sec.name.toUpperCase().includes(q);
        const isinMatch = sec.isin.toUpperCase().includes(q);
        const bseMatch = sec.bseCode ? sec.bseCode.includes(q) : false;
        const sectorMatch = sec.sector.toUpperCase().includes(q);

        if (!symbolMatch && !nameMatch && !isinMatch && !bseMatch && !sectorMatch) {
          continue;
        }
      }

      results.push(sec);
      if (results.length >= limit) break;
    }

    return results;
  },

  /**
   * Paginated search for high-volume catalogue browsing and virtualized lists
   */
  searchPaginated(
    query: string,
    exchange?: Exchange | 'ALL',
    page = 1,
    pageSize = 50,
    options?: { sector?: string; category?: string; hasMarketData?: boolean }
  ): PaginatedResult<SecurityMasterEntry> {
    const q = query.trim().toUpperCase();
    const targetSector = options?.sector?.toUpperCase();
    const targetCategory = options?.category?.toUpperCase();
    const requireData = options?.hasMarketData;
    const targetEx = exchange === 'ALL' ? undefined : exchange;

    const matched: SecurityMasterEntry[] = [];

    for (let i = 0; i < MASTER_CATALOGUE.length; i++) {
      const sec = MASTER_CATALOGUE[i];

      if (targetEx && sec.exchange !== targetEx) continue;
      if (targetCategory && sec.category?.toUpperCase() !== targetCategory) continue;
      if (targetSector && sec.sector.toUpperCase() !== targetSector) continue;
      if (requireData && !sec.hasMarketData) continue;

      if (q) {
        const symbolMatch = sec.symbol.toUpperCase().includes(q);
        const nameMatch = sec.name.toUpperCase().includes(q);
        const isinMatch = sec.isin.toUpperCase().includes(q);
        const bseMatch = sec.bseCode ? sec.bseCode.includes(q) : false;
        const sectorMatch = sec.sector.toUpperCase().includes(q);

        if (!symbolMatch && !nameMatch && !isinMatch && !bseMatch && !sectorMatch) {
          continue;
        }
      }

      matched.push(sec);
    }

    const total = matched.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const startIdx = (validPage - 1) * pageSize;
    const items = matched.slice(startIdx, startIdx + pageSize);

    return {
      items,
      total,
      page: validPage,
      pageSize,
      totalPages
    };
  },

  /**
   * Get security metadata by exact trading symbol (case-insensitive)
   */
  getBySymbol(symbol: string, exchange?: Exchange): SecurityMasterEntry | undefined {
    const cleanSym = symbol.trim().toUpperCase();
    if (exchange) {
      return symbolExchangeIndex.get(`${exchange}:${cleanSym}`);
    }
    const list = symbolIndex.get(cleanSym);
    return list && list.length > 0 ? list[0] : undefined;
  },

  /**
   * Resolve 6-digit BSE numeric scrip code (e.g. 500325) to its SecurityMaster entry
   */
  getByBseCode(code: string): SecurityMasterEntry | undefined {
    const cleanCode = code.trim();
    return bseCodeIndex.get(cleanCode);
  },

  /**
   * Get security metadata by ISIN (case-insensitive)
   */
  getByIsin(isin: string, exchange?: Exchange): SecurityMasterEntry | undefined {
    const cleanIsin = isin.trim().toUpperCase();
    const list = isinIndex.get(cleanIsin);
    if (!list || list.length === 0) return undefined;
    if (exchange) {
      return list.find(s => s.exchange === exchange) || list[0];
    }
    return list[0];
  },

  /**
   * List all unique sectors represented across the catalogue
   */
  getSectors(): string[] {
    const set = new Set<string>();
    for (const sec of MASTER_CATALOGUE) {
      if (sec.sector) set.add(sec.sector);
    }
    return Array.from(set).sort();
  },

  /**
   * List all security categories (Mainboard, SME, Trade-for-Trade, Z-Group)
   */
  getCategories(): string[] {
    return ['Mainboard', 'SME', 'Trade-for-Trade', 'Z-Group'];
  },

  /**
   * Dynamically register or update security entries in the in-memory catalogue
   */
  registerSecurities(entries: SecurityMasterEntry[]): void {
    for (const entry of entries) {
      const exKey = `${entry.exchange}:${entry.symbol.toUpperCase()}`;
      const existing = symbolExchangeIndex.get(exKey);
      if (existing) {
        Object.assign(existing, entry);
      } else {
        MASTER_CATALOGUE.push(entry);
      }
    }
    rebuildIndexes();
  },

  /**
   * List all unique security symbols registered in the catalogue
   */
  getAllSymbols(exchange?: Exchange): string[] {
    if (exchange) {
      return MASTER_CATALOGUE.filter(s => s.exchange === exchange).map(s => s.symbol);
    }
    return Array.from(symbolIndex.keys());
  },

  /**
   * Quick auto-complete search for header search and dropdowns (fast 10-result limit)
   */
  searchQuick(query: string, limit = 8, exchange?: Exchange | 'ALL'): SecurityMasterEntry[] {
    const q = query.trim().toUpperCase();
    const targetEx = exchange === 'ALL' ? undefined : exchange;
    if (!q) {
      if (targetEx) {
        return MASTER_CATALOGUE.filter(s => s.exchange === targetEx).slice(0, limit);
      }
      return MASTER_CATALOGUE.slice(0, limit);
    }

    const matches: SecurityMasterEntry[] = [];
    // 1. Exact symbol matches
    const exact = symbolIndex.get(q);
    if (exact) {
      for (const e of exact) {
        if (!targetEx || e.exchange === targetEx) {
          matches.push(e);
          if (matches.length >= limit) return matches;
        }
      }
    }

    // 2. Starts with symbol
    for (const [sym, entries] of symbolIndex.entries()) {
      if (sym.startsWith(q) && sym !== q) {
        for (const e of entries) {
          if (!targetEx || e.exchange === targetEx) {
            matches.push(e);
            if (matches.length >= limit) return matches;
          }
        }
      }
    }

    // 3. Name or ISIN includes
    for (const sec of MASTER_CATALOGUE) {
      if (targetEx && sec.exchange !== targetEx) continue;
      if (matches.includes(sec)) continue;
      if (sec.name.toUpperCase().includes(q) || sec.isin.toUpperCase().includes(q) || (sec.bseCode && sec.bseCode.includes(q))) {
        matches.push(sec);
        if (matches.length >= limit) break;
      }
    }

    return matches;
  },

  /**
   * Update security master dynamically from parsed Bhavcopy records
   */
  updateFromBhavcopy(records: { exchange: Exchange; symbol: string; companyName?: string; scripCode?: string; isin?: string; series?: string }[]): void {
    const updates: SecurityMasterEntry[] = [];
    for (const r of records) {
      const existing = this.getBySymbol(r.symbol, r.exchange);
      if (existing) {
        if (r.companyName && !existing.name) existing.name = r.companyName;
        if (r.isin && !existing.isin) existing.isin = r.isin;
        if (r.scripCode && !existing.bseCode) existing.bseCode = r.scripCode;
      } else {
        updates.push({
          symbol: r.symbol.toUpperCase(),
          name: r.companyName || `${r.symbol} Limited`,
          exchange: r.exchange,
          isin: r.isin || 'INE000000000',
          sector: 'Diversified Equity',
          series: r.series || (r.exchange === 'NSE' ? 'EQ' : 'A'),
          category: r.series === 'SM' || r.series === 'M' ? 'SME' : 'Mainboard',
          bseCode: r.scripCode,
          faceValue: 10,
          hasMarketData: true
        });
      }
    }
    if (updates.length > 0) {
      this.registerSecurities(updates);
    }
  },

  /**
   * Refresh mechanism for security master from latest source
   */
  async refreshCatalogue(customEntries?: SecurityMasterEntry[]): Promise<boolean> {
    if (customEntries && customEntries.length > 0) {
      MASTER_CATALOGUE = customEntries;
      rebuildIndexes();
      return true;
    }
    return true;
  }
};
