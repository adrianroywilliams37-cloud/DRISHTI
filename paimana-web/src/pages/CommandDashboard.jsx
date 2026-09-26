/**
 * PAIMANA Web - Ministry Analyst Apex View
 */

import React from 'react';
import PmgEscalationQueue from '../components/PmgEscalationQueue';
import { usePaimanaRealtime } from '../hooks/usePaimanaRealtime';
// import DigitalTwinCommandCenter from '../components/DigitalTwinCommandCenter';

export default function CommandDashboard() {
  // Activate the background WebSocket listener. 
  // It runs silently, fetching nothing until the Python backend fires a trigger.
  usePaimanaRealtime();

  return (
    <div className="h-screen w-screen bg-[#0f172a] text-slate-300 font-sans overflow-hidden flex flex-col">
      {/* Institutional Top Navbar */}
      <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
          <h1 className="text-sm font-serif font-bold text-white tracking-widest uppercase">
            PAIMANA APEX COMMAND
          </h1>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          NODE: MINISTRY_ANALYST_01 | LATENCY: &lt; 40ms
        </span>
      </header>

      {/* Bifurcated Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: The 3D Digital Twin (Placeholder for now) */}
        <div className="flex-1 border-r border-slate-700 relative bg-slate-950 flex items-center justify-center">
           <span className="text-slate-600 font-mono text-sm">[ DIGITAL TWIN RENDER CONTEXT ]</span>
        </div>

        {/* Right Pane: The PMG Escalation Queue */}
        <div className="w-96 flex flex-col bg-slate-900">
          <PmgEscalationQueue />
        </div>
        
      </div>
    </div>
  );
}
