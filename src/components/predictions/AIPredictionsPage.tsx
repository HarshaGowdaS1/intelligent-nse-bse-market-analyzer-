import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  SlidersHorizontal,
  Activity,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import { StockQuote, PredictionHorizon, ForecastResult, Exchange } from '../../types/market';
import { SampleDataService } from '../../services/dataService';
import { MarketDataService } from '../../services/marketDataService';
import { MLPipelineService, TrainedModelResult } from '../../services/mlEngine';
import { SecurityMaster } from '../../services/securityMaster';

interface AIPredictionsPageProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  allStocks: StockQuote[];
  onNavigateToAnalysis: (symbol: string) => void;
  currentExchange?: Exchange;
  onExchangeChange?: (exchange: Exchange) => void;
}

export const AIPredictionsPage: React.FC<AIPredictionsPageProps> = ({
  selectedSymbol,
  onSelectSymbol,
  allStocks,
  onNavigateToAnalysis,
  currentExchange = 'NSE',
  onExchangeChange
}) => {
  const [horizon, setHorizon] = useState<PredictionHorizon>('T+1');
  const [modelType, setModelType] = useState<'random-forest' | 'linear-ols' | 'decision-tree' | 'ensemble'>('random-forest');
  const [rawMLResult, setRawMLResult] = useState<TrainedModelResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockSearch, setStockSearch] = useState('');

  const primaryStocks = currentExchange === 'BSE'
    ? ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ABB', 'ITC']
    : ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'TATAMOTORS'];

  const currentStock = allStocks.find(s => 
    s.symbol.toUpperCase() === selectedSymbol.toUpperCase() && 
    (!currentExchange || s.exchange === currentExchange)
  ) || allStocks.find(s => s.symbol.toUpperCase() === selectedSymbol.toUpperCase()) || allStocks[0];

  const [insufficientDataMsg, setInsufficientDataMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setInsufficientDataMsg(null);

    const exchange = currentExchange || currentStock?.exchange || 'NSE';

    MarketDataService.getHistoricalCandles(selectedSymbol, exchange, '1Y')
      .then((res: { candles: any[] }) => {
        if (!isMounted) return;
        const candles = res.candles;
        if (!candles || candles.length < 30) {
          setRawMLResult(null);
          setInsufficientDataMsg(
            `Insufficient genuine historical sessions (${candles?.length || 0} sessions available) in official exchange archives for ${exchange}:${selectedSymbol}. Supervised machine learning requires at least 30 chronological trading sessions to engineer causal momentum and volatility features without data leakage.`
          );
          setIsLoading(false);
          return;
        }

        const mlRes = MLPipelineService.runTrainingAndForecast(selectedSymbol, candles, horizon, modelType);
        setRawMLResult(mlRes);
        setIsLoading(false);
      })
      .catch((err: Error | any) => {
        if (!isMounted) return;
        console.error('ML Pipeline execution error:', err);
        setRawMLResult(null);
        setInsufficientDataMsg(`Could not load genuine historical dataset: ${err?.message || 'Unknown error'}`);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, horizon, modelType, currentExchange, currentStock?.exchange]);

  // Autocomplete search suggestions filtered by current exchange
  const searchResults = useMemo(() => {
    const q = stockSearch.trim();
    if (!q) return [];
    return SecurityMaster.searchPaginated(q, currentExchange || 'ALL', 1, 5).items;
  }, [stockSearch, currentExchange]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AI & Machine Learning Predictions
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              Supervised Learning
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Statistical price forecast models trained chronologically on historical technical and price action features.
          </p>
        </div>

        <button
          onClick={() => onNavigateToAnalysis(selectedSymbol)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>View Full Stock Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Stock and Model Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        {/* Quick Stock Selector Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onExchangeChange && (
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 mr-1">
                <button
                  type="button"
                  onClick={() => onExchangeChange('NSE')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    currentExchange === 'NSE'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  NSE
                </button>
                <button
                  type="button"
                  onClick={() => onExchangeChange('BSE')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                    currentExchange === 'BSE'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  BSE
                </button>
              </div>
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Select Stock:
            </span>
            {primaryStocks.map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedSymbol.toUpperCase() === sym
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Quick stock search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Search other stocks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((s) => (
                  <button
                    key={`${s.exchange}-${s.symbol}`}
                    onClick={() => {
                      onSelectSymbol(s.symbol);
                      setStockSearch('');
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className="font-mono text-slate-400">{s.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Model and Horizon Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Horizon Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Prediction Time Horizon
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHorizon('T+1')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  horizon === 'T+1'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Next Day (T+1)</div>
                <div className="text-[10px] text-slate-400 font-normal">Next trading session</div>
              </button>

              <button
                type="button"
                onClick={() => setHorizon('T+5')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  horizon === 'T+5'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">1 Week (T+5)</div>
                <div className="text-[10px] text-slate-400 font-normal">5 trading sessions</div>
              </button>

              <button
                type="button"
                onClick={() => setHorizon('T+15')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  horizon === 'T+15'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">3 Weeks (T+15)</div>
                <div className="text-[10px] text-slate-400 font-normal">Swing horizon</div>
              </button>
            </div>
          </div>

          {/* Model Algorithm Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Machine Learning Algorithm
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModelType('random-forest')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  modelType === 'random-forest'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Random Forest</div>
                <div className="text-[10px] text-slate-400 font-normal">Tree Ensemble (MDI)</div>
              </button>

              <button
                type="button"
                onClick={() => setModelType('linear-ols')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  modelType === 'linear-ols'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Ridge Regression</div>
                <div className="text-[10px] text-slate-400 font-normal">L2 Regularized Linear</div>
              </button>

              <button
                type="button"
                onClick={() => setModelType('decision-tree')}
                className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                  modelType === 'decision-tree'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Decision Tree</div>
                <div className="text-[10px] text-slate-400 font-normal">Recursive Partition</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Prediction Output Card */}
      {isLoading ? (
        <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mr-2"></div>
          Training model on chronological price features...
        </div>
      ) : rawMLResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Forecast Result Card (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Model Output Forecast
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedSymbol} · {horizon === 'T+1' ? 'Next Day Forecast' : horizon === 'T+5' ? '1 Week Forecast' : '3 Weeks Forecast'}
                </h2>
              </div>

              {/* Direction Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                rawMLResult.projectedDeltaPercent >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
              }`}>
                {rawMLResult.projectedDeltaPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{rawMLResult.signalDirection}</span>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 font-mono tabular-nums">
              <div>
                <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 block">
                  Last Closing Price
                </span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{rawMLResult.lastClose.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 block">
                  Model Estimated Target
                </span>
                <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  ₹{rawMLResult.projectedTarget.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 block">
                  Predicted Movement
                </span>
                <span className={`text-xl font-bold ${
                  rawMLResult.projectedDeltaPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {rawMLResult.projectedDeltaPercent >= 0 ? '+' : ''}{rawMLResult.projectedDeltaPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <div className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plain English Interpretation</span>
              </div>
              <p>
                The {modelType === 'random-forest' ? 'Random Forest Ensemble' : modelType === 'linear-ols' ? 'Ridge Linear Model' : 'Decision Tree'} analyzed the stock's recent price momentum, trading volume ratios, and 14-day volatility.
                Based on historical patterns, it projects a{' '}
                <strong>{rawMLResult.projectedDeltaPercent >= 0 ? 'potential upward movement' : 'potential downward correction'} of {Math.abs(rawMLResult.projectedDeltaPercent).toFixed(2)}%</strong>{' '}
                towards ₹{rawMLResult.projectedTarget.toFixed(2)} over the chosen {horizon} timeframe.
              </p>
            </div>

            {/* Top Influencing Features */}
            {rawMLResult.featureImportances && rawMLResult.featureImportances.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Top Factors Influencing This Prediction (MDI Importance)
                </span>
                <div className="space-y-1.5">
                  {rawMLResult.featureImportances.slice(0, 4).map((feat) => (
                    <div key={feat.feature} className="flex items-center gap-3 text-xs">
                      <span className="w-36 text-slate-500 dark:text-slate-400 truncate font-mono text-[11px]">
                        {feat.feature}
                      </span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, feat.importance))}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                        {feat.importance.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Accuracy & Evaluation Rigor (1 Col) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Model Evaluation Rigor
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Actual Test Error Metrics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluated on out-of-sample chronological test sets without lookahead bias.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="space-y-2.5 pt-1">
                {/* MAE */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                      MAE (Mean Absolute Error)
                    </span>
                    <span className="text-[10px] text-slate-400">Average error in Rupees</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    ₹{rawMLResult.metrics.mae.toFixed(2)}
                  </span>
                </div>

                {/* RMSE */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                      RMSE (Root Mean Square)
                    </span>
                    <span className="text-[10px] text-slate-400">Penalizes large deviations</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    ₹{rawMLResult.metrics.rmse.toFixed(2)}
                  </span>
                </div>

                {/* MAPE */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                      MAPE (Percentage Error)
                    </span>
                    <span className="text-[10px] text-slate-400">Relative prediction accuracy</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    {rawMLResult.metrics.mape.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Notice Box */}
            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Important Academic Disclaimer</span>
              </div>
              <p className="leading-normal">
                These estimates are mathematical approximations derived from historical price patterns. Market prices are inherently stochastic and influenced by macroeconomic factors. Never use algorithmic forecasts as financial advice.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Predictions Unavailable for {selectedSymbol}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            {insufficientDataMsg || `Historical exchange records for ${selectedSymbol} are insufficient (< 30 sessions) in official archives to train supervised machine learning models. Algorithmic forecasting is disabled to uphold strict mathematical integrity and prevent misleading predictions.`}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectSymbol('RELIANCE')}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
            >
              Switch to Active Benchmark (RELIANCE)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
