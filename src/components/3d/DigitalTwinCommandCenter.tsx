/**
 * DRISHTI 3D Digital Twin Command Center
 * Author: Adrian Roy Williams
 * Role: Renders an interactive 3D spatial model of the infrastructure asset using procedural generation.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Points, PointMaterial } from '@react-three/drei';
import { supabase } from '../../lib/supabase';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Crosshair, Activity } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface ComponentDef {
  id: string;
  type: string;
  geometry: string; // 'box', 'cylinder', 'sphere', 'cone', 'torus'
  position: [number, number, number];
  rotation?: [number, number, number];
  label: string;
  phase: string;
  status: string;
  dimensions: [number, number, number];
  material?: string;
}

interface PylonDef {
  position: [number, number, number];
  height: number;
}

interface StructureDef {
  id: string;
  position: [number, number, number];
  dimensions: [number, number, number];
  type: string;
}

interface TopologyPayload {
  project_id: string;
  sector: string;
  architecture: string;
  metrics: Record<string, number>;
  components: ComponentDef[];
  telemetry: {
    flagged_component: string | null;
    ai_confidence: number;
    last_scan_utc: string;
  }
}

interface TelemetryPayload {
  ai_risk_score?: string;
  flagged_component?: string | null;
}

interface DigitalTwinProps {
  projectId?: string;
  projectName?: string;
  completionPct?: number;
}

// ─────────────────────────────────────────────────────────────
// AESTHETICS (Neon Tactical)
// ─────────────────────────────────────────────────────────────
const COLOR_NEON_GREEN = '#10b981';
const COLOR_NEON_RED = '#ef4444';
const COLOR_WIREFRAME = '#334155';
const COLOR_SOLID = '#0f172a';

// ─────────────────────────────────────────────────────────────
// 3D: Atmospheric Particle Field
// ─────────────────────────────────────────────────────────────
function AtmosphericParticles() {
  const positions = useMemo(() => {
    const pts = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 50;
      pts[i * 3 + 1] = Math.random() * 20 - 2;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pts;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#334155"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </Points>
  );
}

// ─────────────────────────────────────────────────────────────
// 3D: Tactical Mesh Wrapper
// ─────────────────────────────────────────────────────────────
function TacticalMesh({
  component,
  isCritical,
  isSelected,
  onSelect,
  children
}: {
  component: ComponentDef | StructureDef;
  isCritical: boolean;
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current && isCritical) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={meshRef}
      position={component.position}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {children}
      
      {isCritical && (
        <Html position={[0, component.dimensions[1]/2 + 1, 0]} center distanceFactor={15}>
          <div className="bg-[#0f172a]/95 border border-red-500 text-red-400 px-2 py-1 font-mono text-[9px] animate-pulse whitespace-nowrap pointer-events-none select-none">
            [!] CRIT: {component.id}
          </div>
        </Html>
      )}
      {isSelected && !isCritical && (
        <Html position={[0, component.dimensions[1]/2 + 1, 0]} center distanceFactor={15}>
          <div className="bg-[#0f172a]/95 border border-emerald-500 text-emerald-400 px-2 py-1 font-mono text-[9px] whitespace-nowrap pointer-events-none select-none">
            LOC: {component.id}
          </div>
        </Html>
      )}
    </group>
  );
}

const getMaterialProps = (materialStr: string | undefined, isCritical: boolean, isSelected: boolean, isPending: boolean) => {
  if (isCritical) {
    return {
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.5,
      wireframe: false,
      transparent: false,
      opacity: 1
    };
  }

  if (isSelected) {
    return {
      color: '#10b981',
      emissive: '#10b981',
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.3,
      wireframe: false,
      transparent: false,
      opacity: 1
    };
  }

  if (isPending) {
    return {
      color: '#334155',
      wireframe: true,
      transparent: true,
      opacity: 0.6
    };
  }

  switch(materialStr?.toLowerCase()) {
    case 'concrete':
      return { color: '#8c8c8c', roughness: 0.9, metalness: 0.1 };
    case 'steel':
      return { color: '#94a3b8', roughness: 0.3, metalness: 0.8 };
    case 'asphalt':
      return { color: '#1f2937', roughness: 0.9, metalness: 0.0 };
    case 'glass':
      return { color: '#38bdf8', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.4 };
    case 'warning':
      return { color: '#eab308', roughness: 0.6, metalness: 0.1 };
    default:
      return { color: '#475569', roughness: 0.5, metalness: 0.5 };
  }
};

const getMaterial = (materialStr: string | undefined, isCritical: boolean, isSelected: boolean, isPending: boolean = false) => {
  return <meshStandardMaterial {...getMaterialProps(materialStr, isCritical, isSelected, isPending)} />;
};

// ─────────────────────────────────────────────────────────────
// 3D: Polymorphic Assemblies
// ─────────────────────────────────────────────────────────────
function UniversalAIAssembly({ topology, telemetry, selected, setSelected }: any) {
  return (
    <group>
      {topology?.components?.map((c: ComponentDef) => {
        const isCrit = telemetry?.flagged_component === c.id || topology?.telemetry?.flagged_component === c.id;
        const isSel = selected?.id === c.id;
        
        // Parse geometry dynamically
        const geom = c.geometry?.toLowerCase() || 'box';
        const rot = c.rotation ? new THREE.Euler(...c.rotation) : new THREE.Euler(0, 0, 0);

        let GeometryComponent;
        const dims = c.dimensions || [1, 1, 1];
        const d0 = dims[0] ?? 1;
        const d1 = dims[1] ?? 1;
        const d2 = dims[2] ?? 1;
        
        switch(geom) {
          case 'cylinder':
            GeometryComponent = <cylinderGeometry args={[d0, d0, d1, 16]} />;
            break;
          case 'sphere':
            GeometryComponent = <sphereGeometry args={[d0, 16, 16]} />;
            break;
          case 'cone':
            GeometryComponent = <coneGeometry args={[d0, d1, 16]} />;
            break;
          case 'torus':
            GeometryComponent = <torusGeometry args={[d0, d1, 16, 32]} />;
            break;
          case 'box':
          default:
            GeometryComponent = <boxGeometry args={[d0, d1, d2]} />;
            break;
        }

        return (
          <TacticalMesh key={c.id || Math.random().toString()} component={{...c, dimensions: [d0, d1, d2]}} isCritical={isCrit} isSelected={isSel} onSelect={() => setSelected(isSel ? null : c)}>
             <mesh position={[0, 0, 0]} rotation={rot}>
               {GeometryComponent}
               {getMaterial(c.material, isCrit, isSel, c.status === 'pending')}
             </mesh>
          </TacticalMesh>
        );
      })}
    </group>
  );
}

function AssetFactory({ topology, telemetry, selectedSector, setSelectedSector }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const buildTime = useRef(0);

  useFrame((state, delta) => {
    if (buildTime.current < 1) {
      buildTime.current = Math.min(1, buildTime.current + delta * 0.8);
    }
    if (groupRef.current) {
      groupRef.current.scale.set(1, buildTime.current, 1);
      groupRef.current.position.y = (buildTime.current - 1) * -5;
    }
  });

  if (!topology) return null;

  const props = { topology, telemetry, selected: selectedSector, setSelected: setSelectedSector };

  return (
    <group ref={groupRef}>
      <UniversalAIAssembly {...props} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// 3D: Scanning beam (LiDAR sweep effect)
// ─────────────────────────────────────────────────────────────
function ScanBeam() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 3 + Math.sin(state.clock.elapsedTime * 0.8) * 5;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 12]} />
      <meshBasicMaterial
        color="#10b981"
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export function DigitalTwinCommandCenter({ projectId = 'PROJ-2024-MH-0042', projectName, completionPct = 50.0 }: DigitalTwinProps) {
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [topology, setTopology] = useState<TopologyPayload | null>(null);
  const [selectedSector, setSelectedSector] = useState<ComponentDef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 0. Fetch Autonomous Spatial Topology from AI Engine
    const fetchTopology = async () => {
      try {
        setLoading(true);
        // Find sector via seed data lookup on client or rely on backend fallback.
        // The backend `get_spatial_twin` now expects a `sector` query param.
        // We will default to 'Roads' if we don't have it explicitly passed, but ideally
        // we extract it from seedProjects.
        
        // As a quick fix, if we know project IDs contain sector hints or we just pass "Roads" 
        // to let the backend fallback if we don't know it here.
        // Actually, the API now has /api/v1/spatial-twin/{project_id}?sector=X
        // Let's deduce sector from project ID if possible, else "Roads".
        let sector = "Roads";
        if (projectId.includes("RL")) sector = "Railways";
        if (projectId.includes("PWR")) sector = "Power";
        if (projectId.includes("WTR")) sector = "Water";
        if (projectId.includes("URB")) sector = "Urban Infra";

        const res = await fetch(`http://localhost:8000/api/v1/spatial-twin/${projectId}?sector=${sector}&completion_pct=${completionPct}`);
        if (res.ok) {
          const topo = await res.json();
          setTopology(topo);
        }
      } catch (e) {
        console.error("AI Spatial Constructor Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTopology();

    // 1. Fetch live telemetry
    const fetchSpatialData = async () => {
      const { data } = await supabase
        .from('project_risk_assessments')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (data) {
        setTelemetry({
          ...data,
          flagged_component: data.ai_risk_score === 'Critical' ? topology?.components[0]?.id : null,
        });
      }
    };

    fetchSpatialData();

    // 2. Real-time subscription
    const spatialSub = supabase
      .channel('spatial-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'project_risk_assessments' },
        (payload: any) => {
          setTelemetry({
            ...payload.new,
            flagged_component: payload.new.ai_risk_score === 'Critical' ? topology?.components[0]?.id : null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(spatialSub);
    };
  }, [projectId]);

  return (
    <div className="relative w-full h-[650px] bg-[#0f172a] border border-slate-700 rounded-none overflow-hidden">
      {/* ═══ 2D HUD OVERLAYS ═══ */}

      {/* Top-left: Title block */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <Box className="w-4 h-4 text-emerald-500" />
          <h2 className="text-lg font-serif font-bold text-white uppercase">Polymorphic Spatial Twin</h2>
        </div>
        <p className="text-[10px] font-mono text-slate-500 ml-6 uppercase">
          ASSET: {projectId} | SECTOR: {topology?.sector || '...'}
        </p>
        {projectName && (
          <p className="text-[10px] font-mono text-slate-400 ml-6 mt-0.5 uppercase">{projectName}</p>
        )}
      </div>

      {/* Top-right: Telemetry summary */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-[#0f172a]/95 border border-slate-700 p-3 font-mono text-[10px] min-w-[220px]">
          <div className="flex items-center gap-1.5 mb-2 text-slate-400 border-b border-slate-700 pb-2">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>AI SPATIAL CONSTRUCTOR</span>
          </div>
          {loading ? (
            <div className="space-y-2 mt-2">
              <div className="h-1 bg-slate-800 w-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }} animate={{ x: "100%" }} 
                  transition={{ repeat: Infinity, duration: 1 }} 
                  className="h-full bg-emerald-500 w-1/2" 
                />
              </div>
              <span className="text-slate-500 animate-pulse block text-center">GENERATING TOPOLOGY...</span>
            </div>
          ) : topology ? (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">SECTOR</span>
                <span className="text-cyan-400 font-bold uppercase">{topology.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ARCH TYPE</span>
                <span className="text-slate-300 uppercase">{topology.architecture}</span>
              </div>
              
              {Object.entries(topology.metrics || {}).map(([key, val]) => (
                 <div key={key} className="flex justify-between">
                   <span className="text-slate-500 uppercase">{key.replace('_', ' ')}</span>
                   <span className="text-slate-300">{val as React.ReactNode}</span>
                 </div>
              ))}

              <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
                <span className="text-slate-500">AI CONFIDENCE</span>
                <span className="text-emerald-400">{topology.telemetry.ai_confidence * 100}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RISK</span>
                <span className={
                  telemetry?.ai_risk_score === 'Critical' ? 'text-red-400 font-bold' :
                  telemetry?.ai_risk_score === 'High' ? 'text-amber-400' :
                  'text-emerald-400'
                }>
                  {telemetry?.ai_risk_score || 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-600">FAILED TO CONNECT</span>
          )}
        </div>
      </div>

      {/* Bottom-left: Sector legend */}
      <div className="absolute bottom-4 left-5 z-10 pointer-events-none">
        <div className="flex flex-col gap-2 text-[9px] font-mono text-slate-500 bg-[#0f172a]/95 border border-slate-700 p-2">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 inline-block" /> CRITICAL BOTTLENECK
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 inline-block" /> SELECTED COMPONENT
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 border border-slate-500 inline-block" /> WIREFRAME (PENDING)
          </span>
        </div>
      </div>

      {/* Right panel: Selected sector detail card */}
      <AnimatePresence>
        {selectedSector && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-4 right-4 z-10 bg-[#0f172a]/95 border border-emerald-900/50 p-4 w-64 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
              <h3 className="text-[10px] font-mono text-emerald-400">
                COMPONENT LOCK: {selectedSector.id}
              </h3>
              <Crosshair className="w-3 h-3 text-emerald-500" />
            </div>
            <p className="text-xs text-white font-bold mb-0.5 uppercase">{selectedSector.label}</p>
            <p className="text-[10px] text-slate-500 mb-3 uppercase">{selectedSector.phase}</p>

            <div className="text-[10px] font-mono text-slate-400 space-y-1 border-t border-slate-800 pt-2">
              <div className="flex justify-between">
                <span>V_BURN_YIELD</span>
                <span className={telemetry?.flagged_component === selectedSector.id ? 'text-red-400' : 'text-emerald-400'}>
                  {telemetry?.flagged_component === selectedSector.id ? '2.41 (CRIT)' : '0.82 (NOM)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>STATUS</span>
                <span className={telemetry?.flagged_component === selectedSector.id ? 'text-red-400' : 'text-slate-300'}>
                  {telemetry?.flagged_component === selectedSector.id ? 'PMG QUEUE' : selectedSector.status.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              className="mt-4 w-full py-2 border border-slate-700 text-slate-300 text-[9px] font-mono hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              onClick={() => setSelectedSector(null)}
            >
              RELEASE LOCK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ THE 3D CANVAS ═══ */}
      <Canvas
        camera={{ position: [0, 15, 20], fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={['#05080f']} />
        <fog attach="fog" args={['#05080f', 15, 60]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.0} />

        {/* The Factory Component */}
        <AssetFactory
          telemetry={telemetry}
          topology={topology}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
        />

        {/* Atmosphere */}
        <AtmosphericParticles />
        <ScanBeam />

        {/* Ground grid */}
        <gridHelper args={[80, 80, '#1e293b', '#0f172a']} position={[0, -2, 0]} />

        <OrbitControls
          enablePan
          enableZoom
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={45}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
