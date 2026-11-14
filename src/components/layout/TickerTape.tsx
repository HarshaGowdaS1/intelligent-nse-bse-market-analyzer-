import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketIndex, StockQuote } from '../../types/market';

interface TickerTapeProps {
  indices: MarketIndex[];
  stocks: StockQuote[];
  onSelectStock?: (symbol: string) => void;
}

export const TickerTape: React.FC<TickerTapeProps> = ({ indices, stocks, onSelectStock }) => {
  const items = [
    ...indices.map(idx => ({
      key: `idx-${idx.symbol}`,
      label: idx.symbol,
      value: idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      change: `${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`,
      isPositive: idx.changePercent >= 0,
      isStock: false,
      symbol: idx.symbol
    })),
    ...stocks.slice(0, 10).map(stk => ({
      key: `stk-${stk.exchange}-${stk.symbol}`,
      label: stk.symbol,
      value: `₹${stk.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      change: `${stk.changePercent >= 0 ? '+' : ''}${stk.changePercent.toFixed(2)}%`,
      isPositive: stk.changePercent >= 0,
      isStock: true,
      symbol: stk.symbol
    }))
  ];

  return (
    <div className="h-9 bg-slate-100/90 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex items-center overflow-x-auto text-xs select-none px-4 scrollbar-none transition-colors">
      <div className="flex items-center gap-6 whitespace-nowrap py-1">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
          Exchange Rates
        </span>
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              if (item.isStock && onSelectStock) {
                onSelectStock(item.symbol);
              }
            }}
            className={`flex items-center gap-1.5 shrink-0 ${
              item.isStock ? 'cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors' : ''
            }`}
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">{item.value}</span>
            <span className={`font-mono font-semibold flex items-center text-[11px] ${
              item.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {item.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
