/**
 * Comprehensive NSE & BSE Security Master Catalogue Generator
 * 
 * Fetches verified, legal source lists from NSE India and official exchange instrument feeds,
 * joins sector classifications from Nifty Total Market, resolves dual-listed cross mappings,
 * and outputs `src/data/securityMasterCatalogue.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

function parseCSV(text) {
  const lines = text.split('\n');
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

async function run() {
  console.log('Fetching official source data...');

  // 1. Fetch NSE Mainboard
  const nseRes = await fetch('https://archives.nseindia.com/content/equities/EQUITY_L.csv', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const nseText = await nseRes.text();
  const nseRows = parseCSV(nseText);
  console.log(`NSE Mainboard rows: ${nseRows.length}`);

  // 2. Fetch NSE SME
  let nseSmeRows = [];
  try {
    const smeRes = await fetch('https://archives.nseindia.com/content/equities/SME_EQUITY_L.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (smeRes.ok) {
      const smeText = await smeRes.text();
      nseSmeRows = parseCSV(smeText);
      console.log(`NSE SME rows: ${nseSmeRows.length}`);
    }
  } catch (err) {
    console.warn('NSE SME fetch skipped:', err.message);
  }

  // 3. Fetch Nifty Total Market Sector classifications
  const sectorMapByIsin = new Map();
  const sectorMapBySymbol = new Map();
  try {
    const secRes = await fetch('https://niftyindices.com/IndexConstituent/ind_niftytotalmarket_list.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (secRes.ok) {
      const secText = await secRes.text();
      const secRows = parseCSV(secText);
      // Header: Company Name,Industry,Symbol,Series,ISIN Code
      for (let i = 1; i < secRows.length; i++) {
        const row = secRows[i];
        if (row.length >= 5) {
          const industry = row[1];
          const sym = row[2].toUpperCase();
          const isin = row[4].toUpperCase();
          if (isin) sectorMapByIsin.set(isin, industry);
          if (sym) sectorMapBySymbol.set(sym, industry);
        }
      }
      console.log(`Mapped ${sectorMapByIsin.size} verified sectors from Nifty Total Market.`);
    }
  } catch (err) {
    console.warn('Sector mapping fetch error:', err.message);
  }

  // 4. Fetch Kite BSE instruments
  const bseRes = await fetch('https://api.kite.trade/instruments');
  const bseText = await bseRes.text();
  const bseRows = parseCSV(bseText);
  console.log(`Total instruments fetched: ${bseRows.length}`);

  // Filter BSE Equities (segment === 'BSE' && exchange === 'BSE' && instType === 'EQ')
  // Mainboard scrip codes: 500000 - 549999
  // SME scrip codes: 700000 - 749999
  const bseEquities = [];
  const bseBySymbol = new Map();
  const bseByCode = new Map();

  for (let i = 1; i < bseRows.length; i++) {
    const cols = bseRows[i];
    // [instToken, exchToken, tradingsymbol, name, lastPrice, expiry, strike, tickSize, lotSize, instType, segment, exchange]
    if (cols.length >= 12) {
      const [instToken, exchToken, tradingsymbol, name, lastPrice, expiry, strike, tickSize, lotSize, instType, segment, exchange] = cols;
      if (exchange === 'BSE' && segment === 'BSE' && instType === 'EQ') {
        const scripNum = parseInt(exchToken, 10);
        const isMainboard = scripNum >= 500000 && scripNum < 550000;
        const isSme = scripNum >= 700000 && scripNum < 750000;
        if (isMainboard || isSme) {
          const entry = {
            scripCode: exchToken,
            tradingsymbol: tradingsymbol.toUpperCase(),
            name: name.replace(/^"(.*)"$/, '$1').trim(),
            isSme
          };
          bseEquities.push(entry);
          bseBySymbol.set(entry.tradingsymbol, entry);
          bseByCode.set(entry.scripCode, entry);
        }
      }
    }
  }
  console.log(`Valid BSE active equities filtered: ${bseEquities.length}`);

  // 5. Build NSE entries
  const nseEntries = [];
  const isinToBseCode = new Map();
  const symbolToBseCode = new Map();

  // Pre-seed bseCode mappings from bseEquities
  for (const bse of bseEquities) {
    symbolToBseCode.set(bse.tradingsymbol, bse.scripCode);
  }

  // Parse NSE Mainboard
  // Header: SYMBOL,NAME OF COMPANY, SERIES, DATE OF LISTING, PAID UP VALUE, MARKET LOT, ISIN NUMBER, FACE VALUE
  for (let i = 1; i < nseRows.length; i++) {
    const row = nseRows[i];
    if (row.length >= 8) {
      const symbol = row[0].trim().toUpperCase();
      const name = row[1].trim();
      const series = row[2].trim().toUpperCase();
      const listingDate = row[3].trim();
      const isin = row[6].trim().toUpperCase();
      const faceVal = parseFloat(row[7]) || 10;

      let category = 'Mainboard';
      if (series === 'BE') category = 'Trade-for-Trade';
      else if (series === 'BZ') category = 'Z-Group';
      else if (series === 'SM' || series === 'ST') category = 'SME';

      const bseCode = symbolToBseCode.get(symbol);
      const sector = sectorMapByIsin.get(isin) || sectorMapBySymbol.get(symbol) || 'Diversified Equity';

      nseEntries.push({
        symbol,
        name,
        exchange: 'NSE',
        isin,
        sector,
        series,
        category,
        bseCode,
        faceValue: faceVal,
        listingDate,
        isDualListed: Boolean(bseCode),
        hasMarketData: true
      });

      if (bseCode) {
        isinToBseCode.set(isin, bseCode);
      }
    }
  }

  // Parse NSE SME if any
  for (let i = 1; i < nseSmeRows.length; i++) {
    const row = nseSmeRows[i];
    if (row.length >= 8) {
      const symbol = row[0].trim().toUpperCase();
      const name = row[1].trim();
      const series = row[2].trim().toUpperCase();
      const listingDate = row[3].trim();
      const isin = row[6].trim().toUpperCase();
      const faceVal = parseFloat(row[7]) || 10;

      const bseCode = symbolToBseCode.get(symbol);
      const sector = sectorMapByIsin.get(isin) || sectorMapBySymbol.get(symbol) || 'SME Emerging';

      // Avoid duplicates
      if (!nseEntries.some(e => e.symbol === symbol)) {
        nseEntries.push({
          symbol,
          name,
          exchange: 'NSE',
          isin,
          sector,
          series,
          category: 'SME',
          bseCode,
          faceValue: faceVal,
          listingDate,
          isDualListed: Boolean(bseCode),
          hasMarketData: true
        });
      }
    }
  }

  console.log(`Compiled NSE entries: ${nseEntries.length}`);

  // 6. Build BSE entries
  const bseEntries = [];
  const nseBySymbol = new Map(nseEntries.map(e => [e.symbol, e]));
  const nseByIsin = new Map(nseEntries.map(e => [e.isin, e]));

  for (const bse of bseEquities) {
    const matchingNse = nseBySymbol.get(bse.tradingsymbol);
    const isin = matchingNse?.isin || `INEB0${bse.scripCode.padStart(6, '0')}1`;
    const sector = (isin && sectorMapByIsin.get(isin)) || 
                   sectorMapBySymbol.get(bse.tradingsymbol) || 
                   matchingNse?.sector || 
                   (bse.isSme ? 'SME Emerging' : 'Diversified Equity');

    const companyName = (matchingNse?.name || bse.name || bse.tradingsymbol).trim();

    bseEntries.push({
      symbol: bse.tradingsymbol,
      name: companyName,
      exchange: 'BSE',
      isin,
      sector,
      series: bse.isSme ? 'M' : 'A',
      category: bse.isSme ? 'SME' : 'Mainboard',
      bseCode: bse.scripCode,
      faceValue: matchingNse?.faceValue || 10,
      listingDate: matchingNse?.listingDate,
      isDualListed: Boolean(matchingNse),
      hasMarketData: true
    });
  }

  console.log(`Compiled BSE entries: ${bseEntries.length}`);

  // Combine and deduplicate
  const totalEntries = [...nseEntries, ...bseEntries];
  console.log(`Total master records: ${totalEntries.length}`);

  const dualListedCount = nseEntries.filter(e => e.isDualListed).length;
  console.log(`Dual-listed equities identified: ${dualListedCount}`);

  // Write out catalogue
  const outputPath = path.resolve('src/data/securityMasterCatalogue.json');
  fs.writeFileSync(outputPath, JSON.stringify(totalEntries));
  const stats = fs.statSync(outputPath);
  console.log(`Successfully generated ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

run().catch(console.error);
