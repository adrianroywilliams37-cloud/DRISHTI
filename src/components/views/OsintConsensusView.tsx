import React from 'react';

interface OsintConsensusViewProps {
  projectId: string;
  bhashiniText: string;
  clusterWeight: number;
  activeReports: number;
}

export function OsintConsensusView({ projectId, bhashiniText, clusterWeight, activeReports }: OsintConsensusViewProps) {
  return (
    <div className="p-5 bg-white border border-slate-200 relative overflow-hidden">
      
      {/* Background Watermark */}
      <div className="absolute -right-4 -bottom-8 text-9xl text-slate-50 font-bold opacity-50 pointer-events-none">
        OSINT
      </div>

      <div className="relative z-10">
        <header className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-800">Public Telemetry Discrepancy</h3>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              ASSET: {projectId}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-block bg-[#8a3324] text-white font-mono text-[10px] px-2 py-1 uppercase animate-pulse">
              Consensus Threshold Breached
            </span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-7">
            <span className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
              Bhashini Translated Consensus
            </span>
            <p className="text-sm text-slate-700 italic border-l-2 border-slate-300 pl-3 leading-relaxed">
              "{bhashiniText}"
            </p>
          </div>
          
          <div className="col-span-5 grid grid-cols-2 gap-2">
            <div className="p-2 border border-slate-200 bg-[#F9FAFB] text-center">
              <span className="block text-[10px] font-mono text-slate-500 mb-1">VERIFIED REPORTS</span>
              <span className="text-xl font-mono font-bold text-slate-800">{activeReports}</span>
            </div>
            <div className="p-2 border border-slate-200 bg-[#F9FAFB] text-center">
              <span className="block text-[10px] font-mono text-slate-500 mb-1">CLUSTER WEIGHT</span>
              <span className="text-xl font-mono font-bold text-[#8a3324]">
                {clusterWeight.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button className="flex-1 py-3 bg-[#8a3324] text-white font-mono text-xs font-bold hover:bg-[#73291d] transition-colors border border-[#5c2117]">
            SUMMON NODAL OFFICER
          </button>
          <button className="flex-1 py-3 bg-white text-slate-700 font-mono text-xs font-bold hover:bg-slate-50 transition-colors border border-slate-300">
            VIEW CRYPTOGRAPHIC IMAGES
          </button>
        </div>
      </div>
    </div>
  );
}
