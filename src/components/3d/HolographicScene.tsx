import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { ProjectModel } from './ProjectModel';
import { Project } from '../../types';

interface HolographicSceneProps {
  project: Project;
}

function SceneContents({ project }: HolographicSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slowly revolve the entire model group
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 5, 30]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#0f766e" />

      {/* Holographic Grid Base */}
      <Grid 
        renderOrder={-1}
        position={[0, -1, 0]} 
        infiniteGrid 
        fadeDistance={20} 
        fadeStrength={5} 
        cellSize={1} 
        sectionSize={5} 
        cellColor="#1e293b" 
        sectionColor="#334155" 
      />

      <group ref={groupRef}>
        <ProjectModel 
          sector={project.sector} 
          render_status={project.isolation_forest_payload?.visualization_input?.structural_variance_map?.[0]?.render_status}
        />
      </group>

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={20} 
        maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
      />
      <Environment preset="city" />
    </>
  );
}

export function HolographicScene({ project }: HolographicSceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto z-0">
      <Canvas camera={{ position: [5, 4, 8], fov: 45 }}>
        <SceneContents project={project} />
      </Canvas>
    </div>
  );
}
