import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { AlertTriangle, Clock, CheckCircle, Activity, ChevronRight, Brain, Target, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { IotDiagnosticsNode } from './IotDiagnosticsNode';

interface MinistryAnalystDashboardProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
}

const generateIntelligenceBrief = (projects: Project[]) => {
  if (projects.length === 0) return "No data available for synthesis.";
  const highRisk = projects.filter(p => p.riskBand === 'High');
  
  if (highRisk.length === 0) {
    return "Portfolio exhibits nominal variance. No critical risk clusters identified across active nodes. Continue standard monitoring protocol.";
  }
  
  // Find top risk reason
  const reasons: Record<string, number> = {};
  highRisk.forEach(p => {
    if (p.risk_reasons) {
       p.risk_reasons.forEach(r => {
         reasons[r] = (reasons[r] || 0) + 1;
       })
    }
  });
  const topReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  
  if (topReason) {
    const pct = Math.round((topReason[1] / highRisk.length) * 100);
    return `[SECTOR ALERT] ${pct}% of Critical projects are currently bottlenecked by ${topReason[0].toUpperCase()}. Recommended Action: Deploy targeted inter-ministerial task force to unblock statutory clearances immediately.`;
  }
  
  return "Complex variance topography detected. Multiple compounding drivers affecting critical path. Initiate deep-dive nodal audit.";
}

const ScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 shadow-xl">
        <p className="text-slate-200 font-bold font-serif mb-1">{data.name}</p>
        <div className="text-xs font-monospace text-slate-400">
          <p>Slip: <span className="text-amber-400">{data.x} months</span></p>
          <p>Cost Δ: <span className="text-red-400">+{data.y}%</span></p>
        </div>
      </div>
    );
  }
  return null;
};

