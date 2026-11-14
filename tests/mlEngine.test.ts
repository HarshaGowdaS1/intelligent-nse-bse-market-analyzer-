import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildFeatureDataset, 
  RidgeRegression, 
  DecisionTreeRegressor, 
  RandomForestRegressor, 
  MLPipelineService 
} from '../src/services/mlEngine';
import { CandleData } from '../src/types/market';

describe('Machine Learning Engine (Supervised Regression & Evaluation)', () => {
  // Generate deterministic synthetic candlestick data for testing ML invariants
  const generateTestCandles = (count: number = 100): CandleData[] => {
    const candles: CandleData[] = [];
    let price = 1000;
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      const noise = Math.sin(i * 0.4) * 10 + Math.cos(i * 0.2) * 5;
      price = Math.max(50, price + noise);

      candles.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        open: price * 0.99,
        high: price * 1.02,
        low: price * 0.98,
        close: price,
        volume: 100000 + Math.floor(Math.sin(i) * 20000)
      });
    }
    return candles;
  };

  test('buildFeatureDataset extracts 8 causal features without throwing and aligns targets', () => {
    const candles = generateTestCandles(120);
    const dataset = buildFeatureDataset(candles);

    assert.ok(dataset.length > 50, 'Dataset must have sufficient rows');
    const firstRow = dataset[0];
    assert.equal(firstRow.features.length, 8, 'Must have exactly 8 engineered features');
    assert.ok(isFinite(firstRow.target), 'Target return must be finite');

    for (const row of dataset) {
      assert.ok(row.features.every(f => isFinite(f)), 'All feature values must be finite');
      assert.ok(isFinite(row.target), 'Target must be finite');
    }
  });

  test('Ridge Linear Regression trains and converges to low error on linear data', () => {
    // y = 2*x1 - 3*x2 + 1
    const X: number[][] = [];
    const y: number[] = [];

    for (let i = 0; i < 50; i++) {
      const x1 = i * 0.1;
      const x2 = (50 - i) * 0.05;
      X.push([x1, x2]);
      y.push(2 * x1 - 3 * x2 + 1);
    }

    const model = new RidgeRegression(0.001);
    model.train(X, y);

    const testX = [5.5, 1.2];
    const expected = 2 * 5.5 - 3 * 1.2 + 1; // 11 - 3.6 + 1 = 8.4
    const pred = model.predict(testX);

    assert.ok(Math.abs(pred - expected) < 1.0, `Expected ~${expected}, got ${pred}`);
  });

  test('DecisionTreeRegressor splits and outputs reasonable predictions', () => {
    const X = [[1], [2], [3], [10], [11], [12]];
    const y = [5, 6, 7, 50, 52, 54];

    const dt = new DecisionTreeRegressor(3, 2);
    dt.train(X, y);

    const predLow = dt.predict([2]);
    const predHigh = dt.predict([11]);

    assert.ok(predLow < 15, `Expected low prediction < 15, got ${predLow}`);
    assert.ok(predHigh > 40, `Expected high prediction > 40, got ${predHigh}`);
  });

  test('RandomForestRegressor computes Mean Decrease in Impurity (MDI) feature importances summing to 100%', () => {
    const candles = generateTestCandles(150);
    const dataset = buildFeatureDataset(candles);
    const X = dataset.map(d => d.features);
    const y = dataset.map(d => d.target);

    const rf = new RandomForestRegressor(10, 4);
    rf.train(X, y);

    const importances = rf.getFeatureImportances();
    assert.equal(importances.length, 8, 'Importances must correspond to 8 features');
    const sum = importances.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) < 1.5, `Sum of feature importances should be ~100%, got ${sum}`);
  });

  test('MLPipelineService runs end-to-end training with chronological split and outputs verified metrics', () => {
    const candles = generateTestCandles(150);
    const result = MLPipelineService.runTrainingAndForecast('TCS', candles, 'T+5', 'random-forest');

    assert.equal(result.symbol, 'TCS');
    assert.equal(result.horizon, 'T+5');
    assert.ok(result.metrics.mae >= 0, 'MAE must be non-negative');
    assert.ok(result.metrics.rmse >= 0, 'RMSE must be non-negative');
    assert.ok(result.metrics.trainSize > 0, 'Train size must be > 0');
    assert.ok(result.metrics.testSize > 0, 'Test size must be > 0');

    // Verify chronological train + test equals total valid dataset
    assert.ok(result.metrics.trainSize + result.metrics.testSize >= 90);

    // Verify multi-horizon forward projections
    assert.equal(result.forecastPrices.length, 5, 'T+5 horizon must output exactly 5 forecast points');
    assert.equal(result.forecastUpperBands.length, 5);
    assert.equal(result.forecastLowerBands.length, 5);

    // Confidence bands must encompass or bracket projected prices
    for (let i = 0; i < 5; i++) {
      assert.ok(result.forecastUpperBands[i] >= result.forecastPrices[i], 'Upper band must be >= forecast price');
      assert.ok(result.forecastLowerBands[i] <= result.forecastPrices[i], 'Lower band must be <= forecast price');
    }

    // Verify model comparison table
    assert.equal(result.modelComparison.length, 4, 'Must evaluate MAE, RMSE, MAPE, R2');
    assert.ok(result.featureImportances.length === 8);
  });
});
