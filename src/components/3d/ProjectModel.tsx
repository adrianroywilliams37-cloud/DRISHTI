import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Plane, Line } from '@react-three/drei';
import * as THREE from 'three';

interface ProjectModelProps {
  sector: string;
  render_status?: "Green" | "Amber" | "BlinkingRed" | string;
}

// Generate point cloud data based on sector geometry
function generatePointCloud(sector: string): Float32Array {
  const points: number[] = [];
  const count = 3000;
  const lowerSector = sector.toLowerCase();

  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (lowerSector.includes('rail') || lowerSector.includes('road') || lowerSector.includes('highway')) {
      // Long linear structure
      x = (Math.random() - 0.5) * 4;
      y = Math.random() * 0.5;
      z = (Math.random() - 0.5) * 15;
    } else if (lowerSector.includes('power') || lowerSector.includes('petroleum') || lowerSector.includes('coal')) {
      // Cylindrical / Industrial clusters
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3;
      x = Math.cos(angle) * radius;
      y = Math.random() * 4;
      z = Math.sin(angle) * radius;
    } else {
      // Building / Urban (Vertical Blocks)
      x = (Math.random() - 0.5) * 4;
      y = Math.random() * 8;
      z = (Math.random() - 0.5) * 4;
    }
    points.push(x, y, z);
  }

  return new Float32Array(points);
}

// Animated Point Cloud Component
function LiDARPointCloud({ sector, render_status }: ProjectModelProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => generatePointCloud(sector), [sector]);

  let activeColor = '#0ea5e9'; // Default Blue
  if (render_status === 'BlinkingRed') activeColor = '#ef4444'; // Red
  if (render_status === 'Amber') activeColor = '#f59e0b'; // Amber
  if (render_status === 'Green') activeColor = '#10b981'; // Green

  useFrame((state) => {
    if (pointsRef.current) {
      // Gentle floating animation
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // If critical, pulse the points
      if (render_status === 'BlinkingRed' && pointsRef.current.material) {
        (pointsRef.current.material as THREE.PointsMaterial).size = 0.05 + Math.sin(state.clock.elapsedTime * 8) * 0.02;
      }
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={activeColor}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </Points>
  );
}

// Animated Scanner Beam
function ScannerBeam({ render_status }: { render_status?: string }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const scanLineRef = useRef<THREE.Line>(null);

  let activeColor = '#38bdf8';
  if (render_status === 'BlinkingRed') activeColor = '#f87171';
  if (render_status === 'Amber') activeColor = '#fbbf24';
  if (render_status === 'Green') activeColor = '#34d399';

  useFrame((state) => {
    if (beamRef.current) {
      // Move the beam up and down
      beamRef.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 1.5) * 4;
    }
    if (scanLineRef.current) {
       scanLineRef.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 1.5) * 4;
    }
  });

  return (
    <group>
      <Plane ref={beamRef} args={[8, 8]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color={activeColor} 
          transparent={true} 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </Plane>
      {/* <Line ref={scanLineRef} points={[[-4, 0, -4], [4, 0, -4], [4, 0, 4], [-4, 0, 4], [-4, 0, -4]]} color={activeColor} lineWidth={2} /> */}
    </group>
  );
}

// Wireframe Skeleton to add structure to the point cloud
function WireframeSkeleton({ sector, render_status }: ProjectModelProps) {
    let activeColor = '#0284c7';
    if (render_status === 'BlinkingRed') activeColor = '#991b1b';
    if (render_status === 'Amber') activeColor = '#b45309';
    if (render_status === 'Green') activeColor = '#047857';

    const lowerSector = sector.toLowerCase();
    
    return (
        <group>
            {/* Draw a bounding wireframe box based on sector */}
            {(lowerSector.includes('rail') || lowerSector.includes('road')) && (
               <mesh position={[0, 0.25, 0]}>
                   <boxGeometry args={[4, 0.5, 15]} />
                   <meshBasicMaterial color={activeColor} wireframe={true} transparent opacity={0.3} />
               </mesh>
            )}
            {(lowerSector.includes('power') || lowerSector.includes('petroleum')) && (
               <mesh position={[0, 2, 0]}>
                   <cylinderGeometry args={[3, 3, 4, 16]} />
                   <meshBasicMaterial color={activeColor} wireframe={true} transparent opacity={0.3} />
               </mesh>
            )}
            {(!lowerSector.includes('rail') && !lowerSector.includes('road') && !lowerSector.includes('power') && !lowerSector.includes('petroleum')) && (
               <mesh position={[0, 4, 0]}>
                   <boxGeometry args={[4, 8, 4]} />
                   <meshBasicMaterial color={activeColor} wireframe={true} transparent opacity={0.3} />
               </mesh>
            )}
        </group>
    );
}

export function ProjectModel({ sector, render_status }: ProjectModelProps) {
  return (
    <group>
      <LiDARPointCloud sector={sector} render_status={render_status} />
      <WireframeSkeleton sector={sector} render_status={render_status} />
      <ScannerBeam render_status={render_status} />
    </group>
  );
}