export function MinistryAnalystDashboard({ projects, onSelectProject }: MinistryAnalystDashboardProps) {
  const navigate = useNavigate();
  
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const riskScore = { High: 3, Medium: 2, Low: 1 };
      const riskDiff = riskScore[b.riskBand] - riskScore[a.riskBand];
      if (riskDiff !== 0) return riskDiff;
      return b.costOverrunPct - a.costOverrunPct;
    });
  }, [projects]);

  const highRiskCount = projects.filter(p => p.riskBand === 'High').length;
  const mediumRiskCount = projects.filter(p => p.riskBand === 'Medium').length;
  
  const anomalousProjects = useMemo(() => {
    return projects.filter(p => p.isolation_forest_payload?.analytics_inbox.some(alert => alert.anomaly_flag));
  }, [projects]);

  const intelligenceBrief = useMemo(() => generateIntelligenceBrief(projects), [projects]);

  const scatterData = useMemo(() => {
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      x: p.scheduleSlipMonths,
      y: p.costOverrunPct,
      riskBand: p.riskBand
    }));
  }, [projects]);

  return (
    <div className="bg-slate-50 p-6 md:p-8 font-sans max-w-7xl mx-auto min-h-full flex flex-col gap-8">
      
      {/* 1. AI Intelligence Brief Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-32 h-32 text-slate-100" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-3">
               <span className="w-2 h-2 bg-teal-500 rounded-sm animate-pulse"></span>
               <h2 className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Neural Sector Synthesis</h2>
             </div>
             <p className="text-slate-200 font-serif text-lg md:text-xl leading-relaxed max-w-3xl">
               {intelligenceBrief}
             </p>
           </div>
           
           <div className="flex gap-4">
              <div className="bg-slate-800 border border-slate-700 px-5 py-3 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Critical</span>
                <span className="text-2xl font-bold font-serif text-red-500">{highRiskCount}</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 px-5 py-3 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Watchlist</span>
                <span className="text-2xl font-bold font-serif text-amber-500">{mediumRiskCount}</span>
              </div>
           </div>
        </div>
        <div className="relative z-10 mt-4 flex justify-end">
          <button 
             onClick={() => navigate('/fiscal-analytics')}
             className="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 flex items-center gap-2 transition-colors border border-emerald-600"
          >
            [ OPEN FISCAL ANALYTICS ]
          </button>
        </div>
      </div>

      {/* 2. Portfolio Ledger (Moved up as requested) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-800 rounded-sm"></span> Portfolio Ledger
        </h2>
        <div className="bg-white border border-slate-300 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Project ID</th>
                <th className="px-4 py-3 w-1/3">Project Title</th>
                <th className="px-4 py-3 text-right">Cost Variance</th>
                <th className="px-4 py-3 text-right">Time Slip</th>
                <th className="px-4 py-3">Primary Driver</th>
                <th className="px-4 py-3 text-center">Trajectory</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedProjects.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => onSelectProject(p)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    {p.riskBand === 'High' ? <AlertTriangle className="w-4 h-4 text-red-700" /> :
                     p.riskBand === 'Medium' ? <Clock className="w-4 h-4 text-amber-600" /> :
                     <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </td>
                  <td className="px-4 py-3 font-monospace text-xs text-slate-500">{p.id.split('-')[0].toUpperCase()}</td>
                  <td className="px-4 py-3 font-serif font-bold text-slate-900 truncate max-w-[200px]" title={p.name}>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold font-serif ${p.costOverrunPct > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                      {p.costOverrunPct > 0 ? '+' : ''}{p.costOverrunPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold font-serif ${p.scheduleSlipMonths > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                      {p.scheduleSlipMonths > 0 ? '+' : ''}{p.scheduleSlipMonths} mo
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {p.risk_reasons?.[0] ? (
                      <span className="bg-slate-100 px-2 py-1 border border-slate-200">
                        {p.risk_reasons[0]}
                      </span>
                    ) : '-'}
                  </td>
                  {/* Mini Sparkline for Physical Progress Trajectory */}
                  <td className="px-4 py-3">
                    <div className="w-16 h-3 bg-slate-200 mx-auto relative flex items-end">
                       <div className="bg-slate-800 h-full transition-all" style={{ width: `${p.physical_progress_pct}%` }}></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Risk Quadrant & Anomaly Feed (Moved below Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Risk Quadrant Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-300 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 bg-slate-100 border-b border-slate-300 p-4 flex items-center gap-2">
             <Target className="w-4 h-4 text-slate-600" /> Risk Quadrant Matrix
          </h2>
          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Schedule Slip" 
                  unit=" mo" 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} 
                  label={{ value: 'Schedule Slip (Months) →', position: 'bottom', fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Cost Overrun" 
                  unit="%" 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  label={{ value: 'Cost Overrun (%) ↑', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                
                {/* Quadrant Lines */}
                <ReferenceLine x={6} stroke="#cbd5e1" strokeWidth={2} />
                <ReferenceLine y={10} stroke="#cbd5e1" strokeWidth={2} />
                
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.riskBand === 'High' ? '#b91c1c' : entry.riskBand === 'Medium' ? '#d97706' : '#059669'} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-center gap-6">
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
               <span className="w-2 h-2 rounded-full bg-red-700"></span> Critical (Top Right)
             </div>
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
               <span className="w-2 h-2 rounded-full bg-amber-600"></span> Warning (Borderline)
             </div>
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
               <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Nominal (Bottom Left)
             </div>
          </div>
        </div>

        {/* Tactical Anomaly Feed */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="bg-white border border-slate-300 flex flex-col flex-1 h-[400px]">
             <h2 className="text-xs font-bold uppercase tracking-widest text-white bg-red-900 border-b border-red-950 p-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-300" /> Tactical Threat Feed
             </h2>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {anomalousProjects.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-monospace text-sm">
                    [0] ANOMALIES DETECTED
                  </div>
               ) : (
                 anomalousProjects.map(p => (
                   <div key={`threat-${p.id}`} className="border border-red-200 bg-red-50 flex flex-col group">
                     <div className="p-3 border-b border-red-100 flex justify-between items-start">
                        <div>
                          <p className="font-bold font-serif text-slate-900 leading-tight">{p.name}</p>
                          <p className="text-[10px] font-monospace text-slate-500 mt-1">{p.id}</p>
                        </div>
                        <span className="animate-pulse w-2 h-2 bg-red-600"></span>
                     </div>
                     <div className="p-3">
                       {p.isolation_forest_payload?.analytics_inbox.map((alert, idx) => (
                          <div key={idx} className="flex gap-2 text-xs mb-2 last:mb-0">
                            <span className="text-red-700 font-bold">[{alert.indicator_id}]</span>
                            <span className="text-slate-700">{alert.detail}</span>
                          </div>
                       ))}
                     </div>
                     <button 
                       onClick={() => onSelectProject(p)}
                       className="bg-red-900 text-red-50 text-[10px] font-bold uppercase tracking-widest p-2 hover:bg-red-800 transition-colors flex justify-center gap-2 items-center"
                     >
                        Investigate <ChevronRight className="w-3 h-3" />
                     </button>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>

      </div>

    </div>
  );
}
