import React, { useMemo } from 'react';
import { Project } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, AlertCircle, Activity, DollarSign } from 'lucide-react';

interface FiscalAnalyticsDashboardProps {
  projects: Project[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 shadow-xl">
        <p className="text-slate-200 font-bold font-serif mb-1">{label || payload[0]?.name}</p>
        <div className="text-xs font-monospace text-slate-400">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.name.includes('%') || entry.name.includes('Rate')
                  ? `${entry.value.toFixed(1)}%`
                  : `₹${entry.value.toLocaleString()} Cr`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function FiscalAnalyticsDashboard({ projects }: FiscalAnalyticsDashboardProps) {
  // Aggregate Stats
  const totalSanctioned = projects.reduce((acc, p) => acc + p.sanctioned_cost_cr, 0);
  const totalRevised = projects.reduce((acc, p) => acc + p.latest_revised_cost_cr, 0);
  const totalOverrun = totalRevised - totalSanctioned;
  
  // Calculate approximate "Burn" based on financial progress
  const totalUtilized = projects.reduce((acc, p) => acc + (p.latest_revised_cost_cr * (p.financial_progress_pct / 100)), 0);
  
  const fundUtilizationPct = totalRevised > 0 ? (totalUtilized / totalRevised) * 100 : 0;
  
  // Top Overrunning Projects (Heatmap Data)
  const overrunProjects = useMemo(() => {
    return [...projects]
      .filter(p => p.costOverrunCr > 0)
      .sort((a, b) => b.costOverrunCr - a.costOverrunCr)
      .slice(0, 10)
      .map(p => ({
        name: p.id.split('-')[0].toUpperCase(),
        fullName: p.name,
        overrunCr: p.costOverrunCr,
        overrunPct: p.costOverrunPct,
        sector: p.sector
      }));
  }, [projects]);

  // Sector-wise CAPEX breakdown
  const sectorCapex = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach(p => {
      map[p.sector] = (map[p.sector] || 0) + p.latest_revised_cost_cr;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Trend mapping - Elapsed vs Financial
  const burnRateData = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.latest_revised_cost_cr - a.latest_revised_cost_cr)
      .slice(0, 20)
      .map(p => ({
        name: p.id.split('-')[0].toUpperCase(),
        'Financial Progress %': p.financial_progress_pct,
        'Time Elapsed %': p.elapsed_time_pct,
        'Gap %': p.elapsed_time_pct - p.financial_progress_pct
      }));
  }, [projects]);

  const COLORS = ['#0f766e', '#0369a1', '#b91c1c', '#b45309', '#4d7c0f', '#4338ca', '#be185d'];

  return (
    <div className="bg-slate-50 p-6 md:p-8 font-sans max-w-7xl mx-auto min-h-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" /> Fiscal Cost & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-monospace">CAPEX · OPEX · BURN RATE · RUNWAY</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-300 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Sanctioned CAPEX</div>
          <div className="text-2xl font-mono font-bold text-slate-900">₹{totalSanctioned.toLocaleString()} <span className="text-sm text-slate-500">Cr</span></div>
        </div>
        
        <div className="bg-white border border-slate-300 p-5 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Revised CAPEX</div>
          <div className="text-2xl font-mono font-bold text-slate-900">₹{totalRevised.toLocaleString()} <span className="text-sm text-slate-500">Cr</span></div>
          {totalOverrun > 0 && (
            <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 border-b border-l border-red-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +₹{totalOverrun.toLocaleString()} Cr Overrun
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-300 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Utilized Fund</div>
          <div className="text-2xl font-mono font-bold text-emerald-700">₹{Math.round(totalUtilized).toLocaleString()} <span className="text-sm text-emerald-600/70">Cr</span></div>
        </div>

        <div className="bg-white border border-slate-300 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Burn Rate</div>
          <div className="flex items-end gap-3">
            <div className="text-2xl font-mono font-bold text-slate-900">{fundUtilizationPct.toFixed(1)}%</div>
            <div className="w-full h-2 bg-slate-200 mb-2">
              <div className="h-full bg-emerald-600" style={{ width: `${Math.min(fundUtilizationPct, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Burn Rate Deviation Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-300 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 bg-slate-100 border-b border-slate-300 p-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" /> Time Elapsed vs Financial Progress (Run Rate)
          </h2>
          <div className="p-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Time Elapsed %" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} strokeWidth={2} />
                <Area type="monotone" dataKey="Financial Progress %" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.6} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-white border border-slate-300 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 bg-slate-100 border-b border-slate-300 p-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-600" /> CAPEX by Sector
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorCapex}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorCapex.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-4 space-y-2 max-h-[120px] overflow-y-auto">
              {sectorCapex.map((entry, idx) => (
                <div className="flex justify-between items-center text-xs" key={idx}>
                  <div className="flex items-center gap-2 font-sans text-slate-700">
                    <span className="w-2 h-2 block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                  <div className="font-mono font-bold text-slate-900">₹{entry.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overrun Heatmap (Table) */}
      <div className="bg-white border border-slate-300 flex flex-col">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white bg-red-900 border-b border-red-950 p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-300" /> Capital Overrun Heatmap (Top 10)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-red-50 border-b border-red-100 text-xs uppercase font-bold text-red-900">
              <tr>
                <th className="px-4 py-3">Project ID</th>
                <th className="px-4 py-3 w-1/2">Project Title</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3 text-right">Overrun (Cr)</th>
                <th className="px-4 py-3 text-right">Overrun (%)</th>
                <th className="px-4 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {overrunProjects.map((p, idx) => {
                const isExtreme = p.overrunPct > 25;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-monospace text-xs text-slate-500">{p.name}</td>
                    <td className="px-4 py-3 font-serif font-bold text-slate-900 truncate max-w-[300px]" title={p.fullName}>{p.fullName}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.sector}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-700">+₹{p.overrunCr.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-700">+{p.overrunPct.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-2 bg-slate-200 relative">
                        <div className={`h-full ${isExtreme ? 'bg-red-700 animate-pulse' : 'bg-red-500'}`} style={{ width: `${Math.min(p.overrunPct, 100)}%` }}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {overrunProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-monospace text-sm">
                    NO COST OVERRUNS DETECTED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
