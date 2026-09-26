import React, { useState, useMemo } from "react";
import { Project, Sector, RiskBand, ProjectStatus } from "../types";
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  Clock,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

interface PortfolioTableProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  initialRiskFilter?: RiskBand | "All";
}

type SortField =
  | "name"
  | "sector"
  | "state"
  | "sanctioned_cost_cr"
  | "latest_revised_cost_cr"
  | "physical_progress_pct"
  | "scheduleSlipMonths"
  | "risk_score";

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  projects,
  onSelectProject,
  initialRiskFilter = "All",
}) => {
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [riskFilter, setRiskFilter] = useState<string>(initialRiskFilter);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("risk_score");
  const [sortAsc, setSortAsc] = useState(false);

  // Sync if initialRiskFilter changes
  React.useEffect(() => {
    if (initialRiskFilter) {
      setRiskFilter(initialRiskFilter);
    }
  }, [initialRiskFilter]);

  // Extract unique sectors and states
  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.sector))).sort();
  }, [projects]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.state))).sort();
  }, [projects]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (sectorFilter !== "All" && p.sector !== sectorFilter) return false;
      if (stateFilter !== "All" && p.state !== stateFilter) return false;
      if (riskFilter !== "All" && p.riskBand !== riskFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.implementing_agency.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, sectorFilter, stateFilter, riskFilter, statusFilter, search]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredProjects, sortField, sortAsc]);

  const resetFilters = () => {
    setSearch("");
    setSectorFilter("All");
    setStateFilter("All");
    setRiskFilter("All");
    setStatusFilter("All");
    setSortField("risk_score");
    setSortAsc(false);
  };

  const isFiltered =
    search !== "" ||
    sectorFilter !== "All" ||
    stateFilter !== "All" ||
    riskFilter !== "All" ||
    statusFilter !== "All";

  return (
    <div className="bg-paper border border-ink/15 rounded-sm overflow-hidden ">
      {/* Table Toolbar / Filters */}
      <div className="p-4 sm:p-5 border-b border-ink/15 bg-paper-raised space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <span>Central Sector Projects Registry</span>
              <span className="text-xs px-2.5 py-0.5 rounded-sm font-semibold bg-paper-raised text-teal border border-ink/15">
                {sortedProjects.length} of {projects.length} Projects
              </span>
            </h2>
            <p className="text-xs text-ink/45 mt-0.5">
              Live DRISHTI monitoring records with computed explainable early-warning indicators.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink/45" />
            <input
              type="text"
              placeholder="Search by project, agency, state, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-paper border border-ink/15 rounded-sm text-xs text-ink placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Sector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink/45 font-medium">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2.5 py-1 bg-paper border border-ink/15 rounded-sm text-xs text-ink focus:outline-none focus:border-teal-500"
            >
              <option value="All">All Sectors</option>
              {uniqueSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink/45 font-medium">State:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-2.5 py-1 bg-paper border border-ink/15 rounded-sm text-xs text-ink focus:outline-none focus:border-teal-500"
            >
              <option value="All">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Band Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink/45 font-medium">Risk Band:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1 bg-paper border border-ink/15 rounded-sm text-xs text-ink focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="All">All Risk Bands</option>
              <option value="High">High Risk (&gt;60)</option>
              <option value="Medium">Medium Risk (30–60)</option>
              <option value="Low">Low Risk (&lt;30)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink/45 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-paper border border-ink/15 rounded-sm text-xs text-ink focus:outline-none focus:border-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="Delayed">Delayed</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs text-ink/45 hover:text-ink hover:bg-paper-raised transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-ink/15 bg-paper text-ink/45 font-semibold text-[10px]">
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Project & Agency</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("sector")}
                className="py-3 px-3 cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Sector</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("state")}
                className="py-3 px-3 cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>State</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("sanctioned_cost_cr")}
                className="py-3 px-3 text-right cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Outlay (₹ Cr)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("physical_progress_pct")}
                className="py-3 px-3 cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Progress (Phys / Fin)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("scheduleSlipMonths")}
                className="py-3 px-3 text-center cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Schedule Slip</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("risk_score")}
                className="py-3 px-4 text-center cursor-pointer hover:text-ink transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-ink/45">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No infrastructure projects match the selected criteria</p>
                  <p className="text-xs text-ink/45 mt-1">
                    Try clearing filters or searching for another sector, agency, or state.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-3 px-3 py-1.5 rounded-sm text-xs font-medium bg-paper-raised hover:bg-slate-700 text-teal"
                  >
                    Reset All Filters
                  </button>
                </td>
              </tr>
            ) : (
              sortedProjects.map((project) => {
                const isHigh = project.riskBand === "High";
                const isMedium = project.riskBand === "Medium";

                return (
                  <tr
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="hover:bg-paper-raised transition-colors cursor-pointer group"
                  >
                    {/* Project Name & Agency */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink group-hover:text-teal transition-colors">
                        {project.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-ink/45 text-[11px]">
                        <span className="font-medium text-ink-70">
                          {project.implementing_agency}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-ink/45">{project.id}</span>
                        {project.isMismatch && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            Fund Mismatch
                          </span>
                        )}
                        {project.isStagnant && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-mahogany border border-amber-800">
                            Stalled
                          </span>
                        )}
                        {project.land_acquisition_delay_flag && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-red-950/80 text-red-300 border border-red-800/80">
                            Land Dispute
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-paper-raised text-teal border border-ink/15">
                        {project.sector}
                      </span>
                    </td>

                    {/* State */}
                    <td className="py-3.5 px-3">
                      <span className="text-ink-70 font-medium">
                        {project.state}
                      </span>
                    </td>

                    {/* Cost Outlays */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-semibold text-ink">
                        ₹{project.latest_revised_cost_cr.toLocaleString()} Cr
                      </div>
                      <div className="text-[10px] text-ink/45">
                        Sanctioned: ₹{project.sanctioned_cost_cr.toLocaleString()}
                        {project.costOverrunPct > 0 && (
                          <span className="text-mahogany font-medium ml-1">
                            (+{project.costOverrunPct.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                      {project.predicted_cost_overrun_pct !== undefined && (
                        <div className="text-[10px] text-teal/90 font-mono mt-0.5">
                          ML Pred: +{project.predicted_cost_overrun_pct}%
                        </div>
                      )}
                    </td>

                    {/* Physical & Financial Progress */}
                    <td className="py-3.5 px-3 w-44">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-ink/45">
                          Phys: <strong className="text-teal">{project.physical_progress_pct}%</strong>
                        </span>
                        <span className="text-ink/45">
                          Fin: <strong className={project.isMismatch ? "text-mahogany" : "text-ink-70"}>{project.financial_progress_pct}%</strong>
                        </span>
                      </div>
                      {/* Dual Mini Bar */}
                      <div className="w-full bg-paper-raised rounded-sm h-1.5 overflow-hidden flex">
                        <div
                          className="bg-teal-500 h-1.5"
                          style={{ width: `${Math.min(100, project.physical_progress_pct)}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Schedule Slip */}
                    <td className="py-3.5 px-3 text-center">
                      {project.scheduleSlipMonths > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-mahogany">
                          <Clock className="w-3 h-3" />
                          +{project.scheduleSlipMonths}m
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">On Time</span>
                      )}
                      <div className="text-[10px] text-ink/45">
                        Target: {project.revised_completion_date.substring(0, 7)}
                      </div>
                      {project.predicted_schedule_slip_months !== undefined && (
                        <div className="text-[10px] text-teal/90 font-mono mt-0.5">
                          ML Pred: +{project.predicted_schedule_slip_months}m
                        </div>
                      )}
                    </td>

                    {/* Risk Score & Band Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-sm text-xs font-bold ${
                          isHigh
                            ? "bg-[#a43820] text-ink"
                            : isMedium
                            ? "bg-amber-950 text-mahogany border border-amber-700/80"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800/80"
                        }`}
                      >
                        {project.risk_score} • {project.riskBand}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project);
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-ink/45 hover:text-teal transition-colors"
                        title="View detailed risk breakdown"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-ink/15 bg-paper text-xs text-ink/45 flex flex-wrap items-center justify-between gap-2">
        <span>
          Showing {sortedProjects.length} projects • Total Outlay: ₹
          {sortedProjects
            .reduce((acc, p) => acc + p.latest_revised_cost_cr, 0)
            .toLocaleString()}{" "}
          Cr
        </span>
        <span className="text-ink/45">
          Click any row to view full project timeline & transparent formula calculation
        </span>
      </div>
    </div>
  );
};
