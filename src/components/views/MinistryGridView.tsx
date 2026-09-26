import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';
import { 
  Train, 
  Car, 
  Building2, 
  Droplet, 
  Wifi, 
  Zap, 
  Activity,
  Search,
  Terminal,
  Cpu,
  RefreshCw,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MinistryGridViewProps {
  projects: Project[];
}

const sectorConfig: Record<string, { icon: React.ElementType, title: string, description: string, color: string, bg: string }> = {
  'Railways': { icon: Train, title: 'Ministry of Railways', description: 'National rail network and transit systems', color: 'text-slate-800', bg: 'bg-slate-100' },
  'Roads': { icon: Car, title: 'Ministry of Road Transport', description: 'Highways, expressways, and road infrastructure', color: 'text-slate-800', bg: 'bg-slate-100' },
  'Power': { icon: Zap, title: 'Ministry of Power', description: 'Energy generation and transmission grids', color: 'text-slate-800', bg: 'bg-slate-100' },
  'Urban Infra': { icon: Building2, title: 'Ministry of Urban Affairs', description: 'Metro rail and urban development projects', color: 'text-slate-800', bg: 'bg-slate-100' },
  'Water': { icon: Droplet, title: 'Ministry of Jal Shakti', description: 'Irrigation and rural water supply', color: 'text-slate-800', bg: 'bg-slate-100' },
  'Telecom': { icon: Wifi, title: 'Ministry of Communications', description: 'Digital connectivity and telecom infrastructure', color: 'text-slate-800', bg: 'bg-slate-100' },
};

// Mock Concept Mapping for AI Search
const conceptMap: Record<string, string[]> = {
  'water': ['Water', 'Dam', 'River', 'Jal', 'Irrigation'],
  'flood': ['Water', 'Dam', 'River'],
  'transport': ['Roads', 'Railways', 'Urban Infra'],
  'train': ['Railways', 'Track', 'Locomotive'],
  'freight': ['Railways', 'Roads', 'Corridor'],
  'energy': ['Power', 'Grid', 'Solar', 'Thermal'],
  'internet': ['Telecom', 'Fiber', 'Broadband'],
  'city': ['Urban Infra', 'Metro', 'Smart City']
};

const Sparkline = ({ data }: { data: number[] }) => {
  const max = 100;
  return (
    <div className="flex items-end h-10 gap-[1px] w-full mt-2">
      {data.map((val, i) => (
        <div key={i} className="flex-1 bg-slate-200 relative h-full">
           <div 
             className="absolute bottom-0 w-full bg-slate-800 transition-all duration-500 ease-in-out" 
             style={{ height: `${(val / max) * 100}%` }}
           />
        </div>
      ))}
    </div>
  );
};

const NodeMeshMap = ({ isSyncing }: { isSyncing: boolean }) => (
  <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
    <path d="M10,30 L30,10 L60,20 L80,50 L40,55 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
    <path d="M30,10 L80,50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
    <path d="M10,30 L40,55" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
    <path d="M60,20 L95,15" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
    
    <circle cx="10" cy="30" r="2" className={`fill-teal-500 ${isSyncing ? 'animate-ping' : ''}`} />
    <circle cx="30" cy="10" r="2.5" className="fill-emerald-500" />
    <circle cx="60" cy="20" r="1.5" className="fill-slate-500" />
    <circle cx="80" cy="50" r="3" className={`fill-teal-600 ${isSyncing ? 'animate-pulse' : ''}`} />
    <circle cx="40" cy="55" r="2" className="fill-emerald-600 animate-pulse" />
    <circle cx="95" cy="15" r="1.5" className="fill-indigo-400" />
  </svg>
);

export function MinistryGridView({ projects }: MinistryGridViewProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Telemetry State
  const [systemLoad, setSystemLoad] = useState(42);
  const [loadHistory, setLoadHistory] = useState<number[]>(Array(24).fill(42));
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['[SYS] Initializing DRISHTI core modules...']);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mutable ref for interval to access latest sync state
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  // Live Telemetry Simulation
  useEffect(() => {
    const loadInterval = setInterval(() => {
      setSystemLoad(prev => {
        let variance = Math.floor(Math.random() * 10) - 4; // -4 to +5
        if (isSyncingRef.current) variance += Math.floor(Math.random() * 20); // Spikes during sync
        
        let newLoad = prev + variance;
        if (newLoad < 20) newLoad = 20;
        if (newLoad > 99) newLoad = 99;
        
        setLoadHistory(curr => {
            const next = [...curr, newLoad];
            if (next.length > 24) next.shift();
            return next;
        });
        
        return newLoad;
      });
    }, 2000);

    const logInterval = setInterval(() => {
      if (isSyncingRef.current) return; // Don't add random logs if manual sync is running
      const logsPool = [
        '[NET] PFMS Node sync completed: 42 blocks verified.',
        '[SAT] Ingesting Sentinel-2 tile (L2A) over MH region.',
        '[ML] Isolation Forest inference updated: +2 anomalies.',
        '[SEC] Cryptographic hash validated for project ID-773.',
        '[SYS] Purging stale offline cache (3MB freed).',
        '[OPS] Ministry of Jal Shakti node heartbeat acknowledged.'
      ];
      setTerminalLogs(prev => {
        const newLog = logsPool[Math.floor(Math.random() * logsPool.length)];
        const updated = [...prev, `[${new Date().toLocaleTimeString('en-US', {hour12:false})}] ${newLog}`];
        return updated.slice(-6); // Keep only last 6
      });
    }, 3200);

    return () => {
      clearInterval(loadInterval);
      clearInterval(logInterval);
    };
  }, []);

  const handleManualAction = (actionType: string) => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    const time = new Date().toLocaleTimeString('en-US', {hour12:false});
    setTerminalLogs(prev => [...prev.slice(-5), `[${time}] [MANUAL] Initiating ${actionType}...`]);
    
    // Immediate spike
    setSystemLoad(95);
    setLoadHistory(curr => {
      const next = [...curr, 88, 95];
      return next.slice(-24);
    });

    setTimeout(() => {
      setIsSyncing(false);
      setTerminalLogs(prev => [...prev.slice(-5), `[${new Date().toLocaleTimeString('en-US', {hour12:false})}] [MANUAL] ${actionType} complete.`]);
    }, 4500);
  };

  // AI Semantic Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    
    let results = projects.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.id.toLowerCase().includes(query) ||
      p.sector.toLowerCase().includes(query)
    ).map(p => ({ project: p, confidence: 99, type: 'Exact Match' }));

    Object.entries(conceptMap).forEach(([concept, tags]) => {
      if (concept.includes(query) || query.includes(concept)) {
        projects.forEach(p => {
          if (tags.some(tag => p.sector.includes(tag) || p.name.includes(tag))) {
            if (!results.find(r => r.project.id === p.id)) {
              results.push({
                project: p,
                confidence: Math.floor(Math.random() * 15) + 75,
                type: `Semantic Match: ${concept.toUpperCase()}`
              });
            }
          }
        });
      }
    });

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }, [searchQuery, projects]);

  const sectorStats = useMemo(() => {
    const stats: Record<string, { count: number, totalCost: number, avgProgress: number, riskCount: number }> = {};
    projects.forEach(p => {
      if (!stats[p.sector]) stats[p.sector] = { count: 0, totalCost: 0, avgProgress: 0, riskCount: 0 };
      stats[p.sector].count += 1;
      stats[p.sector].totalCost += p.latest_revised_cost_cr;
      stats[p.sector].avgProgress += p.physical_progress_pct;
      if (p.riskBand === 'High') stats[p.sector].riskCount += 1;
    });
    Object.keys(stats).forEach(s => {
      stats[s].avgProgress = stats[s].avgProgress / stats[s].count;
    });
    return stats;
  }, [projects]);

  const sortedSectors = Object.keys(sectorStats).sort((a, b) => sectorStats[b].totalCost - sectorStats[a].totalCost);
  const totalCostAll = sortedSectors.reduce((sum, s) => sum + sectorStats[s].totalCost, 0);
  const totalProjectsAll = projects.length;
  const totalHighRisk = projects.filter(p => p.riskBand === 'High').length;

  const nodes = [
    { id: 'pfms', name: 'PFMS Gateway', status: isSyncing ? 'Flushing...' : '12ms ping', color: 'bg-emerald-500', pingColor: 'bg-emerald-400', metrics: { uptime: '99.98%', packets: '1.2M', loss: '0.01%' } },
    { id: 'sentinel', name: 'Sentinel-2 API', status: isSyncing ? 'Forced Sync...' : 'Syncing...', color: 'bg-teal-500', pingColor: 'bg-teal-400', metrics: { uptime: '98.50%', packets: '450K', loss: '2.40%' } },
    { id: 'sar', name: 'SAR ML Engine', status: isSyncing ? 'Re-calibrating...' : 'Inference Active', color: 'bg-indigo-500', pingColor: 'bg-indigo-400', metrics: { uptime: '100.0%', packets: '3.1M', loss: '0.00%' } }
  ];

  return (
    <div className="min-h-full p-8 bg-slate-50 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - Asymmetric Typography */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 pb-6 border-b border-slate-300 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-serif font-bold tracking-tight text-slate-950">National Infrastructure Overview</h1>
            <p className="text-slate-600 mt-2 text-md max-w-xl">Active portfolio analysis and institutional resource allocation across critical ministries.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Authorized Capital</p>
            <p className="text-2xl font-serif font-bold text-slate-900">₹{(totalCostAll / 1000).toFixed(1)}k Cr</p>
          </div>
        </motion.div>

        {/* Asymmetrical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Semantic Search Bar */}
            <div className="relative">
               <div className="flex items-center bg-white border border-slate-300 p-2 focus-within:border-slate-800 transition-colors">
                 <Search className="w-5 h-5 text-slate-400 mx-3" />
                 <input 
                   type="text"
                   placeholder="Neural Search: Enter project ID, name, or concept (e.g. 'flood', 'freight')..."
                   className="flex-1 bg-transparent border-none outline-none text-slate-900 font-serif placeholder:font-sans placeholder:text-slate-400"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 {searchQuery && (
                   <span className="text-[10px] font-bold uppercase text-teal-600 tracking-wider mr-4 flex items-center gap-1">
                     <Cpu className="w-3 h-3" /> AI Active
                   </span>
                 )}
               </div>

               {/* Search Results Overlay */}
               <AnimatePresence>
                 {searchQuery && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="absolute z-10 top-full left-0 right-0 bg-slate-900 border border-slate-700 shadow-xl mt-1"
                   >
                     {searchResults.length === 0 ? (
                       <div className="p-4 text-slate-400 text-sm font-monospace text-center">No structural matches found for "{searchQuery}".</div>
                     ) : (
                       <div className="flex flex-col">
                         {searchResults.map((result, idx) => (
                           <div 
                             key={result.project.id}
                             onClick={() => navigate(`/sector/${encodeURIComponent(result.project.sector)}/project/${result.project.id}`)}
                             className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between ${idx === searchResults.length - 1 ? 'border-b-0' : ''}`}
                           >
                             <div>
                               <p className="text-slate-200 font-serif font-bold">{result.project.name}</p>
                               <p className="text-slate-500 text-xs mt-1 font-monospace">{result.project.id} • {result.project.sector}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-teal-400 text-xs font-bold">{result.confidence}% CONFIDENCE</p>
                               <p className="text-slate-500 text-[10px] uppercase">{result.type}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-sm"></span> Departmental Portfolios
              </h2>
              
              <div className="flex flex-col gap-4">
                {sortedSectors.map((sector, index) => {
                  const config = sectorConfig[sector] || { icon: Activity, title: sector, description: 'Sector projects', color: 'text-slate-800', bg: 'bg-slate-100' };
                  const Icon = config.icon;
                  const stats = sectorStats[sector];

                  return (
                    <motion.div
                      key={sector}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/sector/${encodeURIComponent(sector)}`)}
                      className="group cursor-pointer bg-white border border-slate-300 hover:border-slate-800 transition-colors p-0 flex flex-col sm:flex-row items-stretch"
                    >
                      <div className="w-16 flex items-center justify-center bg-slate-50 border-r border-slate-200 group-hover:bg-slate-100 transition-colors">
                        <Icon className="w-6 h-6 text-slate-600 group-hover:text-slate-950" />
                      </div>
                      
                      <div className="flex-1 p-5 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-slate-900 font-serif leading-tight">{config.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{config.description}</p>
                      </div>

                      <div className="flex items-center gap-6 p-5 border-t sm:border-t-0 sm:border-l border-slate-200 bg-slate-50/50">
                        <div className="min-w-[80px]">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Projects</p>
                          <p className="text-lg font-bold font-serif text-slate-900">{stats.count}</p>
                        </div>
                        <div className="min-w-[90px]">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Valuation</p>
                          <p className="text-lg font-bold font-serif text-slate-900">₹{(stats.totalCost / 1000).toFixed(0)}k <span className="text-xs font-sans text-slate-500 font-normal">Cr</span></p>
                        </div>
                        <div className="min-w-[60px] text-right">
                          {stats.riskCount > 0 ? (
                            <div className="inline-block px-2 py-1 border border-red-200 bg-red-50 text-red-700 text-xs font-bold">
                              {stats.riskCount} At Risk
                            </div>
                          ) : (
                            <div className="inline-block px-2 py-1 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">
                              Stable
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white border border-slate-300 flex flex-col">
               <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 bg-slate-100 border-b border-slate-300 p-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-800 rounded-sm"></span> Advanced Telemetry
              </h2>
              
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Active Projects</p>
                  <p className="text-2xl font-serif font-bold text-slate-900">{totalProjectsAll}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Anomalies</p>
                  <p className="text-2xl font-serif font-bold text-red-700">{totalHighRisk}</p>
                </div>
              </div>
              
              <div className="w-full h-px bg-slate-200" />
              
              <div className="p-6 pb-2 bg-slate-50">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Network Load & Bandwidth</p>
                  <p className={`text-sm font-bold font-monospace ${systemLoad > 80 ? 'text-red-600' : 'text-slate-800'}`}>
                    {systemLoad}%
                  </p>
                </div>
                <Sparkline data={loadHistory} />
              </div>
              
              <div className="w-full h-px bg-slate-200" />

              <div className="p-4 bg-white relative overflow-hidden flex h-24">
                 <div className="w-1/2 flex flex-col justify-center relative z-10">
                   <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Node Topography</p>
                   <div className="flex items-center gap-2 text-xs text-slate-600 font-monospace">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Active: 3
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-600 font-monospace mt-1">
                     <span className="w-2 h-2 bg-slate-300 rounded-full"></span> Standby: 2
                   </div>
                 </div>
                 <div className="w-1/2 absolute right-0 top-0 bottom-0 pointer-events-none">
                    <NodeMeshMap isSyncing={isSyncing} />
                 </div>
              </div>

              <div className="w-full h-px bg-slate-200" />
              
              <div className="p-4 bg-slate-50 flex flex-col gap-2">
                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Diagnostic Interfaces</p>
                
                {nodes.map(node => (
                  <div key={node.id} className="border border-slate-200 bg-white overflow-hidden transition-all">
                    <div 
                      onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${node.pingColor} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${node.color}`}></span>
                        </span>
                        {node.name}
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-monospace text-slate-500">{node.status}</span>
                         {expandedNode === node.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedNode === node.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 pb-3 border-t border-slate-100 bg-slate-50"
                        >
                          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                             <div>
                               <p className="text-[9px] text-slate-400 uppercase font-bold">Uptime</p>
                               <p className="text-xs font-monospace text-slate-700">{node.metrics.uptime}</p>
                             </div>
                             <div>
                               <p className="text-[9px] text-slate-400 uppercase font-bold">Packets</p>
                               <p className="text-xs font-monospace text-slate-700">{node.metrics.packets}</p>
                             </div>
                             <div>
                               <p className="text-[9px] text-slate-400 uppercase font-bold">P.Loss</p>
                               <p className="text-xs font-monospace text-slate-700">{node.metrics.loss}</p>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Manual Overrides */}
              <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                 <button 
                   onClick={() => handleManualAction('FORCE_SYNC')}
                   disabled={isSyncing}
                   className={`flex-1 flex items-center justify-center gap-2 p-2 border text-xs font-bold uppercase tracking-wider transition-colors ${
                     isSyncing ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed' : 'border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white'
                   }`}
                 >
                   <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
                 </button>
                 <button 
                   onClick={() => handleManualAction('FLUSH_CACHE')}
                   disabled={isSyncing}
                   className={`flex-1 flex items-center justify-center gap-2 p-2 border text-xs font-bold uppercase tracking-wider transition-colors ${
                     isSyncing ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-slate-800 hover:bg-slate-100'
                   }`}
                 >
                   <Database className="w-3 h-3" /> Flush
                 </button>
              </div>

              {/* Live Terminal Log */}
              <div className="bg-slate-900 border-t border-slate-700 p-4 h-48 overflow-hidden relative">
                <div className="absolute top-2 right-3 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">DRISHTI v2.1</span>
                </div>
                <div className="mt-4 flex flex-col justify-end h-full">
                  <AnimatePresence>
                    {terminalLogs.map((log, index) => (
                      <motion.div 
                        key={log + index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-monospace text-teal-400/80 mb-1 leading-relaxed"
                      >
                        {log}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
