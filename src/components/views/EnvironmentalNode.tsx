import React from 'react';

// Renders inside the PMG Dashboard using your established institutional aesthetic.
export function EnvironmentalNode({ projectId, pm10Level, isCompliant }: { projectId: string, pm10Level: number, isCompliant: boolean }) {
  return (
    <div className={`p-4 border ${isCompliant ? 'bg-emerald-50 border-emerald-200' : 'bg-[#8a3324]/10 border-[#8a3324]'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono font-bold uppercase text-slate-600">NGT IoT Telemetry</span>
        {!isCompliant && (
          <span className="bg-[#8a3324] text-white text-[10px] font-mono px-2 py-0.5 animate-pulse">
            COMPLIANCE BREACH
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-mono font-bold ${isCompliant ? 'text-emerald-700' : 'text-[#8a3324]'}`}>
          {pm10Level.toFixed(1)}
        </span>
        <span className="text-xs font-mono text-slate-500 mb-1">µg/m³ PM10 (48H AVG)</span>
      </div>
      {!isCompliant && (
        <p className="mt-3 text-xs font-mono text-[#8a3324] border-t border-[#8a3324]/20 pt-2">
          EARTHWORK TRANCHE FROZEN UNTIL SUPPRESSION PROTOCOLS EXECUTED.
        </p>
      )}
    </div>
  );
}
