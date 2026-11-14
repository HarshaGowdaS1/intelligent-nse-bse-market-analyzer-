/**
 * Forensic Investigation of Missing Securities
 * Cross-references all 8,950 catalogue entries against actual SQLite records.
 */

const sqlite = process.getBuiltinModule('node:sqlite');
const cat = require('../src/data/securityMasterCatalogue.json');

const db = new sqlite.DatabaseSync('data/market_history.db');

const nseRows = db.prepare("SELECT DISTINCT symbol FROM daily_ohlcv WHERE exchange = 'NSE'").all();
const bseRows = db.prepare("SELECT DISTINCT symbol FROM daily_ohlcv WHERE exchange = 'BSE'").all();

const nseStored = new Set(nseRows.map(r => r.symbol.toUpperCase()));
const bseStored = new Set(bseRows.map(r => r.symbol.toUpperCase()));

console.log('Stored in SQLite -> NSE:', nseStored.size, 'BSE:', bseStored.size);

const missingNSE = cat.filter(c => c.exchange === 'NSE' && !nseStored.has(c.symbol.toUpperCase()));
const missingBSE = cat.filter(c => c.exchange === 'BSE' && !bseStored.has(c.symbol.toUpperCase()));

console.log('Missing from SQLite -> NSE:', missingNSE.length, 'BSE:', missingBSE.length);

// Grouping Missing NSE
const nseBySeries = {};
const nseByCategory = {};
for (const s of missingNSE) {
  nseBySeries[s.series || 'UNKNOWN'] = (nseBySeries[s.series || 'UNKNOWN'] || 0) + 1;
  nseByCategory[s.category || 'UNKNOWN'] = (nseByCategory[s.category || 'UNKNOWN'] || 0) + 1;
}
console.log('Missing NSE by Series:', nseBySeries);
console.log('Missing NSE by Category:', nseByCategory);

// Grouping Missing BSE
const bseBySeries = {};
const bseByCategory = {};
let bseOnlyMissing = 0;
let bseDualMissing = 0;
for (const s of missingBSE) {
  bseBySeries[s.series || 'UNKNOWN'] = (bseBySeries[s.series || 'UNKNOWN'] || 0) + 1;
  bseByCategory[s.category || 'UNKNOWN'] = (bseByCategory[s.category || 'UNKNOWN'] || 0) + 1;
  if (s.isDualListed) bseDualMissing++;
  else bseOnlyMissing++;
}
console.log('Missing BSE by Series:', bseBySeries);
console.log('Missing BSE by Category:', bseByCategory);
console.log('Missing BSE-Only:', bseOnlyMissing, 'Missing BSE Dual-Listed Leg:', bseDualMissing);

// Sample missing securities from each segment
console.log('\nSample Missing NSE BE (Trade-for-Trade):', missingNSE.filter(s => s.series === 'BE').slice(0, 5).map(s => s.symbol));
console.log('Sample Missing NSE BZ (Z-Group/Non-compliant):', missingNSE.filter(s => s.series === 'BZ').slice(0, 5).map(s => s.symbol));
console.log('Sample Missing BSE SME (Series M):', missingBSE.filter(s => s.category === 'SME').slice(0, 5).map(s => ({ symbol: s.symbol, scrip: s.bseCode })));
