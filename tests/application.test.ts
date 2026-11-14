import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { UserStorageService } from '../src/services/userStorageService';
import { AuthService } from '../src/services/authService';
import { SampleDataService } from '../src/services/dataService';
import { generateCSVString } from '../src/utils/csvExport';
import { PredictionHorizon } from '../src/types/market';

describe('Application Core Features & Data Integrity', () => {
  beforeEach(async () => {
    // Reset auth session state before each test
    await AuthService.signOut();
  });

  describe('UserStorageService: Multi-User Isolation & Preferences', () => {
    test('strictly isolates watchlists between two distinct users', () => {
      const userAId = 'user_audit_alice_123';
      const userBId = 'user_audit_bob_456';

      // Seed User A's watchlist
      UserStorageService.saveUserWatchlist(userAId, ['RELIANCE', 'TCS']);
      assert.deepEqual(UserStorageService.getUserWatchlist(userAId), ['RELIANCE', 'TCS']);

      // Ensure User B defaults to system default watchlist, unaffected by User A
      const userBWatchlist = UserStorageService.getUserWatchlist(userBId);
      assert.ok(!userBWatchlist.includes('RELIANCE') || userBWatchlist.length !== 2);

      // Modify User B's watchlist
      UserStorageService.addToWatchlist(userBId, 'HDFCBANK');
      assert.ok(UserStorageService.getUserWatchlist(userBId).includes('HDFCBANK'));

      // Ensure User A's watchlist remains unchanged
      assert.deepEqual(UserStorageService.getUserWatchlist(userAId), ['RELIANCE', 'TCS']);
    });

    test('adds and removes tickers safely without duplicates', () => {
      const tempUser = 'test_user_actions';
      UserStorageService.saveUserWatchlist(tempUser, ['INFY']);

      // Add INFY again - shouldn't duplicate
      UserStorageService.addToWatchlist(tempUser, 'INFY');
      assert.deepEqual(UserStorageService.getUserWatchlist(tempUser), ['INFY']);

      // Add SBIN
      UserStorageService.addToWatchlist(tempUser, 'SBIN');
      assert.deepEqual(UserStorageService.getUserWatchlist(tempUser), ['INFY', 'SBIN']);

      // Remove INFY
      UserStorageService.removeFromWatchlist(tempUser, 'INFY');
      assert.deepEqual(UserStorageService.getUserWatchlist(tempUser), ['SBIN']);
    });
  });

  describe('AuthService: Client-side Prototype Authentication Flow', () => {
    test('registers a new user and logs in with correct credentials', async () => {
      const email = `audit_${Date.now()}@example.com`;
      const password = 'SecurePassword123!';
      const displayName = 'Audit Engineer';

      const user = await AuthService.signUp(email, password, displayName);
      assert.equal(user.email, email);
      assert.equal(user.displayName, displayName);
      assert.ok(user.uid.startsWith('usr_'));

      // Sign out
      await AuthService.signOut();
      assert.equal(AuthService.getCurrentUser(), null);

      // Sign in with valid credentials
      const loggedIn = await AuthService.signIn(email, password);
      assert.equal(loggedIn.uid, user.uid);
      assert.equal(loggedIn.email, email);
    });

    test('rejects login with incorrect password', async () => {
      const email = `fail_login_${Date.now()}@example.com`;
      await AuthService.signUp(email, 'CorrectPass123', 'Pass Test');

      await assert.rejects(
        async () => {
          await AuthService.signIn(email, 'WrongPass999');
        },
        /Incorrect password/
      );
    });

    test('updates user profile display name for active session', async () => {
      const email = `profile_upd_${Date.now()}@example.com`;
      await AuthService.signUp(email, 'Pass12345', 'Initial Name');

      const updated = await AuthService.updateProfile({ displayName: 'Updated Name' });
      assert.equal(updated.displayName, 'Updated Name');
    });

    test('simulates password reset token generation and completion', async () => {
      const email = `reset_${Date.now()}@example.com`;
      await AuthService.signUp(email, 'OriginalPass123', 'Reset Test');

      const { token } = await AuthService.requestPasswordReset(email);
      assert.ok(token && token.length > 5);

      await AuthService.completePasswordReset(email, token, 'NewPassword999');

      // Verify old password fails and new password succeeds
      await assert.rejects(async () => {
        await AuthService.signIn(email, 'OriginalPass123');
      });

      const loggedIn = await AuthService.signIn(email, 'NewPassword999');
      assert.equal(loggedIn.email, email);
    });
  });

  describe('SampleDataService & Exchange / Timeframe Capabilities', () => {
    test('returns consistent historical candle data for all registered Indian stocks', async () => {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'TATAMOTORS'];
      for (const symbol of symbols) {
        const candles = await SampleDataService.getHistoricalCandles(symbol, '1Y');
        assert.ok(candles.length >= 15, `Expected >=15 candles for ${symbol}, got ${candles.length}`);
        
        // Check candle integrity
        const first = candles[0];
        assert.ok(first.date, 'Candle must contain date');
        assert.ok(first.open > 0, 'Open must be positive');
        assert.ok(first.high >= first.low, 'High must be >= low');
        assert.ok(first.close > 0, 'Close must be positive');
        assert.ok(first.volume >= 0, 'Volume must be non-negative');
      }
    });

    test('stock quote catalog provides comprehensive fundamental and technical metadata', async () => {
      const stocks = await SampleDataService.getStocks();
      assert.ok(stocks.length >= 6);
      for (const stock of stocks) {
        assert.ok(stock.symbol);
        assert.ok(stock.ltp > 0);
        assert.ok(stock.peRatio > 0);
        assert.ok(stock.week52High >= stock.week52Low);
        assert.ok(stock.aiConfidence >= 0 && stock.aiConfidence <= 100);
      }
    });

    test('generates transparent AI forecast horizons for T+1, T+5, and T+15', async () => {
      const horizons: PredictionHorizon[] = ['T+1', 'T+5', 'T+15'];
      for (const h of horizons) {
        const forecast = await SampleDataService.getForecast('TCS', h);
        assert.equal(forecast.horizon, h);
        assert.equal(forecast.symbol, 'TCS');
        assert.ok(forecast.projectedTarget > 0);
        assert.ok(forecast.confidenceLower < forecast.confidenceUpper);
        assert.ok(forecast.confidenceScore > 0 && forecast.confidenceScore <= 100);
        assert.ok(forecast.forecastPrices.length > 0);
        assert.ok(forecast.featureImportances.length > 0);
        assert.ok(forecast.modelMetrics.length > 0);
      }
    });

    test('explicitly marks data source as academic demonstration or TejHQ without live claim', () => {
      const meta = SampleDataService.getMetadata();
      assert.equal(meta.isLive, false);
      assert.ok(meta.dataSource.includes('TejHQ') || meta.dataSource.includes('Demonstration') || meta.dataSource.includes('Academic'));
    });
  });

  describe('CSV Export Utilities', () => {
    test('generateCSVString formats headers and rows without corruption', () => {
      const headers = ['Symbol', 'Price', 'Change %', 'Company Name'];
      const rows = [
        ['RELIANCE', '2942.50', '+1.25%', 'Reliance Industries, Ltd.'],
        ['TCS', '3890.10', '-0.40%', 'Tata Consultancy Services']
      ];

      const csvString = generateCSVString(headers, rows);
      assert.ok(csvString.includes('"Symbol","Price","Change %","Company Name"'));
      // Check that comma inside "Reliance Industries, Ltd." was properly quoted
      assert.ok(csvString.includes('"Reliance Industries, Ltd."'));
      assert.ok(csvString.includes('"2942.50"'));
    });
  });

  describe('Stock Key Uniqueness & Catalogue Integrity', () => {
    test('INITIAL_STOCKS contains strictly unique symbols with no duplicate keys', async () => {
      const stocks = await SampleDataService.getStocks();
      const symbolCounts = new Map<string, number>();

      for (const stock of stocks) {
        const count = symbolCounts.get(stock.symbol) || 0;
        symbolCounts.set(stock.symbol, count + 1);
      }

      // Assert no duplicate symbols exist
      const duplicates = Array.from(symbolCounts.entries()).filter(([_, count]) => count > 1);
      assert.deepEqual(duplicates, [], `Found duplicate symbols in stocks: ${JSON.stringify(duplicates)}`);

      // Specifically verify TATAMOTORS and KOTAKBANK appear exactly once
      assert.equal(symbolCounts.get('TATAMOTORS'), 1, 'TATAMOTORS must appear exactly once');
      assert.equal(symbolCounts.get('KOTAKBANK'), 1, 'KOTAKBANK must appear exactly once');
      assert.equal(symbolCounts.get('RELIANCE'), 1, 'RELIANCE must appear exactly once');
      assert.equal(symbolCounts.get('TCS'), 1, 'TCS must appear exactly once');
    });

    test('compound keys formatted as exchange-symbol are strictly unique', async () => {
      const stocks = await SampleDataService.getStocks();
      const compoundKeys = stocks.map(s => `${s.exchange}-${s.symbol}`);
      const uniqueKeys = new Set(compoundKeys);
      assert.equal(compoundKeys.length, uniqueKeys.size, 'All compound keys must be unique');
    });
  });
});

