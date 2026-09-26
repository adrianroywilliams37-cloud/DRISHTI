import React, { useState, useMemo } from "react";
import { Project } from "../types";

interface EarlyWarningPanelProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

export const EarlyWarningPanel: React.FC<EarlyWarningPanelProps> = ({
  projects,
  onSelectProject,
}) => {
  const [filterType, setFilterType] = useState<
    "all" | "high" | "medium" | "mismatch" | "stagnant"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Only consider High and Medium risk projects for early warnings
  const flaggedProjects = useMemo(() => {
    return projects
      .filter((p) => p.riskBand === "High" || p.riskBand === "Medium")
      .sort((a, b) => b.risk_score - a.risk_score);
  }, [projects]);

  const filtered = useMemo(() => {
    return flaggedProjects.filter((p) => {
      if (filterType === "high" && p.riskBand !== "High") return false;
      if (filterType === "medium" && p.riskBand !== "Medium") return false;
      if (filterType === "mismatch" && !p.isMismatch) return false;
      if (filterType === "stagnant" && !p.isStagnant) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q) ||
          p.implementing_agency.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [flaggedProjects, filterType, searchQuery]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-baseline mb-3.5">
        <h2 className="text-[17px] font-semibold font-serif m-0">Early warning register</h2>
        <div className="text-[12.5px] text-ink/45 font-sans">
          {flaggedProjects.length} flagged, sorted by risk score descending
        </div>
      </div>

      <div className="flex items-center gap-[18px] py-3 border-b border-ink/15 mb-[2px] text-[13px] font-sans overflow-x-auto">
        <div
          onClick={() => setFilterType("all")}
          className={`cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
            filterType === "all" ? "text-ink border-ink font-medium" : "text-ink/45 border-transparent"
          }`}
        >
          All flags ({flaggedProjects.length})
        </div>
        <div
          onClick={() => setFilterType("high")}
          className={`cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
            filterType === "high" ? "text-ink border-ink font-medium" : "text-ink/45 border-transparent"
          }`}
        >
          High risk ({flaggedProjects.filter((p) => p.riskBand === "High").length})
        </div>
        <div
          onClick={() => setFilterType("medium")}
          className={`cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
            filterType === "medium" ? "text-ink border-ink font-medium" : "text-ink/45 border-transparent"
          }`}
        >
          Medium watchlist ({flaggedProjects.filter((p) => p.riskBand === "Medium").length})
        </div>
        <div
          onClick={() => setFilterType("mismatch")}
          className={`cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
            filterType === "mismatch" ? "text-ink border-ink font-medium" : "text-ink/45 border-transparent"
          }`}
        >
          Fund mismatches ({flaggedProjects.filter((p) => p.isMismatch).length})
        </div>
        <div
          onClick={() => setFilterType("stagnant")}
          className={`cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
            filterType === "stagnant" ? "text-ink border-ink font-medium" : "text-ink/45 border-transparent"
          }`}
        >
          Stalled progress ({flaggedProjects.filter((p) => p.isStagnant).length})
        </div>
        <input
          type="text"
          placeholder="Search flagged projects"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto border border-ink/15 bg-transparent py-1.5 px-2.5 text-[12.5px] font-sans w-[220px] text-ink focus:outline-none focus:border-ink/45"
        />
      </div>

      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-ink/45 font-sans text-[13px]">
            No flagged projects found matching this filter.
          </div>
        ) : (
          filtered.map((project) => {
            const isHigh = project.riskBand === "High";
            
            // Calculate approximate visual risk breakdown for the horizontal bar
            const costWeight = Math.min(project.costOverrunPct, 50) / 50 * 35;
            const timeWeight = Math.min(project.scheduleSlipMonths, 36) / 36 * 35;
            const stagnantWeight = project.isStagnant ? 15 : 0;
            const mismatchWeight = project.isMismatch ? 15 : 0;
            const totalWeight = costWeight + timeWeight + stagnantWeight + mismatchWeight || 1;
            
            const costPct = (costWeight / totalWeight) * 100;
            const timePct = (timeWeight / totalWeight) * 100;
            const stagPct = (stagnantWeight / totalWeight) * 100;
            const misPct = (mismatchWeight / totalWeight) * 100;

            // Generate some plausible sparkline points for physical vs financial progress
            // Since we don't have historical data in the Project type, we'll draw a representative shape
            const physPoints = `0,26 26,24 52,22 78,19 104,15 130,${34 - (project.physical_progress_pct / 100 * 30)}`;
            const finPoints = `0,20 26,15 52,10 78,7 104,6 130,${34 - (project.financial_progress_pct / 100 * 30)}`;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="grid grid-cols-[28px_1fr_260px] gap-[18px] py-4 border-b border-ink/15 cursor-pointer hover:bg-paper-raised/50 transition-colors"
              >
                {/* Stamp */}
                <div className="mt-1">
                  <div
                    className={`w-3.5 h-3.5 ${
                      isHigh ? "bg-mahogany" : "border-[1.5px] border-ochre bg-transparent"
                    }`}
                  ></div>
                </div>

                {/* Main Content */}
                <div>
                  <div className="flex gap-2.5 text-[12px] text-ink/45 font-sans mb-1.5 flex-wrap">
                    <span className="pr-2.5 border-r border-ink/15">{project.sector}</span>
                    <span className="pr-2.5 border-r border-ink/15">{project.state}</span>
                    <span className="pr-2.5 border-r border-ink/15 text-ink font-medium">{project.implementing_agency}</span>
                    <span>{project.id}</span>
                  </div>
                  <div className="font-serif text-[16px] mb-2.5 text-ink font-semibold">
                    {project.name}
                  </div>
                  
                  {/* Risk Factor Breakdown Bar */}
                  <div className="flex h-2 w-full overflow-hidden mb-1.5">
                    {costPct > 0 && <div style={{ width: `${costPct}%` }} className="h-full bg-mahogany"></div>}
                    {timePct > 0 && <div style={{ width: `${timePct}%` }} className="h-full bg-ochre"></div>}
                    {stagPct > 0 && <div style={{ width: `${stagPct}%` }} className="h-full bg-cat1"></div>}
                    {misPct > 0 && <div style={{ width: `${misPct}%` }} className="h-full bg-cat4"></div>}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex gap-3.5 text-[10.5px] text-ink/45 font-sans flex-wrap">
                    {costPct > 0 && (
                      <span className="flex items-center">
                        <i className="inline-block w-2 h-2 mr-1 bg-mahogany"></i>
                        Cost overrun {project.costOverrunPct.toFixed(1)}%
                      </span>
                    )}
                    {timePct > 0 && (
                      <span className="flex items-center">
                        <i className="inline-block w-2 h-2 mr-1 bg-ochre"></i>
                        {project.scheduleSlipMonths} months behind
                      </span>
                    )}
                    {stagPct > 0 && (
                      <span className="flex items-center">
                        <i className="inline-block w-2 h-2 mr-1 bg-cat1"></i>
                        Progress stagnant
                      </span>
                    )}
                    {misPct > 0 && (
                      <span className="flex items-center">
                        <i className="inline-block w-2 h-2 mr-1 bg-cat4"></i>
                        Fund/progress mismatch
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Sidebar Stats & Sparkline */}
                <div className="text-right text-[11.5px] text-ink/45 font-sans flex flex-col justify-between">
                  <div>
                    <span className={`block text-[14px] font-mono mb-0.5 ${isHigh ? 'text-mahogany' : 'text-ochre'}`}>
                      Score {project.risk_score}
                    </span>
                    <span className="block">Sanctioned ₹{project.sanctioned_cost_cr.toLocaleString()} Cr</span>
                    <span className="block text-mahogany font-medium">
                      Revised ₹{project.latest_revised_cost_cr.toLocaleString()} Cr (+{project.costOverrunPct.toFixed(0)}%)
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-col items-end">
                    <svg width="130" height="34" viewBox="0 0 130 34">
                      {/* Physical Progress (solid line) */}
                      <polyline
                        points={physPoints}
                        fill="none"
                        stroke="var(--color-ink-70)"
                        strokeWidth="1.3"
                      />
                      {/* Financial Progress (dashed line) */}
                      <polyline
                        points={finPoints}
                        fill="none"
                        stroke="var(--color-mahogany)"
                        strokeWidth="1.3"
                        strokeDasharray="3 2"
                      />
                    </svg>
                    <div className="text-[10px] mt-1">financial (dashed) vs physical</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
