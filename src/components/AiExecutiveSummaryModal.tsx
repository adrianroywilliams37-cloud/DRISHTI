import React, { useState, useEffect } from "react";
import { PortfolioStats, Project } from "../types";
import {
  Sparkles,
  X,
  Copy,
  Check,
  Printer,
  RefreshCw,
  FileText,
  AlertTriangle,
  Building,
  ShieldCheck,
} from "lucide-react";

interface AiExecutiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PortfolioStats;
  highRiskProjects: Project[];
  sectorBreakdown: Record<string, number>;
}

export const AiExecutiveSummaryModal: React.FC<AiExecutiveSummaryModalProps> = ({
  isOpen,
  onClose,
  stats,
  highRiskProjects,
  sectorBreakdown,
}) => {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          highRiskProjects: highRiskProjects.map((p) => ({
            name: p.name,
            sector: p.sector,
            state: p.state,
            costOverrunPct: p.costOverrunPct,
            costOverrunCr: p.costOverrunCr,
            scheduleSlipMonths: p.scheduleSlipMonths,
            riskReasons: p.risk_reasons,
          })),
          sectorBreakdown,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch executive summary from server");
      }

      const data = await response.json();
      setSummary(data.summary);
      setIsFallback(Boolean(data.isFallback));
    } catch (err: any) {
      console.error("AI Summary error:", err);
      setError(err.message || "An unexpected error occurred while contacting Gemini.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !summary) {
      fetchSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-ink/15 rounded-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-ink/15 bg-paper-raised flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#a43820] flex items-center justify-center text-ink -[#a43820]/30">
              
            </div>
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span>MoSPI AI Executive Briefing</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal font-mono border border-teal-800">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-ink/45">
                Synthesized natural-language portfolio risk assessment for the Secretary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink/45 hover:text-ink hover:bg-paper-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Memorandum Layout */}
        <div className="p-6 overflow-y-auto space-y-5 text-ink text-xs">
          {/* Official MoSPI Memo Header */}
          <div className="border-b border-ink/15 pb-4 text-center space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-ink-70 uppercase">
              Government of India • Ministry of Statistics & Programme Implementation
            </div>
            <div className="text-xs font-semibold text-teal ">
              Infrastructure & Project Monitoring Division (IPMD) • DRISHTI Portal
            </div>
            <div className="text-[11px] font-mono text-ink/45 pt-1">
              REF: MoSPI/IPMD/AI-WARN/Q4-2026 • Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Key Macro Risk Snapshot Bar */}
          <div className="grid grid-cols-3 gap-2 bg-paper p-3 rounded-sm border border-ink/15 text-center">
            <div>
              <div className="text-[10px] text-ink/45 uppercase font-semibold">Total Escalation</div>
              <div className="text-sm font-bold text-mahogany">
                +₹{stats.totalOverrun.toLocaleString()} Cr
              </div>
            </div>
            <div>
              <div className="text-[10px] text-ink/45 uppercase font-semibold">Critical Flags</div>
              <div className="text-sm font-bold text-mahogany">
                {stats.highRiskCount} Projects
              </div>
            </div>
            <div>
              <div className="text-[10px] text-ink/45 uppercase font-semibold">Avg Delay</div>
              <div className="text-sm font-bold text-ink">
                {stats.avgSlipMonths.toFixed(1)} Months
              </div>
            </div>
          </div>

          {/* AI Synthesis Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-70 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal" />
                <span>Executive Memorandum</span>
              </span>
              {isFallback && (
                <span className="text-[10px] text-mahogany bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  Algorithmic Baseline Summary
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 bg-paper border border-ink/15 rounded-sm text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-teal animate-spin mx-auto" />
                <p className="text-xs font-medium text-ink-70">
                  Gemini is analyzing {stats.totalProjects} Central Sector projects & risk factors...
                </p>
                <p className="text-[11px] text-ink/45">
                  Evaluating cost escalation vectors, schedule slippages, and physical/financial variances.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-950/40 border border-red-800 rounded-sm text-red-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-mahogany" />
                  <span>Briefing Generation Notice</span>
                </div>
                <p className="text-xs text-red-200">{error}</p>
                <button
                  onClick={fetchSummary}
                  className="px-3 py-1 bg-red-900 text-ink rounded text-xs font-medium"
                >
                  Retry Request
                </button>
              </div>
            ) : (
              <div className="p-4 bg-paper border border-ink/15 rounded-sm text-ink leading-relaxed text-sm ">
                <p className="font-serif sm:font-sans">{summary}</p>
              </div>
            )}
          </div>

          {/* Actionable Interventions Box */}
          <div className="bg-[#091320] border border-ink/15 p-3.5 rounded-sm space-y-2">
            <div className="text-[11px] font-bold text-teal flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recommended Ministerial Interventions</span>
            </div>
            <ul className="text-xs text-ink/45 space-y-1.5 list-disc pl-4">
              <li>
                Convene joint task force with state authorities on Land Acquisition and Right-of-Way (ROW) clearances.
              </li>
              <li>
                Audit contracts where financial disbursement outstrips physical completion by over 20%.
              </li>
              <li>
                Issue formal show-cause notices for projects stalled across consecutive reporting cycles.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-5 py-3 border-t border-ink/15 bg-paper-raised flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-raised hover:bg-slate-700 text-ink-70 border border-ink/15 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate Briefing</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-raised hover:bg-slate-700 text-ink-70 border border-ink/15 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied to Clipboard" : "Copy Briefing"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#a43820] hover:bg-[#8e2f19] text-ink font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
