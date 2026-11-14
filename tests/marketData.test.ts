import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SecurityMaster } from '../src/services/securityMaster';
import { MarketDataService } from '../src/services/marketDataService';
import { 
  calculateRSI, 
  calculateMACD, 
  calculateEMA, 
  calculateSMA, 
  calculateRiskMetrics 
} from '../src/services/indicators';

describe('Security Master Catalogue & Resolution', () => {
  test('contains comprehensive catalogue of active NSE & BSE equities', () => {
    const all = SecurityMaster.getAll();
    assert.ok(all.length >= 8900, `Expected at least 8,900 equities, got ${all.length}`);
    
    const stats = SecurityMaster.getStats();
    assert.ok(stats.nseCount >= 2600, `Expected >= 2,600 NSE equities, got ${stats.nseCount}`);
    assert.ok(stats.bseCount >= 6300, `Expected >= 6,300 BSE equities, got ${stats.bseCount}`);
    assert.ok(stats.dualListedCount >= 2400, `Expected >= 2,400 dual-listed equities, got ${stats.dualListedCount}`);
    assert.equal(stats.totalCount, all.length);

    // Verify required fields across every registered security
    for (const sec of all) {
      assert.ok(sec.symbol, 'Symbol must be defined');
      assert.ok(sec.name, 'Name must be defined');
      assert.ok(sec.isin.startsWith('IN'), `ISIN must start with IN: ${sec.isin}`);
      assert.ok(sec.sector, 'Sector must be defined');
      assert.ok(sec.exchange === 'NSE' || sec.exchange === 'BSE', 'Exchange must be NSE or BSE');
    }
  });

  test('supports separate NSE and BSE listings for dual-listed companies', () => {
    const relNse = SecurityMaster.getBySymbol('RELIANCE', 'NSE');
    assert.ok(relNse, 'Reliance must exist on NSE');
    assert.equal(relNse?.exchange, 'NSE');
    assert.equal(relNse?.bseCode, '500325');
    assert.equal(relNse?.isDualListed, true);

    const relBse = SecurityMaster.getBySymbol('RELIANCE', 'BSE');
    assert.ok(relBse, 'Reliance must exist on BSE');
    assert.equal(relBse?.exchange, 'BSE');
    assert.equal(relBse?.bseCode, '500325');
    assert.equal(relBse?.isDualListed, true);
    assert.equal(relBse?.isin, relNse?.isin);
  });

  test('correctly resolves 6-digit BSE numeric scrip codes to ticker symbols', () => {
    // Lookup by BSE code 500325 (Reliance)
    const rel = SecurityMaster.getByBseCode('500325');
    assert.ok(rel, 'Must resolve 500325');
    assert.equal(rel?.symbol, 'RELIANCE');

    // Lookup by BSE code 500002 (ABB India)
    const abb = SecurityMaster.getByBseCode('500002');
    assert.ok(abb, 'Must resolve 500002');
    assert.equal(abb?.symbol, 'ABB');

    // MarketDataService symbol resolution
    const resolved = MarketDataService.resolveSymbol('500325');
    assert.equal(resolved.resolvedSymbol, 'RELIANCE');
    assert.equal(resolved.resolvedExchange, 'BSE');
  });

  test('searches case-insensitively across symbol, name, ISIN, BSE scrip code, and sector', () => {
    // Exact symbol
    const rel = SecurityMaster.search('RELIANCE');
    assert.ok(rel.length >= 1);
    assert.ok(rel.some(s => s.symbol === 'RELIANCE'));

    // Lowercase
    const tcs = SecurityMaster.search('tcs');
    assert.ok(tcs.some(s => s.symbol === 'TCS'));

    // Partial company name
    const hdfcMatches = SecurityMaster.search('hdfc');
    assert.ok(hdfcMatches.some(s => s.symbol === 'HDFCBANK'));

    // Sector search
    const bankingMatches = SecurityMaster.search('Financial', undefined, { limit: 500 });
    assert.ok(bankingMatches.length >= 4);
    assert.ok(bankingMatches.some(s => s.symbol === 'SBIN'));

    // ISIN search
    const isinMatches = SecurityMaster.search('INE002A01018');
    assert.ok(isinMatches.some(s => s.symbol === 'RELIANCE'));

    // BSE 6-digit code search
    const bseCodeMatches = SecurityMaster.search('500325');
    assert.ok(bseCodeMatches.some(s => s.symbol === 'RELIANCE'));
  });

  test('filters search results strictly by exchange and categories', () => {
    const nseStocks = SecurityMaster.search('', 'NSE');
    assert.ok(nseStocks.every(s => s.exchange === 'NSE'));

    const bseStocks = SecurityMaster.search('', 'BSE');
    assert.ok(bseStocks.every(s => s.exchange === 'BSE'));

    const allStocks = SecurityMaster.search('', 'ALL');
    assert.equal(allStocks.length, 100); // capped at default limit

    // SME category filter
    const smeStocks = SecurityMaster.search('', 'ALL', { category: 'SME', limit: 200 });
    assert.ok(smeStocks.length > 0);
    assert.ok(smeStocks.every(s => s.category === 'SME'));
  });

  test('paginates large catalogue query results without dropping records', () => {
    const page1 = SecurityMaster.searchPaginated('', 'ALL', 1, 25);
    assert.equal(page1.page, 1);
    assert.equal(page1.pageSize, 25);
    assert.equal(page1.items.length, 25);
    assert.ok(page1.total >= 8900);
    assert.ok(page1.totalPages >= 350);

    const page2 = SecurityMaster.searchPaginated('', 'ALL', 2, 25);
    assert.equal(page2.page, 2);
    assert.equal(page2.items.length, 25);
    // Ensure distinct items between pages
    assert.notEqual(page1.items[0].symbol, page2.items[0].symbol);
  });

  test('returns empty array when no security matches the query', () => {
    const nonExistent = SecurityMaster.search('XYZNONEXISTENT999');
    assert.deepEqual(nonExistent, []);
  });

  test('retrieves single security by exact symbol and handles invalid symbols', () => {
    const sec = SecurityMaster.getBySymbol('INFY');
    assert.ok(sec);
    assert.equal(sec?.symbol, 'INFY');
    assert.equal(sec?.isin, 'INE009A01021');

    const invalid = SecurityMaster.getBySymbol('NOT_A_SYMBOL');
    assert.equal(invalid, undefined);
  });

  test('supports dynamic catalogue refresh and entry registration', async () => {
    const testEntry = {
      symbol: 'TESTEQUITY',
      name: 'Test Equity Ltd.',
      exchange: 'NSE' as const,
      isin: 'INE999T01099',
      sector: 'Diversified',
      series: 'EQ',
      faceValue: 10
    };

    SecurityMaster.registerSecurities([testEntry]);
    const found = SecurityMaster.getBySymbol('TESTEQUITY', 'NSE');
    assert.ok(found);
    assert.equal(found?.name, 'Test Equity Ltd.');
  });
});

