/**
 * PAIMANA Web - PMG Escalation Queue
 * Author: Adrian Roy Williams
 * Role: Renders the prioritized queue of algorithmic halts (SAR failures, 
 * NTP spoofing, NGT tampering) awaiting human cryptographic override.
 */

import React, { useState } from 'react';
import { usePaimanaStore } from '../store/usePaimanaStore';
import { AlertOctagon, ShieldAlert, Cpu } from 'lucide-react';

export default function PmgEscalationQueue() {
  const escalations = usePaimanaStore((state) => state.escalations);
  const executeCryptographicOverride = usePaimanaStore((state) => state.executeCryptographicOverride);
  
  const [pinInput, setPinInput] = useState('');
  const [unlockingId, setUnlockingId] = useState(null);

  const handleOverride = async (id) => {
    const success = await executeCryptographicOverride(id, pinInput);
    if (!success) alert('CRYPTOGRAPHIC REJECTION: Invalid PMG PIN.');
    setPinInput('');
    setUnlockingId(null);
  };

  return (
    <div className="w-full h-full bg-[#0f172a] border border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#8a3324]" />
            Apex Escalation Queue
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Awaiting PMG Cryptographic Resolution
          </p>
        </div>
        <div className="bg-[#8a3324]/20 border border-[#8a3324] px-3 py-1">
          <span className="text-xs font-mono font-bold text-red-400 animate-pulse">
            {escalations.length} ACTIVE HALTS
          </span>
        </div>
      </div>

      {/* Queue Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {escalations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <Cpu className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-mono uppercase">System Nominal. Zero Escalations.</span>
          </div>
        ) : (
          escalations.map((esc) => (
            <div key={esc.id} className="bg-slate-800 border border-slate-600 relative overflow-hidden">
              
              {/* Severity Strip */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8a3324]"></div>

              <div className="p-4 pl-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-2 py-0.5 uppercase">
                    ID: {esc.id} | ASSET: {esc.project_id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(esc.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  {esc.threat_vector.replace(/_/g, ' ')}
                </h3>

                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4 border-l-2 border-slate-600 pl-3">
                  {esc.notes}
                </p>

                <div className="border-t border-slate-700 pt-3">
                  <span className="block text-[10px] font-mono text-slate-400 mb-2 uppercase">
                    Algorithmic Mandate: <strong className="text-emerald-400">{esc.algorithmic_mandate}</strong>
                  </span>

                  {unlockingId === esc.id ? (
                    <div className="flex gap-2 h-8">
                      <input 
                        type="password"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="ENTER PMG PIN"
                        className="flex-1 bg-slate-900 border border-slate-600 text-white font-mono text-xs px-3 focus:outline-none focus:border-[#8a3324]"
                      />
                      <button 
                        onClick={() => handleOverride(esc.id)}
                        className="px-4 bg-[#8a3324] text-white font-mono text-[10px] font-bold hover:bg-red-900 transition-colors"
                      >
                        EXECUTE
                      </button>
                      <button 
                        onClick={() => setUnlockingId(null)}
                        className="px-4 bg-slate-700 text-slate-300 font-mono text-[10px] hover:bg-slate-600 transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-emerald-900/30 border border-emerald-700 text-emerald-400 font-mono text-[10px] hover:bg-emerald-900/50 transition-colors">
                        AUTHORIZE ALGORITHMIC MANDATE
                      </button>
                      <button 
                        onClick={() => setUnlockingId(esc.id)}
                        className="flex-1 py-2 bg-transparent border border-slate-500 border-dashed text-slate-400 font-mono text-[10px] hover:bg-slate-800 transition-colors"
                      >
                        OVERRIDE (REQUIRES PIN)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
