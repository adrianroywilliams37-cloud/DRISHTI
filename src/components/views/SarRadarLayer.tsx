/**
 * DRISHTI SAR Coherence Change Detection Overlay
 * Author: Adrian Roy Williams
 * Role: Renders the microwave radar heatmap over the digital twin to visualize 
 * physical construction through dense monsoon cloud cover.
 */

import { useState, useEffect } from 'react';

interface SarRadarLayerProps {
  projectId: string;
  claimedProgress: number;
}

export default function SarRadarLayer({ projectId, claimedProgress }: SarRadarLayerProps) {
  const [radarData, setRadarData] = useState<{coherence_gamma: number, intensity: number, conclusion: string} | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Simulate fetching the computed Coherence Gamma from our Python backend
    setTimeout(() => {
      setRadarData({
        coherence_gamma: 0.92, // High coherence = no change (bad, if they claimed progress)
        intensity: 0.08,
        conclusion: 'FRAUD_DETECTED'
      });
      setIsScanning(false);
    }, 2000);
  }, [projectId]);

  if (isScanning) {
    return (
      <div className="absolute inset-0 bg-[#0f172a]/90 flex flex-col items-center justify-center backdrop-blur-sm z-20">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <span className="text-xs font-mono text-emerald-400 tracking-widest">
          CONFIGURING C-BAND MICROWAVE PULSE...
        </span>
      </div>
    );
  }

  const isFraud = radarData?.conclusion === 'FRAUD_DETECTED';

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      
      {/* 
        The Radar Heatmap Overlay 
        Uses the mahogany aesthetic to highlight the severe lack of expected structural change.
      */}
      <div className="absolute inset-0 opacity-60 mix-blend-color-dodge bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black"></div>

      {/* Floating Diagnostics Panel */}
      <div className="absolute bottom-8 right-8 bg-[#1e293b] border border-slate-600 p-5 shadow-2xl pointer-events-auto max-w-xs">
        <h3 className="text-xs font-mono text-slate-400 border-b border-slate-700 pb-2 mb-3 uppercase tracking-wider">
          Sentinel-1 SAR CCD Analysis
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="block text-[10px] font-mono text-slate-500 mb-1">COHERENCE (γ)</span>
            <span className={`text-xl font-mono font-bold ${isFraud ? 'text-[#8a3324]' : 'text-emerald-400'}`}>
              {radarData?.coherence_gamma.toFixed(3)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-500 mb-1">CLAIMED PROGRESS</span>
            <span className="text-xl font-mono font-bold text-slate-300">
              {claimedProgress}%
            </span>
          </div>
        </div>

        {isFraud ? (
          <div className="bg-[#8a3324]/20 border border-[#8a3324] p-3 animate-fade-in">
            <span className="block text-[10px] font-mono font-bold text-red-400 uppercase mb-1">
              ⚠️ ORBITAL VERIFICATION FAILED
            </span>
            <p className="text-xs text-red-200 font-mono leading-tight">
              SAR phase coherence indicates zero structural disturbance. Claimed progress is mathematically invalid.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-900/30 border border-emerald-500 p-3">
            <span className="block text-[10px] font-mono font-bold text-emerald-400 uppercase">
              DECORRELATION VERIFIED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
