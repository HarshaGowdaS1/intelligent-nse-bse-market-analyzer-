/**
 * CSV Export Utility
 * Generates and triggers actual browser CSV downloads for quantitative data.
 */

export function generateCSVString(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  return [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = generateCSVString(headers, rows);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return csvContent;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return csvContent;
}

export function exportStocksScreenerToCSV(stocks: any[]) {
  const headers = [
    'Symbol',
    'Name',
    'Exchange',
    'Sector',
    'LTP (INR)',
    'Change',
    'Change (%)',
    'Open',
    'High',
    'Low',
    'Prev Close',
    'Volume',
    'VWAP',
    'PE Ratio',
    'Beta (1Y)',
    '52W High',
    '52W Low',
    'AI Signal',
    'AI Confidence (%)'
  ];

  const rows = stocks.map(s => [
    s.symbol,
    s.name,
    s.exchange,
    s.sector,
    s.ltp,
    s.change,
    s.changePercent,
    s.open,
    s.high,
    s.low,
    s.prevClose,
    s.volume,
    s.vwap,
    s.peRatio,
    s.beta1Y,
    s.week52High,
    s.week52Low,
    s.aiSignal,
    s.aiConfidence
  ]);

  downloadCSV(`NSE_BSE_Market_Screener_${new Date().toISOString().slice(0, 10)}`, headers, rows);
}

export function exportStockDataToCSV(symbol: string, candles: any[], indicators?: { name: string; values: (number | null)[] }[]) {
  const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
  if (indicators) {
    indicators.forEach(ind => headers.push(ind.name));
  }

  const rows = candles.map((c, idx) => {
    const row: (string | number)[] = [c.date, c.open, c.high, c.low, c.close, c.volume];
    if (indicators) {
      indicators.forEach(ind => {
        const val = ind.values[idx];
        row.push(val !== null && val !== undefined ? Number(val.toFixed(2)) : '');
      });
    }
    return row;
  });

  downloadCSV(`${symbol}_Historical_OHLCV_${new Date().toISOString().slice(0, 10)}`, headers, rows);
}

