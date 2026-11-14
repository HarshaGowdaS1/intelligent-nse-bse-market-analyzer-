import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AuthService } from '../src/services/authService';
import { UserStorageService, DEFAULT_PREFERENCES, DEFAULT_INITIAL_WATCHLIST } from '../src/services/userStorageService';

describe('Phase 2: Cloud Firestore & Firebase Authentication Integration', () => {
  describe('1. Configuration & Security Rules Verification', () => {
    test('firebase-applet-config.json exists and contains acquired-anvil-l5v9p project', () => {
      const configPath = resolve(process.cwd(), 'firebase-applet-config.json');
      assert.ok(existsSync(configPath), 'firebase-applet-config.json must exist');
      
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      assert.equal(config.projectId, 'acquired-anvil-l5v9p');
      assert.ok(config.firestoreDatabaseId.includes('396612bf-a512-48de-9429-43a306211168'));
      assert.ok(config.apiKey && config.apiKey.length > 10);
    });

    test('firestore.rules enforces strict user data isolation and attribute validation', () => {
      const rulesPath = resolve(process.cwd(), 'firestore.rules');
      assert.ok(existsSync(rulesPath), 'firestore.rules must exist');
      
      const rules = readFileSync(rulesPath, 'utf-8');
      assert.ok(rules.includes('request.auth != null'), 'Must require authentication');
      assert.ok(rules.includes('request.auth.uid == userId'), 'Must enforce user data isolation');
      assert.ok(rules.includes('match /users/{userId}'), 'Must govern user profile documents');
      assert.ok(rules.includes('match /watchlists/{watchlistId}'), 'Must govern user watchlists');
      assert.ok(rules.includes('match /preferences/{preferenceId}'), 'Must govern user preferences');
      assert.ok(rules.includes('match /comparisons/{comparisonId}'), 'Must govern saved comparisons');
    });

    test('firebase-blueprint.json provides valid schema metadata', () => {
      const blueprintPath = resolve(process.cwd(), 'firebase-blueprint.json');
      assert.ok(existsSync(blueprintPath), 'firebase-blueprint.json must exist');
      
      const blueprint = JSON.parse(readFileSync(blueprintPath, 'utf-8'));
      assert.ok(blueprint.entities.UserProfile, 'Must define UserProfile entity');
      assert.ok(blueprint.entities.Watchlist, 'Must define Watchlist entity');
      assert.ok(blueprint.entities.UserPreferences, 'Must define UserPreferences entity');
      assert.ok(blueprint.entities.StockComparison, 'Must define StockComparison entity');
    });
  });

  describe('2. Authentication State & Session Lifecycle', () => {
    test('registers a user, maintains active profile, and supports clean logout', async () => {
      const testEmail = `quant_${Date.now()}@testdomain.org`;
      const testPass = 'SecureQuantPass123!';
      const testName = 'Dev Quantitative Analyst';

      const user = await AuthService.signUp(testEmail, testPass, testName);
      assert.equal(user.email, testEmail);
      assert.equal(user.displayName, testName);
      assert.equal(user.roleTitle, 'Quantitative Analyst');

      const current = AuthService.getCurrentUser();
      assert.ok(current);
      assert.equal(current?.email, testEmail);

      // Sign out
      await AuthService.signOut();
      assert.equal(AuthService.getCurrentUser(), null);
    });

    test('prevents duplicate account registration with same email', async () => {
      const duplicateEmail = `dupe_${Date.now()}@testdomain.org`;
      await AuthService.signUp(duplicateEmail, 'PasswordA123', 'First User');

      await assert.rejects(
        async () => {
          await AuthService.signUp(duplicateEmail, 'PasswordB456', 'Second User');
        },
        /already exists/
      );
    });

    test('authenticates registered user with valid password and rejects incorrect password', async () => {
      const email = `auth_test_${Date.now()}@testdomain.org`;
      const correctPass = 'MyStrongSecretPassword!';
      await AuthService.signUp(email, correctPass, 'Tester');

      // Logout
      await AuthService.signOut();

      // Attempt with wrong password
      await assert.rejects(
        async () => {
          await AuthService.signIn(email, 'WrongPassTotally');
        },
        /Incorrect password/
      );

      // Attempt with correct password
      const loggedIn = await AuthService.signIn(email, correctPass);
      assert.equal(loggedIn.email, email);
    });
  });

  describe('3. Cloud Watchlist & Storage Multi-User Isolation', () => {
    test('isolates watchlists between user accounts and defaults gracefully for new users', () => {
      const userAlpha = `user_alpha_${Date.now()}`;
      const userBeta = `user_beta_${Date.now()}`;

      // User Alpha sets custom portfolio
      UserStorageService.saveUserWatchlist(userAlpha, ['TCS', 'WIPRO', 'INFY']);
      const alphaList = UserStorageService.getUserWatchlist(userAlpha);
      assert.deepEqual(alphaList, ['TCS', 'WIPRO', 'INFY']);

      // User Beta starts with initial default portfolio
      const betaList = UserStorageService.getUserWatchlist(userBeta);
      assert.deepEqual(betaList, DEFAULT_INITIAL_WATCHLIST);

      // User Beta customizes without affecting User Alpha
      UserStorageService.addToWatchlist(userBeta, 'TATAMOTORS');
      assert.ok(UserStorageService.getUserWatchlist(userBeta).includes('TATAMOTORS'));
      assert.deepEqual(UserStorageService.getUserWatchlist(userAlpha), ['TCS', 'WIPRO', 'INFY']);
    });

    test('preserves user preferences and isolates them between accounts', () => {
      const userGamma = `user_gamma_${Date.now()}`;
      const defaultPrefs = UserStorageService.getUserPreferences(userGamma);
      assert.equal(defaultPrefs.defaultExchange, 'NSE');

      // Update gamma preferences
      UserStorageService.saveUserPreferences(userGamma, {
        defaultExchange: 'BSE',
        defaultTimeframe: '6M',
        currencyFormat: 'standard',
        highPrecisionMode: false,
        activeHorizon: 'T+5'
      });

      const updatedPrefs = UserStorageService.getUserPreferences(userGamma);
      assert.equal(updatedPrefs.defaultExchange, 'BSE');
      assert.equal(updatedPrefs.defaultTimeframe, '6M');
      assert.equal(updatedPrefs.activeHorizon, 'T+5');
    });

    test('manages saved comparisons with unique identifiers', () => {
      const userId = `comp_user_${Date.now()}`;
      const compId = UserStorageService.saveComparison(userId, 'RELIANCE', 'TCS', '1Y');
      assert.ok(compId && compId.length > 0);

      const saved = UserStorageService.getSavedComparisons(userId);
      assert.ok(saved.length >= 1);
      assert.equal(saved[0].symbolA, 'RELIANCE');
      assert.equal(saved[0].symbolB, 'TCS');

      // Delete comparison
      UserStorageService.deleteComparison(userId, compId);
      const remaining = UserStorageService.getSavedComparisons(userId);
      assert.equal(remaining.length, 0);
    });
  });
});
