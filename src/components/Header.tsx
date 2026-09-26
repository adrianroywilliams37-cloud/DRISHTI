import React from "react";
export type NavTab = "portfolio" | "analytics" | "validation" | "compliance" | "docs";

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  viewMode: "overview" | "detailed";
  setViewMode: (mode: "overview" | "detailed") => void;
  onOpenAiSummary: () => void;
  onOpenAiChat: () => void;
  onOpenCsvImport: () => void;
  onExportCsv: () => void;
  stats?: any;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  onOpenAiSummary,
  onOpenAiChat,
  onOpenCsvImport,
  onExportCsv,
  stats,
}) => {
  return (
    <header className="sticky top-0 z-30">
      {/* Masthead */}
      <div className="bg-rail text-[#DDE4E2] text-[12px]">
        <div className="max-w-[1360px] mx-auto flex justify-between items-center px-6 py-2">
          <div className="flex items-center gap-3.5">
            <span className="pr-3.5 border-r border-white/20">Government of India</span>
            <span className="pr-3.5 border-r border-white/20">Ministry of Statistics & Programme Implementation</span>
            <span>DRISHTI Central Sector Monitoring</span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="pr-3.5 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7FA893] mr-1.5"></span>
              Cycle Q4 FY25–26
            </span>
            <span className="pl-3.5 border-l border-white/20">Projects above ₹150 Cr outlay</span>
          </div>
        </div>
      </div>

      {/* Title bar */}
      <div className="border-b border-ink/15 bg-paper">
        <div className="max-w-[1360px] mx-auto flex justify-between items-end px-6 pt-5 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-[34px] h-[34px] border-[1.5px] border-ink relative flex-none">
              <div className="absolute left-[6px] right-[6px] top-[11px] border-t-[1.5px] border-ink"></div>
              <div className="absolute left-[6px] right-[6px] top-[20px] border-t-[1.5px] border-ink"></div>
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-ink leading-tight flex items-center gap-2 font-serif">
                Drishti — Portfolio Register
              </h1>
              {viewMode === "overview" && stats ? (
                <div className="text-[13px] text-ink/70 mt-0.5 flex items-center gap-2 font-sans">
                  <span>{stats.totalProjects} tracked</span>
                  <span className="text-ink/45">·</span>
                  <span className="text-mahogany font-medium">{stats.highRiskCount} high-risk</span>
                  <span className="text-ink/45">·</span>
                  <span className="text-ochre">avg overrun {stats.costOverrunPct.toFixed(0)}%</span>
                  <span className="text-ink/45">·</span>
                  <span className="italic">synthetic data</span>
                </div>
              ) : (
                <p className="text-[13px] text-ink/70 mt-0.5 font-sans">
                  Explainable risk engine, dual-model predictions and generated intelligence
                </p>
              )}
            </div>
          </div>

          {/* Toggle */}
          <div className="flex border border-ink rounded-sm overflow-hidden h-[32px]">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-4 text-[13px] font-sans border-none cursor-pointer transition-colors ${
                viewMode === "overview"
                  ? "bg-ink text-paper"
                  : "bg-transparent text-ink border-l border-ink"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setViewMode("detailed");
                setActiveTab("portfolio"); // default tab
              }}
              className={`px-4 text-[13px] font-sans border-none cursor-pointer transition-colors ${
                viewMode === "detailed"
                  ? "bg-ink text-paper"
                  : "bg-transparent text-ink border-l border-ink"
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Detailed mode tabs */}
      {viewMode === "detailed" && (
        <div className="bg-paper border-b border-ink/15">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between px-6">
            <div className="flex gap-7">
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`py-3.5 text-[13.5px] border-b-2 cursor-pointer transition-colors font-sans ${
                  activeTab === "portfolio"
                    ? "text-ink border-mahogany font-medium"
                    : "text-ink/45 border-transparent hover:text-ink/70"
                }`}
              >
                Portfolio & flags
                {stats?.highRiskCount > 0 && (
                  <span className="font-mono text-[11px] ml-1">({stats.highRiskCount})</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-3.5 text-[13.5px] border-b-2 cursor-pointer transition-colors font-sans ${
                  activeTab === "analytics"
                    ? "text-ink border-mahogany font-medium"
                    : "text-ink/45 border-transparent hover:text-ink/70"
                }`}
              >
                Macro analytics
              </button>
              <button
                onClick={() => setActiveTab("validation")}
                className={`py-3.5 text-[13.5px] border-b-2 cursor-pointer transition-colors font-sans ${
                  activeTab === "validation"
                    ? "text-ink border-mahogany font-medium"
                    : "text-ink/45 border-transparent hover:text-ink/70"
                }`}
              >
                Validation & models
              </button>
              <button
                onClick={() => setActiveTab("compliance")}
                className={`py-3.5 text-[13.5px] border-b-2 cursor-pointer transition-colors font-sans ${
                  activeTab === "compliance"
                    ? "text-ink border-mahogany font-medium"
                    : "text-ink/45 border-transparent hover:text-ink/70"
                }`}
              >
                PS compliance
              </button>
              <button
                onClick={() => setActiveTab("docs")}
                className={`py-3.5 text-[13.5px] border-b-2 cursor-pointer transition-colors font-sans ${
                  activeTab === "docs"
                    ? "text-ink border-mahogany font-medium"
                    : "text-ink/45 border-transparent hover:text-ink/70"
                }`}
              >
                Documentation
              </button>
            </div>

            <div className="flex gap-2 py-2.5">
              <button
                onClick={onOpenCsvImport}
                className="font-sans text-[12.5px] px-3.5 py-1.5 border border-ink bg-transparent text-ink rounded-sm cursor-pointer hover:bg-ink/5"
              >
                Import CSV
              </button>
              <button
                onClick={onExportCsv}
                className="font-sans text-[12.5px] px-3.5 py-1.5 border border-ink bg-transparent text-ink rounded-sm cursor-pointer hover:bg-ink/5"
              >
                Export
              </button>
              <button
                onClick={onOpenAiChat}
                className="font-sans text-[12.5px] px-3.5 py-1.5 border border-ink bg-transparent text-ink rounded-sm cursor-pointer hover:bg-ink/5"
              >
                Ask about this data
              </button>
              <button
                onClick={onOpenAiSummary}
                className="font-sans text-[12.5px] px-3.5 py-1.5 border border-mahogany bg-mahogany text-white rounded-sm cursor-pointer hover:bg-mahogany/90"
              >
                Generate executive summary
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
