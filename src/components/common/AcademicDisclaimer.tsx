import React from 'react';
import { ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { DATA_METADATA } from '../../services/dataService';

interface AcademicDisclaimerProps {
  compact?: boolean;
}

export const AcademicDisclaimer: React.FC<AcademicDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0d1c2d] border border-[#1c2b3c] text-[11px] text-[#87929a]">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="font-semibold text-[#8ed5ff]">AUTHENTIC EOD MARKET DATA</span>
          <span className="text-[#3e484f]">•</span>
          <span>TejHQ Bhavcopy Edge Feed</span>
        </div>
        <span className="font-mono text-[10px] text-[#56e5a9] px-1.5 py-0.5 rounded bg-[#56e5a9]/10 border border-[#56e5a9]/20 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-[#56e5a9]" />
          <span>EOD Close ({DATA_METADATA.lastUpdated})</span>
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg bg-[#010f1f] border border-[#1c2b3c] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[#87929a]">
      <div className="flex items-start gap-2.5 max-w-4xl">
        <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#d4e4fa] font-semibold">Data Provenance & Regulatory Notice:</strong>{' '}
          All historical stock prices, candlesticks, and corporate actions derive from authentic end-of-day (EOD) NSE and BSE bhavcopy datasets served via <span className="text-[#8ed5ff] font-medium">TejHQ open financial infrastructure</span>. No synthetic or fabricated prices are used in production charts or indicators. This educational terminal is designed for quantitative indicator computation, risk modeling, and academic machine-learning research. It does not constitute certified SEBI financial advisory or live trading execution.
        </p>
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] shrink-0 text-[#87929a] self-end md:self-auto">
        <span className="px-2 py-0.5 rounded bg-[#122131] border border-[#1c2b3c] text-[#56e5a9]">
          Engine: TejHQ Edge + DuckDB
        </span>
        <span className="px-2 py-0.5 rounded bg-[#122131] border border-[#1c2b3c] text-[#38bdf8]">
          Mode: Verified EOD
        </span>
      </div>
    </div>
  );
};
