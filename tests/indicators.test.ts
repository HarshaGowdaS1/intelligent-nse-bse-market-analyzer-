import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateRiskMetrics,
  calculateBeta,
} from '../src/services/indicators';

describe('Technical Indicators & Financial Calculations', () => {
  describe('calculateSMA', () => {
    test('computes exact Simple Moving Average on a known series', () => {
      const prices = [10, 20, 30, 40, 50];
      const sma3 = calculateSMA(prices, 3);
      assert.equal(sma3.length, 5);
      // First 2 elements should be null (period 3 requires at least 3 elements)
      assert.equal(sma3[0], null);
      assert.equal(sma3[1], null);
      // sma3[2] = (10 + 20 + 30) / 3 = 20
      assert.equal(sma3[2], 20);
      // sma3[3] = (20 + 30 + 40) / 3 = 30
      assert.equal(sma3[3], 30);
      // sma3[4] = (30 + 40 + 50) / 3 = 40
      assert.equal(sma3[4], 40);
    });

    test('handles edge cases: empty array and period greater than length', () => {
      assert.deepEqual(calculateSMA([], 5), []);
      const small = [100, 105];
      const result = calculateSMA(small, 5);
      assert.equal(result.length, 2);
      assert.equal(result[0], null);
      assert.equal(result[1], null);
    });

    test('handles invalid inputs and non-positive periods gracefully', () => {
      assert.deepEqual(calculateSMA([10, 20], 0), []);
      assert.deepEqual(calculateSMA([10, 20], -1), []);
    });
  });

  describe('calculateEMA', () => {
    test('computes Exponential Moving Average with correct multiplier', () => {
      const prices = [10, 20, 30, 40, 50];
      const period = 3;
      const k = 2 / (period + 1); // 0.5
      const ema3 = calculateEMA(prices, period);

      assert.equal(ema3.length, 5);
      assert.equal(ema3[0], null);
      assert.equal(ema3[1], null);

      // Initial EMA is SMA of first 3 = 20
      assert.equal(ema3[2], 20);

      // Next EMA = (40 * 0.5) + (20 * 0.5) = 30
      assert.equal(ema3[3], 30);

      // Next EMA = (50 * 0.5) + (30 * 0.5) = 40
      assert.equal(ema3[4], 40);
    });

    test('handles edge case where period exceeds data length', () => {
      const shortSeries = [10, 20];
      const result = calculateEMA(shortSeries, 14);
      assert.deepEqual(result, [null, null]);
    });
  });

  describe('calculateRSI', () => {
    test('returns 50 for zero variance / flat price series', () => {
      const flat = [100, 100, 100, 100, 100, 100, 100];
      const rsi = calculateRSI(flat, 3);
      assert.equal(rsi.length, 7);
      // Prior to period, values should be null
      assert.equal(rsi[0], null);
      assert.equal(rsi[1], null);
      // Flat values must return 50 (neutral momentum)
      assert.equal(rsi[3], 50);
      assert.equal(rsi[4], 50);
      assert.equal(rsi[5], 50);
      assert.equal(rsi[6], 50);
    });

    test('returns 100 for strictly monotonic upward prices', () => {
      const upward = [10, 20, 30, 40, 50, 60, 70];
      const rsi = calculateRSI(upward, 3);
      const lastRSI = rsi[rsi.length - 1];
      assert.ok(lastRSI !== null && lastRSI === 100, `Expected 100, got ${lastRSI}`);
    });

    test('returns 0 for strictly monotonic downward prices', () => {
      const downward = [70, 60, 50, 40, 30, 20, 10];
      const rsi = calculateRSI(downward, 3);
      const lastRSI = rsi[rsi.length - 1];
      assert.ok(lastRSI !== null && lastRSI === 0, `Expected 0, got ${lastRSI}`);
    });

    test('handles empty and insufficient data without throwing', () => {
      assert.deepEqual(calculateRSI([], 14), []);
      assert.deepEqual(calculateRSI([100], 14), [null]);
    });
  });

  describe('calculateMACD', () => {
    test('generates MACD line, signal line, and histogram arrays matching input length', () => {
      // 40 price points
      const prices = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 2) * 10);
      const macd = calculateMACD(prices, 12, 26, 9);

      assert.equal(macd.macdLine.length, 40);
      assert.equal(macd.signalLine.length, 40);
      assert.equal(macd.histogram.length, 40);

      // Verify nulls during warm-up phase (slow period 26)
      assert.equal(macd.macdLine[0], null);
      assert.equal(macd.macdLine[24], null);
      // Point 25 is index 25 (26th item), so macdLine should be computed
      assert.ok(macd.macdLine[25] !== null, 'MACD line should exist at index 25');

      // Histogram = MACD - Signal
      const lastIdx = 39;
      if (macd.macdLine[lastIdx] !== null && macd.signalLine[lastIdx] !== null) {
        const expectedHist = macd.macdLine[lastIdx]! - macd.signalLine[lastIdx]!;
        assert.ok(
          Math.abs((macd.histogram[lastIdx] ?? 0) - expectedHist) < 0.0001,
          'Histogram should equal MACD - Signal'
        );
      }
    });

    test('handles insufficient points gracefully', () => {
      const short = [10, 12, 11];
      const macd = calculateMACD(short, 12, 26, 9);
      assert.deepEqual(macd.macdLine, [null, null, null]);
      assert.deepEqual(macd.signalLine, [null, null, null]);
      assert.deepEqual(macd.histogram, [null, null, null]);
    });
  });

  describe('calculateRiskMetrics', () => {
    test('computes risk metrics accurately with normalized risk-free rate', () => {
      // Known price sequence
      const prices = [100, 102, 101, 105, 107, 106, 110, 108, 112, 115];
      // Passing percentage 6.85 (which should be treated as 0.0685)
      const metricsPct = calculateRiskMetrics(prices, 6.85);
      // Passing decimal 0.0685
      const metricsDec = calculateRiskMetrics(prices, 0.0685);

      // Both should yield the exact same Sharpe and Sortino ratio
      assert.equal(metricsPct.sharpeRatio, metricsDec.sharpeRatio);
      assert.equal(metricsPct.sortinoRatio, metricsDec.sortinoRatio);

      // Annualized volatility must be positive and non-zero
      assert.ok(metricsPct.annualizedVolatility > 0);

      // Max drawdown is a negative percentage or zero
      assert.ok(metricsPct.maxDrawdown <= 0);

      // VaR 95% is a left-tail loss return (negative or zero)
      assert.ok(metricsPct.var95 <= 0);

      // CVaR 95% (expected shortfall in worst 5%) must be <= VaR 95%
      assert.ok(metricsPct.cvar95 <= metricsPct.var95);
    });

    test('handles zero volatility / flat prices without NaN or Infinity', () => {
      const flatPrices = [100, 100, 100, 100, 100];
      const metrics = calculateRiskMetrics(flatPrices, 6.85);

      assert.equal(metrics.annualizedVolatility, 0);
      assert.equal(metrics.maxDrawdown, 0);
      assert.equal(metrics.sharpeRatio, 0);
      assert.equal(metrics.sortinoRatio, 0);
      assert.equal(metrics.var95, 0);
      assert.equal(metrics.cvar95, 0);
    });

    test('handles insufficient points (length < 2)', () => {
      const emptyMetrics = calculateRiskMetrics([], 6.85);
      assert.equal(emptyMetrics.annualizedVolatility, 0);
      assert.equal(emptyMetrics.maxDrawdown, 0);

      const singleMetrics = calculateRiskMetrics([100], 6.85);
      assert.equal(singleMetrics.annualizedVolatility, 0);
      assert.equal(singleMetrics.maxDrawdown, 0);
    });

    test('calculates exact maximum drawdown correctly', () => {
      // Peak at 100, drops to 80 (drawdown of -20%), recovers to 90
      const prices = [100, 80, 90];
      const metrics = calculateRiskMetrics(prices, 0);
      assert.ok(
        Math.abs(metrics.maxDrawdown - (-20)) < 0.01,
        `Expected max drawdown -20%, got ${metrics.maxDrawdown}`
      );
    });
  });

  describe('calculateBeta', () => {
    test('returns 1.0 for an asset identical to its benchmark', () => {
      const series = [100, 105, 102, 108, 115, 110, 120];
      const beta = calculateBeta(series, series);
      assert.ok(
        Math.abs(beta - 1.0) < 0.001,
        `Expected beta of 1.0 for identical series, got ${beta}`
      );
    });

    test('returns negative beta for inversely moving return series', () => {
      // When benchmark moves +5%, asset moves -5%; when benchmark drops, asset rises
      const benchmark = [100, 105, 100, 106, 101, 107];
      const asset = [100, 95, 100, 94, 99, 93];
      const beta = calculateBeta(asset, benchmark);
      assert.ok(beta < 0, `Expected negative beta, got ${beta}`);
    });

    test('returns fallback 1.0 when benchmark variance is zero (flat benchmark)', () => {
      const asset = [100, 105, 110, 115];
      const flatBenchmark = [100, 100, 100, 100];
      const beta = calculateBeta(asset, flatBenchmark);
      assert.equal(beta, 1.0);
    });

    test('returns 1.0 on short or mismatched arrays', () => {
      assert.equal(calculateBeta([100], [100]), 1.0);
      assert.equal(calculateBeta([], []), 1.0);
    });
  });
});
