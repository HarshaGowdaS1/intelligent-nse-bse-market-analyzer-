/**
 * Quantitative Technical Indicators Engine
 * Separated mathematical calculation module for SMA, EMA, RSI, Bollinger Bands, MACD, and Risk Metrics.
 * All calculations are executed deterministically on the underlying OHLCV vector data.
 */

/**
 * Calculates Simple Moving Average (SMA)
 * @param values Array of numerical values (usually close prices)
 * @param period Lookback window size (e.g. 20, 50, 200)
 * @returns Array matching length of values, with null for elements prior to period completion
 */
export function calculateSMA(values: number[], period: number): (number | null)[] {
  if (!values || values.length === 0 || period <= 0) {
    return [];
  }

  const result: (number | null)[] = new Array(values.length).fill(null);

  if (values.length < period) {
    return result;
  }

  let rollingSum = 0;
  for (let i = 0; i < period; i++) {
    rollingSum += values[i];
  }

  result[period - 1] = Number((rollingSum / period).toFixed(2));

  for (let i = period; i < values.length; i++) {
    rollingSum += values[i] - values[i - period];
    result[i] = Number((rollingSum / period).toFixed(2));
  }

  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 * Multiplier k = 2 / (period + 1)
 * Initial seed: SMA of first `period` elements
 * Recursive: EMA = (Price * k) + (Previous_EMA * (1 - k))
 */
export function calculateEMA(values: number[], period: number): (number | null)[] {
  if (!values || values.length === 0 || period <= 0) {
    return [];
  }

  const result: (number | null)[] = new Array(values.length).fill(null);

  if (values.length < period) {
    return result;
  }

  const k = 2 / (period + 1);

  // Initial SMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let currentEMA = sum / period;
  result[period - 1] = Number(currentEMA.toFixed(2));

  for (let i = period; i < values.length; i++) {
    currentEMA = values[i] * k + currentEMA * (1 - k);
    result[i] = Number(currentEMA.toFixed(2));
  }

  return result;
}

/**
 * Calculates Wilder's Relative Strength Index (RSI)
 * Standard default period: 14 sessions
 * Scale: 0 to 100
 * Handles zero variance, monotonic climbs/falls, and edge cases.
 */
export function calculateRSI(values: number[], period: number = 14): (number | null)[] {
  if (!values || values.length <= period || period <= 0) {
    return new Array(values ? values.length : 0).fill(null);
  }

  const result: (number | null)[] = new Array(values.length).fill(null);

  let initialGains = 0;
  let initialLosses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) {
      initialGains += diff;
    } else if (diff < 0) {
      initialLosses += Math.abs(diff);
    }
  }

  let avgGain = initialGains / period;
  let avgLoss = initialLosses / period;

  if (avgGain === 0 && avgLoss === 0) {
    result[period] = 50; // Zero variance flat series: neutral momentum
  } else if (avgLoss === 0) {
    result[period] = 100; // All gains
  } else if (avgGain === 0) {
    result[period] = 0; // All losses
  } else {
    const rs = avgGain / avgLoss;
    result[period] = Number((100 - 100 / (1 + rs)).toFixed(2));
  }

  // Wilder's smoothing technique for remaining periods
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgGain === 0 && avgLoss === 0) {
      result[i] = 50;
    } else if (avgLoss === 0) {
      result[i] = 100;
    } else if (avgGain === 0) {
      result[i] = 0;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = Number((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  return result;
}

/**
 * Calculates Bollinger Bands (Upper, Middle SMA, Lower)
 */
export function calculateBollingerBands(
  values: number[],
  period: number = 20,
  multiplier: number = 2
): {
  upper: (number | null)[];
  lower: (number | null)[];
  middle: (number | null)[];
} {
  if (!values || values.length === 0 || period <= 0) {
    return { upper: [], lower: [], middle: [] };
  }

  const middle = calculateSMA(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const mid = middle[i];
    if (mid === null) continue;

    // Calculate variance over window
    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const dev = values[j] - mid;
      sumSquares += dev * dev;
    }
    const stdDev = Math.sqrt(sumSquares / period);

    upper[i] = Number((mid + multiplier * stdDev).toFixed(2));
    lower[i] = Number((mid - multiplier * stdDev).toFixed(2));
  }

  return { upper, lower, middle };
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 * Standard parameters: fast = 12, slow = 26, signal = 9
 */
export function calculateMACD(
  values: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  if (!values || values.length === 0) {
    return { macdLine: [], signalLine: [], histogram: [] };
  }

  const fastEMA = calculateEMA(values, fastPeriod);
  const slowEMA = calculateEMA(values, slowPeriod);
  const macdLine: (number | null)[] = new Array(values.length).fill(null);

  for (let i = 0; i < values.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = Number((fastEMA[i]! - slowEMA[i]!).toFixed(2));
    }
  }

  // Calculate signal line as EMA of valid macdLine values
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      validMacdValues.push(macdLine[i]!);
      validIndices.push(i);
    }
  }

  const signalLine: (number | null)[] = new Array(values.length).fill(null);
  const histogram: (number | null)[] = new Array(values.length).fill(null);

  if (validMacdValues.length >= signalPeriod) {
    const validSignal = calculateEMA(validMacdValues, signalPeriod);
    for (let k = 0; k < validSignal.length; k++) {
      const originalIdx = validIndices[k];
      signalLine[originalIdx] = validSignal[k];
      if (signalLine[originalIdx] !== null && macdLine[originalIdx] !== null) {
        histogram[originalIdx] = Number((macdLine[originalIdx]! - signalLine[originalIdx]!).toFixed(2));
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Computes Floor Pivot Points (PP, S1, S2, R1, R2)
 */
export function calculatePivotPoints(high: number, low: number, close: number) {
  const pp = Number(((high + low + close) / 3).toFixed(2));
  const r1 = Number((2 * pp - low).toFixed(2));
  const s1 = Number((2 * pp - high).toFixed(2));
  const r2 = Number((pp + (high - low)).toFixed(2));
  const s2 = Number((pp - (high - low)).toFixed(2));

  return { pp, r1, s1, r2, s2 };
}

export interface RiskMetricsResult {
  dailyMeanReturn: number; // percentage
  dailyStdDev: number; // percentage
  annualizedVolatility: number; // percentage
  maxDrawdown: number; // percentage (negative or zero)
  var95: number; // percentage (negative or zero)
  var99: number; // percentage (negative or zero)
  cvar95: number; // percentage (negative or zero, Expected Shortfall)
  sharpeRatio: number; // Rf benchmark normalized
  sortinoRatio: number;
  calmarRatio: number;
}

/**
 * Calculates empirical quantitative risk metrics from price series
 * Documented assumptions:
 * - 252 annual trading sessions
 * - Benchmark Risk-free rate Rf (default 6.85% for RBI 10Y Sovereign yield)
 * - Normalizes Rf whether supplied as decimal (0.0685) or percentage (6.85)
 * - Historical Simulation method for VaR and CVaR
 */
export function calculateRiskMetrics(
  closePrices: number[],
  riskFreeRate: number = 0.0685
): RiskMetricsResult {
  // Edge case: empty or invalid prices
  if (!closePrices || !Array.isArray(closePrices)) {
    return {
      dailyMeanReturn: 0,
      dailyStdDev: 0,
      annualizedVolatility: 0,
      maxDrawdown: 0,
      var95: 0,
      var99: 0,
      cvar95: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0
    };
  }

  // Filter valid positive finite numbers
  const cleanPrices = closePrices.filter(p => typeof p === 'number' && isFinite(p) && p > 0);

  if (cleanPrices.length < 2) {
    return {
      dailyMeanReturn: 0,
      dailyStdDev: 0,
      annualizedVolatility: 0,
      maxDrawdown: 0,
      var95: 0,
      var99: 0,
      cvar95: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0
    };
  }

  // Normalize Rf: if user or caller passed 6.85, treat as 6.85% = 0.0685
  const rf = riskFreeRate > 1 ? riskFreeRate / 100 : Math.max(0, riskFreeRate);

  // 1. Calculate daily simple returns: R_t = (P_t - P_{t-1}) / P_{t-1}
  const returns: number[] = [];
  for (let i = 1; i < cleanPrices.length; i++) {
    returns.push((cleanPrices[i] - cleanPrices[i - 1]) / cleanPrices[i - 1]);
  }

  // 2. Mean and Standard Deviation
  const sum = returns.reduce((acc, r) => acc + r, 0);
  const mean = sum / returns.length;

  let sumSquares = 0;
  let downsideSumSquares = 0;
  for (const r of returns) {
    const diff = r - mean;
    sumSquares += diff * diff;
    if (r < 0) {
      downsideSumSquares += r * r;
    }
  }

  const dailyVariance = returns.length > 1 ? sumSquares / (returns.length - 1) : 0;
  const dailyStdDev = Math.sqrt(dailyVariance);
  const annualizedVolatility = dailyStdDev * Math.sqrt(252);

  // 3. Maximum Drawdown (MDD)
  let peak = cleanPrices[0];
  let maxDd = 0;
  for (const price of cleanPrices) {
    if (price > peak) {
      peak = price;
    }
    const dd = (price - peak) / peak;
    if (dd < maxDd) {
      maxDd = dd;
    }
  }

  // 4. Value at Risk (Historical Percentile Method)
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const idx95 = Math.min(sortedReturns.length - 1, Math.floor(sortedReturns.length * 0.05));
  const idx99 = Math.min(sortedReturns.length - 1, Math.floor(sortedReturns.length * 0.01));
  const var95 = sortedReturns[idx95] ?? 0;
  const var99 = sortedReturns[idx99] ?? 0;

  // 5. Conditional Value at Risk (CVaR 95% - average of returns in worst 5% tail)
  const tailCount = Math.max(1, idx95 + 1);
  const tailReturns = sortedReturns.slice(0, tailCount);
  const cvar95 = tailReturns.reduce((acc, r) => acc + r, 0) / tailReturns.length;

  // 6. Annualized Return (CAGR approximation)
  const totalReturn = (cleanPrices[cleanPrices.length - 1] - cleanPrices[0]) / cleanPrices[0];
  const years = Math.max(1 / 252, returns.length / 252);
  const annualizedReturn = Math.pow(Math.max(0.0001, 1 + totalReturn), 1 / years) - 1;

  // 7. Sharpe Ratio: (Annualized Return - Rf) / Annualized Volatility
  const sharpeRatio = annualizedVolatility > 0
    ? (annualizedReturn - rf) / annualizedVolatility
    : 0;

  // 8. Sortino Ratio (downside volatility based)
  const downsideVariance = returns.length > 1 ? downsideSumSquares / (returns.length - 1) : 0;
  const downsideStdDev = Math.sqrt(downsideVariance) * Math.sqrt(252);
  const sortinoRatio = downsideStdDev > 0
    ? (annualizedReturn - rf) / downsideStdDev
    : 0;

  // 9. Calmar Ratio: Annualized Return / |Max Drawdown|
  const calmarRatio = Math.abs(maxDd) > 0 ? annualizedReturn / Math.abs(maxDd) : 0;

  return {
    dailyMeanReturn: Number((mean * 100).toFixed(2)),
    dailyStdDev: Number((dailyStdDev * 100).toFixed(2)),
    annualizedVolatility: Number((annualizedVolatility * 100).toFixed(2)),
    maxDrawdown: Number((maxDd * 100).toFixed(2)),
    var95: Number((var95 * 100).toFixed(2)),
    var99: Number((var99 * 100).toFixed(2)),
    cvar95: Number((cvar95 * 100).toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    calmarRatio: Number(calmarRatio.toFixed(2))
  };
}

/**
 * Calculates Beta relative to benchmark index returns
 */
export function calculateBeta(stockPrices: number[], benchmarkPrices: number[]): number {
  if (!stockPrices || !benchmarkPrices) return 1.0;
  const len = Math.min(stockPrices.length, benchmarkPrices.length);
  if (len < 3) return 1.0;

  const stockReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let i = 1; i < len; i++) {
    const sPrev = stockPrices[i - 1];
    const bPrev = benchmarkPrices[i - 1];
    if (sPrev <= 0 || bPrev <= 0 || !isFinite(stockPrices[i]) || !isFinite(benchmarkPrices[i])) {
      continue;
    }
    stockReturns.push((stockPrices[i] - sPrev) / sPrev);
    benchmarkReturns.push((benchmarkPrices[i] - bPrev) / bPrev);
  }

  if (stockReturns.length < 2) return 1.0;

  const meanStock = stockReturns.reduce((a, b) => a + b, 0) / stockReturns.length;
  const meanBenchmark = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;

  let covariance = 0;
  let benchmarkVariance = 0;

  for (let i = 0; i < stockReturns.length; i++) {
    const sDiff = stockReturns[i] - meanStock;
    const bDiff = benchmarkReturns[i] - meanBenchmark;
    covariance += sDiff * bDiff;
    benchmarkVariance += bDiff * bDiff;
  }

  if (benchmarkVariance === 0) return 1.0;
  return Number((covariance / benchmarkVariance).toFixed(2));
}
