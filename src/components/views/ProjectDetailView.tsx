import React, { useState } from 'react';
import { Project } from '../../types';
import { ArrowLeft, Building2, MapPin, Activity, Calendar, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClearanceTimeline } from './ClearanceTimeline';
import ImmutableAuditLedger from './ImmutableAuditLedger';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ComposedChart, LineChart, Line, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, AreaChart, PieChart, Pie, Legend } from 'recharts';

import ProjectDashboard from './ProjectDashboard';

// --- Telemetry Generators ---
const generateProjectTelemetry = (project: Project) => {
  // Access data
  const accessData = Array.from({ length: 6 }).map((_, i) => ({
    month: `M${i+1}`,
    urban: Math.floor(project.physical_progress_pct * 0.8) + (i * 5),
    rural: Math.floor(project.physical_progress_pct * 0.3) + (i * 2),
    target: 100
  }));

  const demographicBreakdown = [
    { bracket: '0-18 yrs', value: 25 },
    { bracket: '19-35 yrs', value: 40 },
    { bracket: '36-55 yrs', value: 25 },
    { bracket: '55+ yrs', value: 10 },
  ];

  // Quality data (Radar)
  const qualityData = [
    { subject: 'Material Standards', A: Math.max(60, 100 - project.costOverrunPct), fullMark: 100 },
    { subject: 'Safety Protocol', A: project.riskBand === 'High' ? 65 : 95, fullMark: 100 },
    { subject: 'Defect Density', A: Math.max(50, 100 - (project.scheduleSlipMonths * 2)), fullMark: 100 },
    { subject: 'Durability Index', A: 85, fullMark: 100 },
    { subject: 'Compliance', A: project.riskBand === 'Low' ? 98 : 75, fullMark: 100 },
  ];

  const defectResolutionTimeline = Array.from({ length: 6 }).map((_, i) => ({
    month: `M${i+1}`,
    reported: Math.floor(Math.random() * 20) + 5,
    resolved: Math.floor(Math.random() * 15) + 2,
  }));

  // Utilization data (Composed)
  const utilizationData = Array.from({ length: 7 }).map((_, i) => {
    const isPeak = i === 3 || i === 4;
    return {
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      capacity: 100,
      load: isPeak ? 115 : 60 + Math.random() * 30
    };
  });

  // Affordability scatter data
  const affordabilityData = Array.from({ length: 15 }).map((_, i) => ({
    decile: i + 1,
    tariff: Math.floor(10 + Math.random() * 40 + (project.costOverrunPct * 0.5)),
    benchmark: 35,
    population: 1000 + Math.random() * 5000
  }));

  const capexOpexBreakdown = [
    { year: '2025', CAPEX: 450, OPEX: 50, Debt: 20 },
    { year: '2026', CAPEX: 300, OPEX: 80, Debt: 40 },
    { year: '2027', CAPEX: 150, OPEX: 120, Debt: 60 },
    { year: '2028', CAPEX: 50, OPEX: 150, Debt: 80 },
    { year: '2029', CAPEX: 20, OPEX: 160, Debt: 90 },
  ];

  return { accessData, demographicBreakdown, qualityData, defectResolutionTimeline, utilizationData, affordabilityData, capexOpexBreakdown };
};

interface ProjectDetailViewProps {
  project: Project;
  onClose: () => void;
}

type Dimension = 'fiscal' | 'access' | 'quality' | 'utilization' | 'affordability' | 'clearances';

