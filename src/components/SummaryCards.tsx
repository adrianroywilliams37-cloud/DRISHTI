import React from "react";
import { PortfolioStats } from "../types";

interface SummaryCardsProps {
  stats: PortfolioStats;
  onFilterRiskBand?: (band: "All" | "High" | "Medium" | "Low") => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, onFilterRiskBand }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-ink/15 border border-ink/15 mb-[2px]">
      {/* 1. Total Projects */}
      <div className="bg-paper p-4 pb-3.5">
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">Projects tracked</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          {stats.totalProjects}
        </div>
        <svg width="120" height="24" viewBox="0 0 120 24" className="block mt-2">
          <rect x="0" y="8" width="16" height="16" fill="var(--color-cat1)"/>
          <rect x="18" y="4" width="16" height="20" fill="var(--color-cat2)"/>
          <rect x="36" y="12" width="16" height="12" fill="var(--color-cat3)"/>
          <rect x="54" y="0" width="16" height="24" fill="var(--color-cat4)"/>
          <rect x="72" y="10" width="16" height="14" fill="var(--color-cat5)"/>
          <rect x="90" y="15" width="16" height="9" fill="var(--color-cat6)"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          across 6 sectors, 17 ministries
        </div>
      </div>

      {/* 2. Total Escalation / Cost Overrun */}
      <div className="bg-paper p-4 pb-3.5">
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">Cost escalation</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          +₹{(stats.totalOverrun / 100000).toFixed(2)}L Cr
        </div>
        <svg width="120" height="24" viewBox="0 0 120 24" className="block mt-2">
          <polyline points="0,20 20,17 40,15 60,11 80,8 100,4 120,2" fill="none" stroke="var(--color-mahogany)" strokeWidth="1.5"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          +{stats.costOverrunPct.toFixed(1)}% above sanctioned value
        </div>
      </div>

      {/* 3. High Risk Projects */}
      <div
        onClick={() => onFilterRiskBand?.("High")}
        className="bg-paper p-4 pb-3.5 cursor-pointer hover:bg-paper-raised transition-colors"
      >
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">High risk (score &gt;60)</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          {stats.highRiskCount} <span className="text-[12px] text-ink/45">/ {((stats.highRiskCount / (stats.totalProjects || 1)) * 100).toFixed(0)}%</span>
        </div>
        <svg width="24" height="24" viewBox="0 0 36 36" className="block mt-2">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-ink-18)" strokeWidth="5"/>
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-mahogany)" strokeWidth="5"
            strokeDasharray={`${(stats.highRiskCount / (stats.totalProjects || 1)) * 87.9} 87.9`} strokeDashoffset="0" transform="rotate(-90 18 18)"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          critical flag threshold
        </div>
      </div>

      {/* 4. Medium Risk Watchlist */}
      <div
        onClick={() => onFilterRiskBand?.("Medium")}
        className="bg-paper p-4 pb-3.5 cursor-pointer hover:bg-paper-raised transition-colors"
      >
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">Medium watchlist</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          {stats.mediumRiskCount} <span className="text-[12px] text-ink/45">/ {((stats.mediumRiskCount / (stats.totalProjects || 1)) * 100).toFixed(0)}%</span>
        </div>
        <svg width="24" height="24" viewBox="0 0 36 36" className="block mt-2">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-ink-18)" strokeWidth="5"/>
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-ochre)" strokeWidth="5"
            strokeDasharray={`${(stats.mediumRiskCount / (stats.totalProjects || 1)) * 87.9} 87.9`} strokeDashoffset="0" transform="rotate(-90 18 18)"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          score 30–60
        </div>
      </div>

      {/* 5. Average Schedule Slippage */}
      <div className="bg-paper p-4 pb-3.5">
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">Avg schedule slip</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          {stats.avgSlipMonths.toFixed(1)} <span className="text-[12px] text-ink/45">mo</span>
        </div>
        <svg width="120" height="10" viewBox="0 0 120 10" className="block mt-2">
          <rect x="0" y="3" width="120" height="4" fill="var(--color-ink-18)"/>
          <rect x="0" y="3" width="78" height="4" fill="var(--color-ink-70)"/>
          <rect x="76" y="0" width="2" height="10" fill="var(--color-ink)"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          vs. original completion date
        </div>
      </div>

      {/* 6. Anomalous Flags (Mismatch & Stagnancy) */}
      <div className="bg-paper p-4 pb-3.5">
        <div className="text-[11.5px] text-ink/45 mb-2 font-sans">Audit anomalies</div>
        <div className="text-[22px] font-medium font-mono text-ink">
          {stats.mismatchCount + stats.stagnantCount}
        </div>
        <svg width="120" height="10" viewBox="0 0 120 10" className="block mt-2">
          <rect x="0" y="0" width={((stats.mismatchCount / (stats.mismatchCount + stats.stagnantCount || 1)) * 120) - 1} height="10" fill="var(--color-cat4)"/>
          <rect x={((stats.mismatchCount / (stats.mismatchCount + stats.stagnantCount || 1)) * 120) + 1} y="0" width={((stats.stagnantCount / (stats.mismatchCount + stats.stagnantCount || 1)) * 120) - 1} height="10" fill="var(--color-cat5)"/>
        </svg>
        <div className="text-[11px] text-ink/45 mt-1 font-sans">
          {stats.mismatchCount} fund mismatch · {stats.stagnantCount} stagnant
        </div>
      </div>
    </div>
  );
};
