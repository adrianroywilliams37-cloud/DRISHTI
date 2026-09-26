import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Project } from '../../types';
import { ShieldAlert, CheckCircle, Activity, Satellite, Eye, Radar, Trees, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Risk Bands
const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.8);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

const HighRiskIcon = createMarkerIcon('#dc2626');   // red
const MediumRiskIcon = createMarkerIcon('#d97706'); // amber
const LowRiskIcon = createMarkerIcon('#10b981');    // emerald

interface GlobalOrbitalVerifierProps {
  projects: Project[];
}

export function GlobalOrbitalVerifier({ projects }: GlobalOrbitalVerifierProps) {
  const navigate = useNavigate();
  const [mapMode, setMapMode] = useState<'optical' | 'sar' | 'ndvi'>('optical');

  const indiaCenter: [number, number] = [21.1458, 79.0882]; // Center of India

  // Determine CSS filters based on mode to simulate satellite sensors
  const getMapFilterStyle = () => {
    switch (mapMode) {
      case 'sar':
        // Simulating Synthetic Aperture Radar: High contrast, grayscale, slight inversion for metallic/concrete reflection simulation
        return 'grayscale(100%) contrast(150%) invert(10%) sepia(10%) hue-rotate(180deg)';
      case 'ndvi':
        // Simulating NDVI: False color mapping highlighting vegetation vs barren land
        return 'hue-rotate(90deg) saturate(250%) contrast(120%) brightness(90%)';
      case 'optical':
      default:
        return 'none';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-900 border border-slate-700 rounded-sm overflow-hidden shadow-sm">
      
      {/* Header / Toolbar */}
      <div className="h-14 bg-[#1e2330] border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Satellite className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-serif font-bold text-white tracking-wide">National Orbital Verifier</h2>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-sm border border-emerald-500/30 ml-2">
            LIVE TELEMETRY ACTIVE
          </span>
        </div>
        
        {/* Imaging Modes Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setMapMode('optical')}
            className={`px-4 py-1.5 text-[11px] tracking-wider font-mono transition-colors flex items-center gap-2 rounded-sm ${
              mapMode === 'optical'
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-600/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Eye className="w-4 h-4" />
            OPTICAL
          </button>
          <button
            onClick={() => setMapMode('sar')}
            className={`px-4 py-1.5 text-[11px] tracking-wider font-mono transition-colors flex items-center gap-2 rounded-sm ${
              mapMode === 'sar'
                ? 'bg-blue-900/40 text-blue-400 border border-blue-600/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Radar className="w-4 h-4" />
            SAR
          </button>
          <button
            onClick={() => setMapMode('ndvi')}
            className={`px-4 py-1.5 text-[11px] tracking-wider font-mono transition-colors flex items-center gap-2 rounded-sm ${
              mapMode === 'ndvi'
                ? 'bg-amber-900/40 text-amber-400 border border-amber-600/50'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Trees className="w-4 h-4" />
            NDVI
          </button>
        </div>
      </div>

      {/* Main Content: Asymmetrical Split */}
      <div className="flex-1 flex overflow-hidden bg-black">
        
        {/* Map Area (70%) */}
        <div className="w-[70%] relative border-r border-slate-700">
          <div style={{ filter: getMapFilterStyle(), width: '100%', height: '100%', transition: 'filter 0.8s ease-in-out' }}>
            <MapContainer 
              center={indiaCenter} 
              zoom={5} 
              style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#000' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />

              {projects.map((p) => {
                if (p.latitude === undefined || p.longitude === undefined) return null;
                
                const icon = p.riskBand === 'High' ? HighRiskIcon :
                             p.riskBand === 'Medium' ? MediumRiskIcon : LowRiskIcon;

                return (
                  <Marker 
                    key={p.id} 
                    position={[p.latitude, p.longitude]}
                    icon={icon}
                  >
                    <Popup className="custom-popup" closeButton={false}>
                      <div className="p-0 min-w-[260px]">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                            {p.id}
                          </span>
                          {p.riskBand === 'High' && <ShieldAlert className="w-4 h-4 text-red-500" />}
                          {p.riskBand === 'Medium' && <Activity className="w-4 h-4 text-amber-500" />}
                          {p.riskBand === 'Low' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </div>
                        
                        <h3 className="font-serif font-bold text-slate-900 leading-snug mb-1 text-sm">{p.name}</h3>
                        <p className="text-[10px] text-slate-500 mb-3">{p.sector} | {p.state}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-sm border border-slate-100">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 block uppercase">Physical Prog.</span>
                            <span className="font-bold font-mono text-slate-800 text-xs">{p.physical_progress_pct.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 block uppercase">Overrun</span>
                            <span className={`font-bold font-mono text-xs ${p.costOverrunPct > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                              +{p.costOverrunPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => navigate(`/verify/${p.id}`)}
                          className="w-full bg-slate-900 text-white hover:bg-emerald-600 py-1.5 rounded-sm text-[10px] font-mono font-bold transition-colors"
                        >
                          OPEN DEEP ORBITAL INSPECTION
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Asset Deployment Grid Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] bg-black/80 border border-slate-700 p-3 backdrop-blur-md rounded-sm">
            <p className="text-[9px] font-mono text-emerald-400 mb-2 border-b border-slate-700 pb-1">ASSET STATUS</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
                <span className="text-[10px] font-mono text-slate-300">CRITICAL DELAY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                <span className="text-[10px] font-mono text-slate-300">MODERATE RISK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                <span className="text-[10px] font-mono text-slate-300">ON TRACK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Analytics Panel (30%) */}
        <div className="w-[30%] bg-[#1a1f2b] p-6 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <Info className="w-4 h-4" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">Layer Intelligence</h3>
          </div>

          {mapMode === 'optical' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h4 className="text-xl font-serif font-bold text-white mb-3">Optical Satellite Imaging</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Standard true-color orbital imagery for high-level physical verification. Used for broad tracking of major earthworks, completed structures, and visual confirmation of field reports.
              </p>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-sm">
                <p className="text-[10px] font-mono text-emerald-400 mb-1">PRIMARY USE CASES</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-mono mt-3">
                  <li>Visual alignment with DPR (Detailed Project Report) footprints</li>
                  <li>Monitoring large-scale concrete pouring</li>
                  <li>Confirming road network connectivity</li>
                </ul>
              </div>
            </div>
          )}

          {mapMode === 'sar' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h4 className="text-xl font-serif font-bold text-white mb-3">Synthetic Aperture Radar (SAR)</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Active microwave remote sensing that penetrates cloud cover and darkness. SAR backscatter detects sub-millimeter structural displacement, land subsidence, and material composition changes.
              </p>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-sm mb-4">
                <p className="text-[10px] font-mono text-blue-400 mb-1">DETECTION CAPABILITIES</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-mono mt-3">
                  <li>Concrete curing structural integrity</li>
                  <li>Bridge pier settlement (Interferometry)</li>
                  <li>Night-time construction activity</li>
                </ul>
              </div>
              <div className="p-3 border border-blue-900/50 bg-blue-900/10 rounded-sm">
                <p className="text-xs text-blue-300">
                  <strong>Notice:</strong> SAR imagery highlights metallic and highly dense structures (bridges, rail tracks) with extreme brightness due to double-bounce reflection.
                </p>
              </div>
            </div>
          )}

          {mapMode === 'ndvi' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h4 className="text-xl font-serif font-bold text-white mb-3">Normalized Difference Vegetation Index (NDVI)</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                False-color radiometric index measuring live green vegetation. Used by MoSPI to track environmental clearance compliance, illegal deforestation, and compensatory afforestation tracking.
              </p>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-sm mb-4">
                <p className="text-[10px] font-mono text-amber-400 mb-1">ENVIRONMENTAL AUDIT</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 font-mono mt-3">
                  <li>Measuring canopy loss around project boundaries</li>
                  <li>Verifying mandated green-belt zones</li>
                  <li>Water body siltation run-off tracking</li>
                </ul>
              </div>
              <div className="flex gap-2 items-center text-[10px] font-mono text-slate-400">
                <div className="w-full h-1.5 bg-gradient-to-r from-red-600 via-yellow-400 to-green-600 rounded-full"></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>BARREN/CLEARED (-1)</span>
                <span>DENSE FOREST (+1)</span>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-800">
            <h5 className="text-[10px] font-mono text-slate-500 mb-3">SYSTEM DIAGNOSTICS</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-slate-400 font-mono">LATENCY</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">14.2ms</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-mono">TILE SERVER</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">ARC-GIS</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