describe('TejHQ API Integration & EOD Bhavcopy Processing', () => {
  test('fetches data pipeline freshness status from TejHQ /v1/status', async () => {
    const status = await MarketDataService.getStatus();
    assert.ok(status.trading_date, 'Must include trading_date');
    assert.match(status.trading_date, /^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD');
    assert.ok(status.stage, 'Must report pipeline stage');
    
    const meta = MarketDataService.getMetadata();
    assert.equal(meta.isLive, false);
    assert.ok(meta.dataSource.includes('TejHQ'));
  });

  test('retrieves authentic EOD candles for RELIANCE from TejHQ endpoint', async () => {
    const result = await MarketDataService.getHistoricalCandles('RELIANCE', 'NSE', '1M');
    assert.ok(result.candles.length > 0, 'Expected >0 candles for RELIANCE');
    
    const latest = result.candles[result.candles.length - 1];
    assert.ok(latest.date, 'Candle must contain date string');
    assert.ok(latest.close > 0, 'Close price must be positive');
    assert.ok(latest.high >= latest.low, 'High must be >= low');
    assert.ok(latest.open > 0, 'Open must be positive');
    assert.ok(latest.volume >= 0, 'Volume must be non-negative');

    // Chronological ordering check
    for (let i = 1; i < result.candles.length; i++) {
      assert.ok(
        result.candles[i].date >= result.candles[i - 1].date,
        `Candles must be sorted chronologically: ${result.candles[i - 1].date} <= ${result.candles[i].date}`
      );
    }
  });

  test('retrieves authentic EOD candles for BSE securities', async () => {
    const result = await MarketDataService.getHistoricalCandles('RELIANCE', 'BSE', '1M');
    assert.ok(result.candles.length > 0, 'Expected >0 BSE candles for RELIANCE');
    const latest = result.candles[result.candles.length - 1];
    assert.ok(latest.close > 0);
  });

  test('handles nonexistent symbols cleanly without throwing', async () => {
    const result = await MarketDataService.getHistoricalCandles('NONEXISTENTSYM99', 'NSE', '1M');
    assert.deepEqual(result.candles, []);
    assert.ok(result.error);
  });

  test('retrieves real corporate actions for RELIANCE', async () => {
    const actions = await MarketDataService.getCorporateActions('RELIANCE');
    assert.ok(Array.isArray(actions));
    if (actions.length > 0) {
      const first = actions[0];
      assert.equal(first.symbol, 'RELIANCE');
      assert.ok(first.type);
      assert.ok(first.ex_date);
    }
  });

  test('buildQuoteFromCandles computes authentic metrics from candle series', () => {
    const mockCandles = [
      { date: '2026-10-22', timestamp: 1, open: 1200, high: 1210, low: 1190, close: 1205, volume: 5000000 },
      { date: '2026-10-23', timestamp: 2, open: 1205, high: 1220, low: 1200, close: 1215, volume: 6000000 },
      { date: '2026-10-26', timestamp: 3, open: 1215, high: 1230, low: 1210, close: 1225, volume: 7000000 }
    ];

    const quote = MarketDataService.buildQuoteFromCandles('RELIANCE', 'NSE', mockCandles);
    assert.equal(quote.symbol, 'RELIANCE');
    assert.equal(quote.ltp, 1225);
    assert.equal(quote.prevClose, 1215);
    assert.equal(quote.change, 10);
    assert.equal(quote.changePercent, 0.82);
    assert.equal(quote.week52High, 1230);
    assert.equal(quote.week52Low, 1190);
    assert.equal(quote.volume, 7000000);
    assert.equal(quote.avgVolume20D, 6000000);
  });
});

describe('Mathematical Indicators on Real Retrieved Prices', () => {
  test('computes valid RSI, MACD, moving averages, and risk metrics on real market candles', async () => {
    const result = await MarketDataService.getHistoricalCandles('RELIANCE', 'NSE', '1Y');
    assert.ok(result.candles.length >= 20, 'Requires at least 20 historical candles');

    const closes = result.candles.map(c => c.close);

    // RSI
    const rsi = calculateRSI(closes, 14);
    assert.equal(rsi.length, closes.length);
    const validRsi = rsi.filter((v): v is number => v !== null);
    assert.ok(validRsi.length > 0);
    for (const val of validRsi) {
      assert.ok(val >= 0 && val <= 100, `RSI ${val} must be between 0 and 100`);
    }

    // MACD
    const macd = calculateMACD(closes, 12, 26, 9);
    assert.equal(macd.macdLine.length, closes.length);
    assert.equal(macd.signalLine.length, closes.length);
    assert.equal(macd.histogram.length, closes.length);

    // EMA & SMA
    const ema20 = calculateEMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    assert.equal(ema20.length, closes.length);
    assert.equal(sma50.length, closes.length);

    // Risk Metrics
    const risk = calculateRiskMetrics(closes, 6.85);
    assert.ok(risk.annualizedVolatility >= 0, 'Volatility must be >= 0');
    assert.ok(risk.maxDrawdown <= 0, 'Max Drawdown must be <= 0');
    assert.ok(!isNaN(risk.sharpeRatio), 'Sharpe must be a valid number');
    assert.ok(risk.var95 <= 0, 'VaR(95%) must be <= 0');
    assert.ok(risk.cvar95 <= risk.var95, 'CVaR(95%) must be <= VaR(95%)');
  });
});
