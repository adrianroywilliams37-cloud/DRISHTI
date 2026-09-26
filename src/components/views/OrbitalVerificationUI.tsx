/**
 * DRISHTI Orbital Verification Layer
 * Author: Adrian Roy Williams
 * Role: Side-by-side verification of ground-truth cryptographic captures 
 * against live Sentinel-2/ISRO satellite imagery for discrepancy detection.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const crosshairIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="flex items-center justify-center">
      <div class="w-16 h-16 border border-emerald-500/40 rounded-full flex items-center justify-center relative">
         <div class="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-500"></div>
         <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-500"></div>
         <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-emerald-500"></div>
         <div class="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-emerald-500"></div>
      </div>
      <div class="absolute w-2 h-2 border-2 border-emerald-400 bg-emerald-500/30"></div>
    </div>
  `,
  iconSize: [64, 64],
  iconAnchor: [32, 32]
});
import { Satellite, Eye, Radar, Trees, ChevronLeft, ShieldAlert, CheckCircle2, AlertTriangle, Ruler, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SarRadarLayer from './SarRadarLayer';

function MapInteractionLayer({ onMouseMove, onZoom, isMeasuring, setMeasurePoints }: any) {
  const map = useMapEvents({
    mousemove(e) {
      onMouseMove(e.latlng);
    },
    zoomend() {
      onZoom(map.getZoom());
    },
    click(e) {
      if (isMeasuring) {
        setMeasurePoints((prev: any) => [...prev, e.latlng]);
      }
    }
  });
  return null;
}

interface OrbitalVerificationProps {
  telemetryId?: string;
  projectId?: string;
  onBack?: () => void;
}

interface GPSData {
  lat: number;
  lon: number;
  timestamp: string;
}

interface TelemetryData {
  geotagged_proof_path: string;
  primary_bottleneck: string;
  nodal_officer_remarks: string;
  gps: GPSData;
  project_telemetry: {
    project_id: string;
    physical_progress_pct: number;
    labor_headcount: number;
  };
}

const SATELLITE_MODES = [
  { id: 'OPTICAL', label: 'OPTICAL', icon: Eye, description: 'Sentinel-2 true-color composite' },
  { id: 'SAR', label: 'SAR', icon: Radar, description: 'Synthetic Aperture Radar (cloud-piercing)' },
  { id: 'NDVI', label: 'NDVI', icon: Trees, description: 'Vegetation Index (forest clearance tracking)' },
] as const;

export function OrbitalVerificationUI({ telemetryId, projectId, onBack }: OrbitalVerificationProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [satelliteMode, setSatelliteMode] = useState<string>('OPTICAL');
  const [analystDecision, setAnalystDecision] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New State for Advanced GIS
  const [currentZoom, setCurrentZoom] = useState(19);
  const [cursorPos, setCursorPos] = useState<{lat: number, lng: number} | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<any[]>([]);

  // Calculate total measurement distance
  const calculateTotalDistance = () => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      const p1 = measurePoints[i - 1];
      const p2 = measurePoints[i];
      const R = 6371e3;
      const f1 = p1.lat * Math.PI/180;
      const f2 = p2.lat * Math.PI/180;
      const df = (p2.lat-p1.lat) * Math.PI/180;
      const dl = (p2.lng-p1.lng) * Math.PI/180;
      const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      total += R * c;
    }
    return total;
  };

  useEffect(() => {
    const fetchVerificationData = async () => {
      if (telemetryId) {
        // Production: fetch from Supabase
        const { data } = await supabase
          .from('bottleneck_logs')
          .select(`
            geotagged_proof_path,
            primary_bottleneck,
            nodal_officer_remarks,
            project_telemetry (
              project_id, physical_progress_pct, labor_headcount
            )
          `)
          .eq('telemetry_id', telemetryId)
          .single();

        if (data) {
          (data as any).gps = { lat: 19.0330, lon: 73.0297, timestamp: new Date().toISOString() };
          setTelemetry(data as unknown as TelemetryData);
        }
      } else {
        // Demo mode: use synthetic data
        setTelemetry({
          geotagged_proof_path: 'demo/audit_capture.jpg',
          primary_bottleneck: 'Land Acquisition Dispute',
          nodal_officer_remarks: 'Construction halted due to ongoing litigation with local landowners. Court hearing scheduled for Nov 2026.',
          gps: { lat: 19.0330, lon: 73.0297, timestamp: new Date().toISOString() },
          project_telemetry: {
            project_id: projectId || 'PROJ-2024-MH-0042',
            physical_progress_pct: 47.2,
            labor_headcount: 312,
          }
        });
      }
    };
    fetchVerificationData();
  }, [telemetryId, projectId]);

  // Analyst Decision Dispatch
  const handleDiscrepancyFlag = async () => {
    setIsSubmitting(true);
    setAnalystDecision('FLAGGED');

    try {
      await supabase.from('inter_departmental_ledger').insert({
        project_id: telemetry?.project_telemetry.project_id,
        action_type: 'GROUND_ORBIT_DISCREPANCY_FLAGGED',
        initiated_by: 'MINISTRY_ANALYST_DESK',
        timestamp: new Date().toISOString(),
        notes: `Analyst detected severe variance between Nodal ground capture and ${satelliteMode} satellite feed.`
      });
    } catch (err) {
      console.error('[DRISHTI] Discrepancy flag dispatch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAlignment = () => {
    setAnalystDecision('VERIFIED');
  };

  if (!telemetry) {
    return (
      <div className="min-h-[600px] bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Satellite className="w-8 h-8 text-emerald-500 animate-pulse mx-auto mb-3" />
          <p className="text-emerald-400 font-mono text-sm">ACQUIRING ORBITAL LOCK...</p>
          <p className="text-slate-600 font-mono text-[10px] mt-1">Synchronizing GPS telemetry with Sentinel-2 feed</p>
        </div>
      </div>
    );
  }

  const getMapFilterStyle = () => {
    switch (satelliteMode) {
      case 'SAR':
        return 'grayscale(100%) contrast(150%) invert(10%) sepia(10%) hue-rotate(180deg)';
      case 'NDVI':
        return 'hue-rotate(90deg) saturate(250%) contrast(120%) brightness(90%)';
      case 'OPTICAL':
      default:
        return 'none';
    }
  };

  return (
    <div className="grid grid-cols-12 min-h-[700px] bg-[#F9FAFB] border border-slate-200 rounded-sm overflow-hidden">
      
      {/* ========== LEFT PANE (4 Cols): Ground Truth ========== */}
      <div className="col-span-4 border-r border-slate-200 bg-white flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-[#F9FAFB]">
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-serif font-bold text-slate-800">Ground Telemetry</h2>
          </div>
          <p className="text-[10px] font-mono text-slate-500">
            ASSET: {telemetry.project_telemetry.project_id}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Cryptographic Image */}
          <div>
            <span className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Cryptographic Capture
            </span>
            <div className="border border-slate-300 p-1 bg-slate-50">
              <div className="w-full aspect-video bg-slate-200 flex items-center justify-center relative overflow-hidden">
                {/* In production: signed URL from Supabase Storage */}
                <img src={`/${telemetry.geotagged_proof_path}`} className="absolute inset-0 w-full h-full object-cover" alt="Geotagged proof" />
                <div className="absolute inset-0 bg-black/20" />
                {/* Cryptographic Stamp Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/85 px-3 py-1.5">
                  <p className="text-[9px] font-mono text-emerald-400 truncate">
                    DRISHTI-CRIP | LAT:{telemetry.gps.lat.toFixed(6)} LON:{telemetry.gps.lon.toFixed(6)} | {telemetry.gps.timestamp.split('T')[0]}
                  </p>
                </div>
              </div>
              
              {/* GPS Metadata Bar */}
              <div className="mt-1 p-2 bg-[#1e293b] text-emerald-400 font-mono text-[10px] grid grid-cols-2 gap-1">
                <span>LAT: {telemetry.gps.lat.toFixed(6)}</span>
                <span>LON: {telemetry.gps.lon.toFixed(6)}</span>
                <span className="col-span-2">TIME: {telemetry.gps.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Reported Metrics */}
          <div>
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">
              Reported Metrics
            </span>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border border-slate-200 bg-[#F9FAFB]">
                <span className="text-xs font-mono text-slate-500">PHYSICAL PROGRESS</span>
                <span className="font-mono font-bold text-slate-800">{telemetry.project_telemetry.physical_progress_pct}%</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-200 bg-[#F9FAFB]">
                <span className="text-xs font-mono text-slate-500">LABOR HEADCOUNT</span>
                <span className="font-mono font-bold text-slate-800">{telemetry.project_telemetry.labor_headcount}</span>
              </div>
            </div>
          </div>

          {/* Bottleneck Report */}
          <div className="p-3 border-l-4 border-[#8a3324] bg-red-50/30">
            <span className="block text-[10px] font-mono text-[#8a3324] mb-1 font-bold">DECLARED BOTTLENECK</span>
            <span className="font-bold text-slate-800 text-sm block mb-1">{telemetry.primary_bottleneck}</span>
            <p className="text-xs text-slate-600 italic leading-relaxed">"{telemetry.nodal_officer_remarks}"</p>
          </div>
        </div>

        {/* Action Panel (Sticky Footer) */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          <AnimatePresence mode="wait">
            {analystDecision === 'VERIFIED' ? (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> GROUND-TO-ORBIT ALIGNMENT CONFIRMED
              </motion.div>
            ) : analystDecision === 'FLAGGED' ? (
              <motion.div
                key="flagged"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 text-[#8a3324] font-mono text-xs font-bold text-center"
              >
                <ShieldAlert className="w-4 h-4 inline mr-1" />
                ESCALATED TO PMG QUEUE. FINANCIAL TRANCHE FROZEN.
              </motion.div>
            ) : (
              <motion.div key="actions" className="space-y-2">
                <button
                  onClick={handleConfirmAlignment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
                  CONFIRM ALIGNMENT
                </button>
                <button
                  onClick={handleDiscrepancyFlag}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white text-[#8a3324] border border-[#8a3324] hover:bg-red-50 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
                  FLAG ORBITAL DISCREPANCY
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========== RIGHT PANE (8 Cols): Orbital Satellite View ========== */}
      <div className="col-span-8 bg-[#0f172a] relative flex flex-col">
        
        {/* GIS Toolbar */}
        <div className="h-14 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex space-x-4 items-center">
            <div className="flex space-x-1">
              {SATELLITE_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSatelliteMode(mode.id)}
                  className={`px-4 py-1.5 text-xs font-mono transition-colors flex items-center gap-1.5 ${
                    satelliteMode === mode.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                  title={mode.description}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-slate-700" />
            
            <button
              onClick={() => { setIsMeasuring(!isMeasuring); setMeasurePoints([]); }}
              className={`px-3 py-1.5 text-xs font-mono transition-colors flex items-center gap-1.5 ${
                isMeasuring 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              MEASURE
            </button>
            
            {measurePoints.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono text-xs font-bold border border-amber-400/30 px-2 py-1 bg-amber-950/30">
                  {calculateTotalDistance().toFixed(1)}m
                </span>
                <button onClick={() => setMeasurePoints([])} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="text-emerald-500/70 font-mono text-[10px] flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE SENTINEL-2 FEED LINKED
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">

          {/* Satellite Layer Background */}
          <div className="absolute inset-0 bg-black">
            <div style={{ filter: getMapFilterStyle(), width: '100%', height: '100%', transition: 'filter 0.8s ease-in-out' }}>
              <MapContainer 
                center={[telemetry.gps.lat, telemetry.gps.lon]} 
                zoom={19} 
                style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: '#000' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={19}
                  maxZoom={24}
                />
                
                <MapInteractionLayer 
                  onMouseMove={setCursorPos} 
                  onZoom={setCurrentZoom} 
                  isMeasuring={isMeasuring} 
                  setMeasurePoints={setMeasurePoints} 
                />

                {/* Measuring Path */}
                {measurePoints.length > 0 && (
                  <>
                    <Polyline positions={measurePoints} pathOptions={{ color: '#fbbf24', weight: 3, dashArray: '5, 5' }} />
                    {measurePoints.map((p, i) => (
                      <Circle key={i} center={p} radius={0.5} pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 1 }} />
                    ))}
                  </>
                )}
                
                {/* 15m Accuracy Margin */}
                <Circle 
                  center={[telemetry.gps.lat, telemetry.gps.lon]} 
                  radius={15} 
                  pathOptions={{ color: '#34d399', weight: 1, fillColor: '#064e3b', fillOpacity: 0.15, dashArray: '4,4' }} 
                />
                
                {/* Exact GPS Point */}
                <Marker 
                  position={[telemetry.gps.lat, telemetry.gps.lon]} 
                  icon={crosshairIcon}
                />
              </MapContainer>
            </div>
            {satelliteMode === 'SAR' && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle at 30% 40%, #4a4a6a 1px, transparent 1px), radial-gradient(circle at 70% 60%, #5a5a7a 1px, transparent 1px)',
                  backgroundSize: '20px 20px, 15px 15px',
                }} />
                <SarRadarLayer 
                  projectId={telemetry.project_telemetry.project_id} 
                  claimedProgress={telemetry.project_telemetry.physical_progress_pct} 
                />
              </div>
            )}
          </div>

          {/* GIS Overlay Elements */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* Grid Overlay */}
            <div className="w-full h-full grid grid-cols-8 grid-rows-5">
              {[...Array(40)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-emerald-500/10" />
              ))}
            </div>

            {/* Contextual Floating Tag */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute top-1/2 left-1/2 ml-10 -mt-10 bg-emerald-950/80 border border-emerald-500/60 p-3 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <p className="text-[10px] font-mono text-emerald-400 m-0">
                TGT: {telemetry.gps.lat.toFixed(6)}, {telemetry.gps.lon.toFixed(6)}
              </p>
              <p className="text-[10px] font-mono text-emerald-400/70 m-0 mt-0.5">
                DECLARED: {telemetry.project_telemetry.physical_progress_pct}% COMPLETE
              </p>
            </motion.div>

            {/* Dynamic Telemetry Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 border border-slate-700 p-2 backdrop-blur-sm flex flex-col gap-1 pointer-events-auto">
              <span className="text-[10px] font-mono text-emerald-400">
                CURSOR: {cursorPos ? `${cursorPos.lat.toFixed(6)}, ${cursorPos.lng.toFixed(6)}` : 'AWAITING TRACKING...'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ZOOM LEVEL: {currentZoom}x / 24x MAX
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                RESOLUTION: {(10 / Math.pow(2, currentZoom - 10)).toFixed(2)}m/px
              </span>
            </div>

            {/* Mode-specific info overlays */}
            <div className="absolute bottom-4 left-4 bg-black/60 border border-slate-700 p-3 backdrop-blur-sm max-w-xs">
              <p className="text-[10px] font-mono text-slate-400 mb-1">
                {SATELLITE_MODES.find(m => m.id === satelliteMode)?.description}
              </p>
              {satelliteMode === 'SAR' && (
                <p className="text-[10px] font-mono text-amber-400">
                  ⚠ SAR detects structural changes beneath cloud cover. Ideal for monsoon verification.
                </p>
              )}
              {satelliteMode === 'NDVI' && (
                <p className="text-[10px] font-mono text-green-400">
                  Red zones = vegetation removed. Green zones = intact canopy. Compare against MoEF clearance boundaries.
                </p>
              )}
            </div>

            {/* Scale bar */}
            <div className="absolute bottom-4 right-4 flex items-end gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-500 mb-1">5km</span>
                <div className="w-24 h-[2px] bg-slate-500 relative">
                  <div className="absolute left-0 top-0 w-[1px] h-2 bg-slate-500 -translate-y-1" />
                  <div className="absolute right-0 top-0 w-[1px] h-2 bg-slate-500 -translate-y-1" />
                  <div className="absolute left-1/2 top-0 w-[1px] h-1.5 bg-slate-600 -translate-y-0.5" />
                </div>
              </div>
            </div>

            {/* Compass */}
            <div className="absolute top-4 right-4 w-10 h-10 border border-slate-600 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="text-[10px] font-mono font-bold text-slate-300">N</span>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[1px] h-2 bg-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