export function ProjectDetailView({ project, onClose }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<Dimension>('fiscal');
  const navigate = useNavigate();
  const telemetry = generateProjectTelemetry(project);

  const handleBack = () => {
    onClose();
    navigate(-1);
  };

  const tabs: { id: Dimension; label: string }[] = [
    { id: 'fiscal', label: 'Fiscal Cost' },
    { id: 'access', label: 'Access' },
    { id: 'quality', label: 'Quality' },
    { id: 'utilization', label: 'Utilization' },
    { id: 'affordability', label: 'Affordability' },
    { id: 'clearances', label: 'Clearances' },
  ];

  // EVM Calculations
  const evmData = project.progress_history.map(ph => ({
    month: ph.month.substring(0, 3), // short month
    financial: ph.financial_pct,
    physical: ph.physical_pct,
    divergence: [Math.min(ph.physical_pct, ph.financial_pct), Math.max(ph.physical_pct, ph.financial_pct)]
  }));

  const latestFin = project.financial_progress_pct;
  const latestPhy = project.physical_progress_pct;
  const isSpendingFaster = latestFin > latestPhy;
  
  // Calculate burn velocity over history (avg monthly financial % increase)
  let burnVelocity = 0;
  if (project.progress_history.length > 1) {
    const first = project.progress_history[0].financial_pct;
    const last = project.progress_history[project.progress_history.length - 1].financial_pct;
    burnVelocity = (last - first) / (project.progress_history.length - 1);
  }

  return (
    <div className="flex-1 bg-slate-950 relative h-full flex flex-col overflow-hidden text-slate-100">
      
        {/* Foreground HUD */}
      <div className="relative z-10 flex flex-col h-full">
        
        {/* Header HUD */}
        <div className="bg-[#0a0f16]/95 backdrop-blur-md border-b border-slate-800 p-4 sm:p-6 z-20">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button 
                onClick={handleBack}
                className="mt-1 p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors rounded-none cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-none bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                    ID: {project.id}
                  </span>
                  <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-none border uppercase ${
                    project.riskBand === 'High' ? 'bg-red-900/20 text-red-400 border-red-500/50' :
                    project.riskBand === 'Medium' ? 'bg-amber-900/20 text-amber-400 border-amber-500/50' :
                    'bg-emerald-900/20 text-emerald-400 border-emerald-500/50'
                  }`}>
                    {project.riskBand} RISK
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide mb-2 uppercase">{project.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tracking-wider">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {project.implementing_agency}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {project.state}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white px-4 py-2 rounded-none transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Export Telemetry
              </button>
              <a href={`/sector/${encodeURIComponent(project.sector)}`} className="text-[11px] text-cyan-500/80 hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold">
                [ Return to {project.sector} Sector ]
              </a>
            </div>
          </div>
        </div>

        {/* Realtime Risk Radar */}
        <div className="px-6 py-4">
          <ProjectDashboard projectId={project.id} />
        </div>

        {/* DRISHTI Dimensions Navigation HUD */}
        <div className="bg-[#0a0f16]/95 backdrop-blur-md border-b border-slate-800 px-6 pt-4 z-20">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[11px] uppercase font-bold tracking-widest transition-colors border border-b-0 rounded-t-sm cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-slate-800/80 border-slate-700 text-cyan-400 shadow-[inset_0_2px_0_0_#22d3ee]' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area Overlay (Left and Right Wings) */}
        <div className="flex-1 overflow-y-auto p-6 z-20">
          <div className="w-full h-full flex flex-col lg:flex-row gap-6 justify-between items-start pointer-events-none">
            
            {activeTab === 'fiscal' && (
              <>
                {/* Left Side HUD - KPI Stack */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full lg:w-[280px] flex flex-col gap-4 pointer-events-auto shrink-0"
                >
                  <div className="bg-[#0a0f16]/95 backdrop-blur-md p-5 border border-slate-800 rounded-none shadow-2xl flex flex-col gap-4">
                    <h3 className="text-[11px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800 pb-2">Fiscal Topline</h3>
                    
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">Original Budget</p>
                      <p className="text-xl font-bold font-serif text-slate-300">₹{project.sanctioned_cost_cr.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">Anticipated Budget</p>
                      <p className={`text-xl font-bold font-serif ${project.latest_revised_cost_cr > project.sanctioned_cost_cr ? 'text-amber-400' : 'text-slate-300'}`}>
                        ₹{project.latest_revised_cost_cr.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">Current Expenditure</p>
                      <p className="text-xl font-bold font-serif text-slate-100">₹{((project.latest_revised_cost_cr * project.financial_progress_pct) / 100).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-0.5">Cost Overrun</p>
                      <p className={`text-2xl font-bold font-serif ${project.costOverrunPct > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {project.costOverrunPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Small BarChart */}
                  <div className="bg-[#0a0f16]/95 backdrop-blur-md p-4 border border-slate-800 rounded-none shadow-2xl h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Orig', amount: project.sanctioned_cost_cr },
                            { name: 'Rev', amount: project.latest_revised_cost_cr },
                            { name: 'Spent', amount: (project.latest_revised_cost_cr * project.financial_progress_pct) / 100 }
                          ]}
                          margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                          <RechartsTooltip 
                            cursor={{ fill: '#0f172a' }}
                            contentStyle={{ borderRadius: '0px', border: '1px solid #334155', backgroundColor: '#0a0f16', color: '#f8fafc', fontSize: '12px' }}
                            formatter={(value: number) => [`₹${value.toLocaleString()} Cr`, 'Amount']}
                          />
                          <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                            {
                              [project.sanctioned_cost_cr, project.latest_revised_cost_cr, (project.latest_revised_cost_cr * project.financial_progress_pct) / 100].map((entry, index) => {
                                const colors = ['#475569', project.latest_revised_cost_cr > project.sanctioned_cost_cr ? '#b91c1c' : '#334155', '#38bdf8'];
                                return <Cell key={`cell-${index}`} fill={colors[index]} />;
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Center HUD - EVM Analytics */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  className="flex-1 flex flex-col gap-6 pointer-events-auto"
                >
                  <div className="bg-[#0a0f16]/95 backdrop-blur-md p-6 border border-slate-800 rounded-none shadow-2xl h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4">
                      <div>
                        <h3 className="text-sm uppercase font-bold text-slate-300 tracking-wider">Earned Value Management (EVM)</h3>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">Variance between Physical Progress and Financial Expenditure</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Value (Physical %)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-pink-500" />
                          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Cost (Financial %)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={evmData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '0px', border: '1px solid #334155', backgroundColor: '#0a0f16', color: '#f8fafc', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(value: number, name: string) => [`${value}%`, name.toUpperCase()]}
                          />
                          <Area type="monotone" dataKey="divergence" stroke="none" fill="#f43f5e" fillOpacity={isSpendingFaster ? 0.1 : 0.05} />
                          <Line type="monotone" dataKey="physical" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#0a0f16', stroke: '#22d3ee', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="financial" stroke="#ec4899" strokeWidth={2} dot={{ r: 3, fill: '#0a0f16', stroke: '#ec4899', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>

                {/* Right Side HUD - Burn Rate & Timeline */}
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="w-full lg:w-[320px] flex flex-col gap-4 pointer-events-auto shrink-0"
                >
                  {/* Velocity Panel */}
                  <div className="bg-[#0a0f16]/95 backdrop-blur-md p-5 border border-slate-800 rounded-none flex flex-col shadow-2xl">
                    <h3 className="text-[11px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800 pb-2 mb-4">Capital Velocity</h3>
                    
                    <div className="mb-5">
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Avg. Monthly Burn</p>
                      <p className="text-2xl font-bold font-serif text-pink-400 flex items-baseline gap-1">
                        +{burnVelocity.toFixed(2)}% <span className="text-[10px] font-sans text-slate-500 uppercase tracking-widest">/mo</span>
                      </p>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-1">
                        <span>Capital Exhaustion</span>
                        <span className={latestFin > 90 ? 'text-red-400' : 'text-slate-300'}>{latestFin.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-600 to-pink-400" style={{ width: `${latestFin}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Timeline Analytics Moved Down */}
                  <div className="bg-[#0a0f16]/95 backdrop-blur-md p-5 border border-slate-800 rounded-none flex flex-col shadow-2xl">
                    <h3 className="text-[11px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800 pb-2 mb-4">Timeline Analytics</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Approval
                        </p>
                        <p className="text-[11px] font-mono text-white">{project.sanction_date}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Target
                        </p>
                        <p className="text-[11px] font-mono text-white">{project.original_completion_date}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" /> Revised
                        </p>
                        <p className="text-[11px] font-mono text-amber-400">{project.revised_completion_date}</p>
                      </div>
                      
                      <div className="mt-2 pt-3 border-t border-slate-800 flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Time Overrun</p>
                        <p className={`text-lg font-bold font-serif ${project.scheduleSlipMonths > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {project.scheduleSlipMonths} mo
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
            
            {activeTab === 'clearances' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl mx-auto pointer-events-auto flex flex-col gap-6"
              >
                <div className="bg-[#0a0f16]/95 backdrop-blur-md border border-slate-800 rounded-none p-6 shadow-2xl">
                  <ClearanceTimeline />
                </div>
                
                <ImmutableAuditLedger projectId={project.id} />
              </motion.div>
            )}
            
            {/* Access Tab Content */}
            {activeTab === 'access' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mx-auto pointer-events-auto grid grid-cols-12 gap-6"
              >
                {/* 7-col Visualization */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-6 border-b border-slate-800/50 pb-3">Demographic Penetration vs Time</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetry.accessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorUrban" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRural" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }}
                            itemStyle={{ color: '#cbd5e1' }}
                          />
                          <Area type="monotone" dataKey="urban" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorUrban)" name="Urban Core" />
                          <Area type="monotone" dataKey="rural" stroke="#10b981" fillOpacity={1} fill="url(#colorRural)" name="Rural / Tier-3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-6 border-b border-slate-800/50 pb-3">Age Bracket Penetration</h3>
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={telemetry.demographicBreakdown} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="bracket" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={80} />
                          <RechartsTooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Penetration %">
                            {telemetry.demographicBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#8b5cf6', '#d946ef', '#f43f5e', '#f97316'][index % 4]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 5-col Data Dense Narrative */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Target Demographic</p>
                    <p className="text-3xl font-sans font-light text-slate-200">{(project.sanctioned_cost_cr * 1.5).toLocaleString()} <span className="text-sm font-sans text-slate-500">citizens</span></p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Accessibility Index</p>
                      <p className="text-2xl font-serif text-emerald-400">8.4<span className="text-xs text-slate-500">/10</span></p>
                    </div>
                    <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Digital Inclusion</p>
                      <p className="text-2xl font-serif text-cyan-400">92<span className="text-xs text-slate-500">%</span></p>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5 flex-1">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Last-Mile Bottlenecks</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2">
                        <span className="text-slate-400">Urban Core Integration</span>
                        <span className="text-emerald-400 font-mono">94%</span>
                      </li>
                      <li className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2">
                        <span className="text-slate-400">Peri-urban Extension</span>
                        <span className="text-cyan-400 font-mono">68%</span>
                      </li>
                      <li className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2">
                        <span className="text-slate-400">Rural Tier-3 Connect</span>
                        <span className="text-amber-400 font-mono">32%</span>
                      </li>
                      <li className="flex justify-between items-center text-xs pt-2">
                        <span className="text-slate-500 italic">Primary Barrier</span>
                        <span className="text-slate-300">Terrain Topography</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quality Tab Content */}
            {activeTab === 'quality' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mx-auto pointer-events-auto grid grid-cols-12 gap-6"
              >
                {/* 5-col Index Summary */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6 flex flex-col flex-1">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-6 border-b border-slate-800/50 pb-3">Audit Timeline & Events</h3>
                    <div className="flex-1 space-y-4">
                      <div className="pl-4 border-l border-emerald-500/30 relative">
                        <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[4px] top-1" />
                        <p className="text-[10px] text-emerald-500 font-mono mb-1">T-45 DAYS</p>
                        <p className="text-xs text-slate-300">ISO 9001:2015 Material Standardization Audit Passed.</p>
                      </div>
                      <div className="pl-4 border-l border-slate-800 relative">
                        <div className="absolute w-2 h-2 rounded-full bg-slate-600 -left-[4px] top-1" />
                        <p className="text-[10px] text-slate-500 font-mono mb-1">T-12 DAYS</p>
                        <p className="text-xs text-slate-400">Routine Safety & Hazard Inspection.</p>
                      </div>
                      <div className={`pl-4 border-l ${project.riskBand === 'High' ? 'border-red-500/30' : 'border-slate-800'} relative`}>
                        <div className={`absolute w-2 h-2 rounded-full ${project.riskBand === 'High' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'} -left-[4px] top-1`} />
                        <p className={`text-[10px] ${project.riskBand === 'High' ? 'text-red-500' : 'text-slate-500'} font-mono mb-1`}>PRESENT</p>
                        <p className="text-xs text-slate-300">{project.riskBand === 'High' ? 'Critical Defect Density threshold breached. Pending review.' : 'All operational parameters within normative range.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800/50 pb-2">Material Core Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Concrete Grade (Avg)</span>
                        <span className="text-slate-200">M40 <span className="text-emerald-500 ml-1">✓</span></span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tensile Yield Strength</span>
                        <span className="text-slate-200">520 MPa <span className="text-emerald-500 ml-1">✓</span></span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Non-Destructive Test Rate</span>
                        <span className="text-amber-400">92% <span className="text-slate-500 ml-1">(! Target 98%)</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-col Charts */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6 flex-1">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-2 text-right">Multi-dimensional Quality Index</h3>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={telemetry.qualityData}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
                          <Radar name="Project Quality Baseline" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-2">Defect Resolution Velocity</h3>
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={telemetry.defectResolutionTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                          <Line type="monotone" dataKey="reported" name="Issues Reported" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="resolved" name="Issues Resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Utilization Tab Content */}
            {activeTab === 'utilization' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mx-auto pointer-events-auto grid grid-cols-12 gap-6"
              >
                {/* 8-col Composed Chart */}
                <div className="col-span-12 lg:col-span-8 bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6 flex flex-col">
                  <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-6 border-b border-slate-800/50 pb-3">Load vs Baseline Capacity (Weekly Cycle)</h3>
                  <div className="h-[280px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={telemetry.utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }}
                        />
                        <Bar dataKey="load" name="Recorded Load" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                          {
                            telemetry.utilizationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.load > 100 ? '#ef4444' : '#3b82f6'} />
                            ))
                          }
                        </Bar>
                        <Line type="monotone" dataKey="capacity" name="Design Capacity" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mean Time Between Failures</p>
                      <p className="text-xl font-mono text-emerald-400">4,200 <span className="text-xs font-sans text-slate-500">Hours</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mean Time To Recovery</p>
                      <p className="text-xl font-mono text-amber-400">3.5 <span className="text-xs font-sans text-slate-500">Hours</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Service Level Agreement</p>
                      <p className="text-xl font-mono text-cyan-400">99.98<span className="text-xs font-sans text-slate-500">% Uptime</span></p>
                    </div>
                  </div>
                </div>

                {/* 4-col Capacity Matrix */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5 h-full flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Peak Load Tolerance</p>
                    <p className="text-4xl font-sans font-light text-red-400 mb-6">115% <span className="text-xs text-slate-500 uppercase tracking-wider">Design</span></p>
                    
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Current Utilization</p>
                    <p className="text-3xl font-sans font-light text-cyan-400 mb-2">{project.physical_progress_pct > 90 ? '84' : project.physical_progress_pct > 50 ? '45' : '0'}%</p>
                    <div className="h-1 w-full bg-slate-900 relative">
                      <div className="absolute top-0 left-0 h-full bg-cyan-500" style={{ width: `${project.physical_progress_pct > 90 ? '84' : project.physical_progress_pct > 50 ? '45' : '0'}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2 text-right">Against baseline designed capacity</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Affordability Tab Content */}
            {activeTab === 'affordability' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mx-auto pointer-events-auto grid grid-cols-12 gap-6"
              >
                {/* 4-col Economic Brief */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6 flex flex-col">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-6 border-b border-slate-800/50 pb-3">Economic Viability Brief</h3>
                    <div className="space-y-6 flex-1">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Per Capita Infra Cost</p>
                        <p className="text-3xl font-sans font-light text-slate-200">₹{Math.floor((project.latest_revised_cost_cr * 10000000) / (project.sanctioned_cost_cr * 15000)).toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Global Tariff Variance</p>
                        <p className={`text-2xl font-sans font-light ${project.costOverrunPct > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {project.costOverrunPct > 10 ? '+8.5%' : '-2.1%'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">VGF Subsidy Outlook</p>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          {project.costOverrunPct > 10 
                            ? 'Capital velocity and overrun trajectory necessitate operational viability gap funding (VGF) to maintain pricing parity for lower deciles.' 
                            : 'Asset is projected to be self-sustaining within 4 years of operationalization. No severe VGF interventions required.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Internal Rate of Return</p>
                      <p className="text-2xl font-serif text-emerald-400">12.4%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Net Present Value</p>
                      <p className="text-2xl font-serif text-cyan-400">+₹4.2<span className="text-sm font-sans">B</span></p>
                    </div>
                  </div>
                </div>

                {/* 8-col Deep Financials */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-2 text-right">Tariff vs Benchmark across Deciles</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis type="number" dataKey="decile" name="Cohort Decile" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis type="number" dataKey="tariff" name="Tariff (₹)" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <ZAxis type="number" dataKey="population" range={[50, 400]} name="Population Range" />
                          <RechartsTooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }}
                          />
                          <Scatter name="Actual Tariff" data={telemetry.affordabilityData} fill="#f59e0b" fillOpacity={0.6} />
                          <Scatter name="Global Benchmark" data={telemetry.affordabilityData.map(d => ({...d, tariff: d.benchmark}))} fill="#10b981" fillOpacity={0.4} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0a0f16]/80 backdrop-blur-md border border-slate-800/80 p-6 flex-1">
                    <h3 className="text-sm font-serif text-slate-300 tracking-wider mb-4">CAPEX vs OPEX Lifecycle (5Y Projections)</h3>
                    <div className="h-[150px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={telemetry.capexOpexBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                          <Bar dataKey="CAPEX" name="Capital Expenditure (₹ Cr)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="OPEX" name="Operating Expense (₹ Cr)" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Debt" name="Debt Servicing (₹ Cr)" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const tabLabels: Record<Dimension, string> = {
  fiscal: 'Fiscal',
  access: 'Access',
  quality: 'Quality',
  utilization: 'Utilization',
  affordability: 'Affordability',
  clearances: 'Clearances',
};
