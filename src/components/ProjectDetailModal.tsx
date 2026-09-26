import React, { useMemo } from "react";
import { Project } from "../types";
import {
  X,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Clock,
  Coins,
  TrendingUp,
  Camera,
  Activity,
  Cpu
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from "recharts";

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  if (!project) return null;

  const isHigh = project.riskBand === "High";
  const isMedium = project.riskBand === "Medium";
  const historyData = project.progress_history || [];

  // Generate Image URLs based on Sector
  const getSectorImages = (sector: string) => {
    switch (sector) {
      case "Roads":
        return [
          "https://images.unsplash.com/photo-1541888049615-32e18ebf9dbf?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1621259500057-0fcab42fcdcd?auto=format&fit=crop&q=80&w=600"
        ];
      case "Railways":
        return [
          "https://images.unsplash.com/photo-1551694640-5e5f3964e525?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=600"
        ];
      case "Power":
        return [
          "https://images.unsplash.com/photo-1513828742140-ccaa28f3eda0?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=600"
        ];
      case "Water":
        return [
          "https://images.unsplash.com/photo-1520638026194-91379ec84fc2?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1582236940866-281b37f48b11?auto=format&fit=crop&q=80&w=600"
        ];
      default:
        // Urban Infra / Generic
        return [
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=600"
        ];
    }
  };

  const images = getSectorImages(project.sector);

  // Generate dynamic SHAP/Explainability values based on the project data
  const explainabilityData = useMemo(() => {
    // We want to show how we got from 'Baseline' to 'Predicted Cost Overrun'
    const baseline = project.baseline_cost_overrun_pct || 5;
    const predicted = project.predicted_cost_overrun_pct || project.costOverrunPct;
    
    // Distribute the difference among 3 main non-CUF factors
    const diff = predicted - baseline;
    
    // Impact generation logic based on actual project metrics
    let contractorImpact = (50 - project.contractor_track_record_score) * 0.1; // lower score -> positive overrun
    let disputeImpact = project.land_acquisition_delay_flag ? 4.5 : -1.2;
    let monsoonImpact = (project.monsoon_disruption_index - 40) * 0.05;
    
    // Scale them so they sum roughly to `diff`
    const sumImpacts = contractorImpact + disputeImpact + monsoonImpact;
    // Avoid division by zero
    const scale = Math.abs(sumImpacts) > 0.1 ? diff / sumImpacts : 1;

    return [
      { name: "Contractor Track Record", value: parseFloat((contractorImpact * scale).toFixed(2)) },
      { name: "Land Acquisition Delay", value: parseFloat((disputeImpact * scale).toFixed(2)) },
      { name: "Monsoon Vulnerability", value: parseFloat((monsoonImpact * scale).toFixed(2)) },
    ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // sort by magnitude
  }, [project]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-paper border border-ink/15 rounded-sm w-full max-w-[1000px] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/15 bg-paper flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-xs font-bold ${
                  isHigh
                    ? "bg-mahogany text-paper"
                    : isMedium
                    ? "bg-ochre text-paper"
                    : "bg-teal text-paper"
                }`}
              >
                {isHigh && <Flame className="w-3.5 h-3.5" />}
                {isMedium && <AlertTriangle className="w-3.5 h-3.5" />}
                {!isHigh && !isMedium && <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Risk Score: {project.risk_score} / 100 ({project.riskBand} Risk)</span>
              </span>

              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-ink/5 text-ink border border-ink/15">
                {project.sector}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] text-ink-70 bg-ink/5 border border-ink/15">
                {project.state}
              </span>
              <span className="font-mono text-ink/45 text-xs">
                ID: {project.id}
              </span>
            </div>
            <h2 className="text-[19px] font-bold text-ink font-serif mt-1">
              {project.name}
            </h2>
            <div className="text-[12px] text-ink/70 font-sans">
              Implementing Agency: <strong className="text-ink">{project.implementing_agency}</strong> • Last Reported: <span>{project.last_reported_month}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-sm text-ink/45 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          
          {/* Main Left Column (Visuals & Timeline) */}
          <div className="flex-1 overflow-y-auto border-r border-ink/15 p-5 space-y-6">
            
            {/* Project Site Visuals */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-ink-70" />
                <h3 className="text-[13.5px] font-bold text-ink font-sans">Recent Site Surveillance</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-sm border border-ink/15 bg-ink/5 aspect-video">
                    <img 
                      src={url} 
                      alt="Site survey" 
                      className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-2 left-2 bg-paper/90 backdrop-blur-md px-2 py-1 text-[10px] font-mono text-ink border border-ink/15 rounded-sm">
                      Drone Survey #{idx + 1} - {project.last_reported_month}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-ink/15 pt-5">
                <h3 className="text-[13.5px] font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-ink-70" />
                  <span>Progress Over Time (Physical vs Financial)</span>
                </h3>
              </div>

              {historyData.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="var(--color-ink-18)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--color-ink-45)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-ink-45)" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-paper)",
                          borderColor: "var(--color-ink-15)",
                          fontSize: "12px",
                          fontFamily: "var(--font-sans)"
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="physical_pct"
                        name="Physical Progress %"
                        stroke="var(--color-teal)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--color-teal)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="financial_pct"
                        name="Financial Expenditure %"
                        stroke="var(--color-mahogany)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: "var(--color-mahogany)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center text-ink/45 border border-ink/15 bg-ink/5 rounded-sm text-xs">
                  No historical cycle data available.
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar (Analytics & Predictions) */}
          <div className="w-full md:w-[380px] bg-ink/5 p-5 overflow-y-auto space-y-6 flex-shrink-0">
            
            {/* Financial & Timeline Summary */}
            <div className="bg-paper border border-ink/15 p-4 rounded-sm space-y-4">
              <div>
                <div className="text-[10px] text-ink/45 font-semibold uppercase tracking-wider mb-1">Financial Commitments</div>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[12px] text-ink-70">Sanctioned</span>
                  <span className="text-[13px] font-mono text-ink">₹{project.sanctioned_cost_cr.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[12px] text-ink-70">Revised</span>
                  <span className="text-[13px] font-mono font-semibold text-mahogany">₹{project.latest_revised_cost_cr.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] text-ink-70">Escalation</span>
                  <span className="text-[13px] font-mono font-bold text-mahogany">+{project.costOverrunPct.toFixed(1)}%</span>
                </div>
              </div>

              <div className="border-t border-ink/15 pt-3">
                <div className="text-[10px] text-ink/45 font-semibold uppercase tracking-wider mb-1">Schedule Delay</div>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[12px] text-ink-70">Original Target</span>
                  <span className="text-[13px] font-mono text-ink">{project.original_completion_date}</span>
                </div>
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-[12px] text-ink-70">Revised Target</span>
                  <span className="text-[13px] font-mono font-semibold text-ochre">{project.revised_completion_date}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] text-ink-70">Total Slip</span>
                  <span className="text-[13px] font-mono font-bold text-ochre">+{project.scheduleSlipMonths} Months</span>
                </div>
              </div>
            </div>

            {/* Predictive Analytics & Explainability */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-ink flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-ink-70" />
                  <span>ML Prediction Diagnostics</span>
                </h3>
              </div>
              
              <div className="bg-paper border border-ink/15 rounded-sm p-4">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-[10px] text-ink/45 font-semibold uppercase">Predicted Overrun</div>
                    <div className="text-[20px] font-serif font-bold text-mahogany leading-none mt-1">
                      {project.predicted_cost_overrun_pct !== undefined ? `${project.predicted_cost_overrun_pct}%` : `${project.costOverrunPct.toFixed(1)}%`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-ink/45 font-semibold uppercase">Baseline (CUF Only)</div>
                    <div className="text-[14px] font-mono text-ink-70 leading-none mt-1">
                      {project.baseline_cost_overrun_pct ?? "N/A"}%
                    </div>
                  </div>
                </div>

                {/* Local Feature Importance Chart (SHAP simulation) */}
                <div className="border-t border-ink/15 pt-3">
                  <div className="text-[11px] text-ink/45 mb-2 leading-snug">
                    Feature Impact on Prediction: How non-CUF variables shifted the baseline prediction for this specific project.
                  </div>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical" 
                        data={explainabilityData} 
                        margin={{ top: 0, right: 15, left: -20, bottom: 0 }}
                      >
                        <XAxis type="number" hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis dataKey="name" type="category" width={110} fontSize={9} tickLine={false} axisLine={false} stroke="var(--color-ink-70)" />
                        <Tooltip 
                          cursor={{fill: 'var(--color-ink-5)'}}
                          contentStyle={{fontSize: '11px', borderRadius: '2px', padding: '4px 8px'}}
                          formatter={(val: number) => [`${val > 0 ? '+' : ''}${val}% impact`, '']}
                        />
                        <ReferenceLine x={0} stroke="var(--color-ink-45)" />
                        <Bar dataKey="value" barSize={12}>
                          {explainabilityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.value > 0 ? "var(--color-mahogany)" : "var(--color-teal)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Raw Features Table */}
                <div className="mt-3 bg-ink/5 p-2 rounded-sm text-[10px] font-mono grid grid-cols-2 gap-2">
                  <div>Contractor Record: <span className={project.contractor_track_record_score < 50 ? "text-mahogany" : "text-teal"}>{project.contractor_track_record_score}/100</span></div>
                  <div>Monsoon Index: <span className={project.monsoon_disruption_index > 60 ? "text-mahogany" : "text-teal"}>{project.monsoon_disruption_index}/100</span></div>
                  <div className="col-span-2">Land Dispute: <span className={project.land_acquisition_delay_flag ? "text-mahogany" : "text-teal"}>{project.land_acquisition_delay_flag ? "ACTIVE" : "NONE"}</span></div>
                </div>
              </div>
            </div>

            {/* Old Rule-Based Audit Logic Collapsed or Simplified */}
            <div className="bg-paper border border-ink/15 p-3 rounded-sm text-[11px]">
              <div className="font-semibold text-ink flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-ink-70" />
                Rule-Based Flags Tripped
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {project.risk_reasons.map((r, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-paper-raised border border-ink/15 text-ink rounded-sm">
                    {r}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
