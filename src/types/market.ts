/**
 * Core type definitions for NSE-BSE Market Analyzer
 * Educational quantitative analytics and AI/ML capstone project
 */

export type Exchange = 'NSE' | 'BSE';

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

export type PredictionHorizon = 'T+1' | 'T+5' | 'T+15';

export type NavigationTab = 
  | 'dashboard' 
  | 'explore'
  | 'watchlist'
  | 'stock-analysis' 
  | 'ai-predictions' 
  | 'gemini-chat'
  | 'stock-comparison' 
  | 'risk-analysis' 
  | 'reports' 
  | 'settings';

export interface CandleData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: string;
  ltp: number; // Last Traded Price
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number; // In shares
  avgVolume20D: number;
  vwap: number;
  marketCap: number; // In Crores INR
  peRatio: number;
  sectorPE: number;
  priceToBook: number;
  epsTTM: number;
  dividendYield: number;
  beta1Y: number;
  week52High: number;
  week52Low: number;
  faceValue: number;
  isin: string;
  deliveryPercent: number;
  aiSignal: 'Strong Buy' | 'Bullish' | 'Neutral' | 'Bearish';
  aiConfidence: number; // 0 - 100
  tradingDate?: string; // ISO YYYY-MM-DD
  dataSource?: string; // Official source attribution (e.g. BSE_UDIFF, TEJHQ_NSE_EOD)
  lastUpdated?: string; // Ingestion ISO timestamp
  isPriceAvailable?: boolean; // False if pending ingestion or illiquid
  isEOD?: boolean; // True for official end-of-day closing data
  turnover?: number; // Total traded value in INR
}

export interface MarketIndex {
  symbol: string;
  name: string;
  exchange: Exchange;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  sparkline: number[];
}

export interface CalculatedIndicators {
  sma20: (number | null)[];
  sma50: (number | null)[];
  ema20: (number | null)[];
  rsi14: (number | null)[];
  bollingerUpper: (number | null)[];
  bollingerLower: (number | null)[];
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number; // percentage, e.g. 28.4
  category: 'Trend' | 'Momentum' | 'Volume' | 'Volatility' | 'Lagged Return';
  description: string;
}

export interface ModelMetricComparison {
  metricName: string;
  linearOLS: string;
  randomForest: string;
  ensemble: string;
  isRFBetter?: boolean;
}

export interface ForecastResult {
  symbol: string;
  horizon: PredictionHorizon;
  horizonLabel: string;
  lastClose: number;
  projectedTarget: number;
  projectedDelta: number;
  projectedDeltaPercent: number;
  confidenceLower: number;
  confidenceUpper: number;
  signalDirection: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish';
  confidenceScore: number;
  historicalDates: string[];
  historicalPrices: number[];
  forecastDates: string[];
  forecastPrices: number[];
  forecastUpperBands: number[];
  forecastLowerBands: number[];
  residuals: { date: string; residual: number }[];
  featureImportances: FeatureImportanceItem[];
  modelMetrics: ModelMetricComparison[];
}
