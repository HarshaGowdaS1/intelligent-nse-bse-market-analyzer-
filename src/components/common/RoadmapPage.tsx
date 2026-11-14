import React from 'react';
import { 
  ShieldAlert, 
  GitCompare, 
  FileText, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Code2, 
  Layers 
} from 'lucide-react';
import { NavigationTab } from '../../types/market';

interface RoadmapPageProps {
  tab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ tab, onNavigate }) => {
  const getTabDetails = () => {
    switch (tab) {
      case 'risk-analysis':
        return {
          title: 'Risk Analysis & Stress Testing',
          icon: ShieldAlert,
          description: 'Historical Value at Risk (VaR 95%, 99%), Conditional VaR (CVaR), Maximum Underwater Drawdown, and macro stress test scenarios (Crude Surge, RBI Rate Hikes, Currency shocks).',
          modules: [
            'Underwater Drawdown & 30D Rolling Volatility Dynamics',
            'Return Distribution Histogram & Fat-Tail Kurtosis Warning',
            'Cross-Asset Beta & Correlation Matrix with NIFTY 50',
            'Macroeconomic Stress Testing (Crude Oil, Interest Rates, INR/USD)'
          ]
        };
      case 'stock-comparison':
        return {
          title: 'Multi-Asset Stock Comparison',
          icon: GitCompare,
          description: 'Normalized 1-Year performance delta matrix, pairwise log return correlation heatmap, liquidity depth profile, and factor comparison against benchmark indices.',
          modules: [
            'Rebased (100) Comparative Trajectory & Delta Matrix',
            'Quantitative & Risk Performance Comparison Matrix',
            'Pairwise Correlation Heatmap across Selected Equities',
            'Liquidity Structure & Delivery vs Turnover Breakdown'
          ]
        };
      case 'reports':
        return {
          title: 'Quantitative Intelligence Dossier & Reports',
          icon: FileText,
          description: 'Automated quantitative research synthesis memorandum generator. Export full academic research dossiers, OHLCV CSV matrices, and backtest results.',
          modules: [
            'Automated Quantitative Diagnostic Dossier Generation',
            'Institutional Risk & Drawdown Executive Profiles',
            'Model Feature Importance & Provenance Audit Logs',
            'Export to PDF / CSV / JSON Academic Archive'
          ]
        };
      case 'settings':
        return {
          title: 'Terminal Configurations & Feeds Architecture',
          icon: Settings,
          description: 'Configure national bourse execution feeds, regional currency scaling (Lakhs/Crores vs Western billions), default telemetry lookback horizons, and API connectors.',
          modules: [
            'Default Execution Bourse (NSE vs BSE primary routing)',
            'Indian Rupee (₹) Lakhs & Crores Number Formatting Engine',
            'High-Precision Float64 Vector Computation Engine',
            'Authorized Live Market Data Provider Connector Setup (Phase 2)'
          ]
        };
      default:
        return {
          title: 'Module Overview',
          icon: Layers,
          description: 'Scheduled for incremental rollout following Phase 1 verification.',
          modules: []
        };
    }
  };

  const details = getTabDetails();
  const Icon = details.icon;

  return (
    <div className="flex flex-col gap-5 pb-12 select-none">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] text-[#87929a] uppercase tracking-wider">
          Terminal Core
        </span>
        <span className="text-[#3e484f] text-[10px]">/</span>
        <span className="font-mono text-[10px] text-[#38bdf8] font-semibold uppercase tracking-wider">
          Architecture Roadmap
        </span>
      </div>

      <div className="p-6 rounded-xl bg-[#0d1c2d] border border-[#1c2b3c] shadow-lg flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#122131] border border-[#1c2b3c] flex items-center justify-center text-[#38bdf8] shadow-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#d4e4fa]">{details.title}</h1>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-semibold">
                  Phase 2 Incremental Rollout
                </span>
              </div>
              <p className="text-xs text-[#bdc8d1] max-w-2xl mt-1 leading-relaxed">
                {details.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-2 rounded-lg bg-[#38bdf8] text-[#00354a] font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all shadow-sm"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Planned Architecture Modules */}
        <div className="pt-4 border-t border-[#1c2b3c]">
          <h3 className="text-xs font-bold text-[#8ed5ff] uppercase tracking-wider font-mono mb-3">
            Planned Technical Specifications & Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.modules.map((mod, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#122131] border border-[#1c2b3c] flex items-center gap-3 text-xs text-[#d4e4fa]"
              >
                <div className="w-5 h-5 rounded bg-[#1c2b3c] flex items-center justify-center text-[#56e5a9] shrink-0 font-mono text-[10px]">
                  {idx + 1}
                </div>
                <span>{mod}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incremental Integration Info */}
        <div className="p-4 rounded-lg bg-[#010f1f] border border-[#1c2b3c] flex items-start gap-3 text-xs text-[#87929a]">
          <Code2 className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#d4e4fa]">Architectural Modularity:</span>
            <p className="leading-relaxed">
              As planned in the project brief, the application starts with a small, stable, and verified three-page core (Dashboard, Stock Analysis, and AI Predictions) alongside the user's Watchlist. Once validated, these remaining analytical capabilities will be connected directly to the existing <code className="text-[#8ed5ff] font-mono">MarketDataProvider</code> and <code className="text-[#8ed5ff] font-mono">indicators.ts</code> mathematical modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
