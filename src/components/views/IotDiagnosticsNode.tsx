/**
 * DRISHTI IoT Sensor Diagnostic Node
 * Author: Adrian Roy Williams
 * Role: Visualizes edge telemetry volatility to expose sensor tampering.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function IotDiagnosticsNode({ sensorId }: { sensorId: string }) {
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    // Simulated fetch for UI rendering
    const fetchSensorState = async () => {
      setDiagnostics({
        status: 'TAMPER_LOCKOUT', // NOMINAL, NGT_BREACH, TAMPER_LOCKOUT
        current_pm10: 2.1,
        rolling_avg: 2.15,
        volatility_stdev: 0.04, // Unnaturally low
        last_ping: new Date().toISOString()
      });
    };
    fetchSensorState();
  }, [sensorId]);

  if (!diagnostics) return null;

  const isTampered = diagnostics.status === 'TAMPER_LOCKOUT';

  return (
    <div className={`p-4 border ${isTampered ? 'bg-[#1e293b] border-[#8a3324]' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTampered ? 'bg-[#8a3324] animate-ping' : 'bg-emerald-500'}`}></div>
          <span className={`text-xs font-mono font-bold ${isTampered ? 'text-white' : 'text-slate-600'}`}>
            SENSOR NODE: {sensorId}
          </span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 border ${
          isTampered ? 'bg-[#8a3324] text-white border-red-500' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {diagnostics.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="block text-[10px] font-mono text-slate-500 mb-1">PM10 (CURRENT)</span>
          <span className={`text-xl font-mono font-bold ${isTampered ? 'text-red-400' : 'text-slate-800'}`}>
            {diagnostics.current_pm10.toFixed(1)} µg/m³
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-mono text-slate-500 mb-1">VOLATILITY (σ)</span>
          <span className={`text-xl font-mono font-bold ${diagnostics.volatility_stdev < 0.8 ? 'text-amber-500' : 'text-slate-800'}`}>
            ±{diagnostics.volatility_stdev.toFixed(3)}
          </span>
        </div>
      </div>

      {isTampered && (
        <div className="bg-[#8a3324]/20 border border-[#8a3324] p-3">
          <span className="block text-[10px] font-mono font-bold text-red-300 uppercase mb-1">
            ⚠️ Heuristic Anomaly Detected
          </span>
          <p className="text-xs text-red-200 font-mono leading-tight">
            Data volatility (σ={diagnostics.volatility_stdev}) is mathematically impossible for an outdoor construction environment. Sensor obstruction (e.g., plastic covering) confirmed.
          </p>
          <button className="mt-3 w-full py-1.5 bg-[#8a3324] text-white text-[10px] font-mono hover:bg-red-900 transition-colors">
            DISPATCH FIELD INSPECTOR
          </button>
        </div>
      )}
    </div>
  );
}
