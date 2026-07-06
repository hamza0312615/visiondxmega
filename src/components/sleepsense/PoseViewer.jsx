import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function Avatar({ state }) {
  const groupRef = useRef();

  useFrame((stateParams) => {
    if (!groupRef.current) return;
    const t = stateParams.clock.getElapsedTime();

    if (state === "Deep Sleep" || state === "Calibrating...") {
      // Lying down horizontally
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.5, 0.1);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
      groupRef.current.rotation.x = 0;
    } 
    else if (state === "Restless") {
      // Lying down but tossing and turning
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0.5, 0.1);
      // Wiggle
      groupRef.current.rotation.x = Math.sin(t * 10) * 0.2;
      groupRef.current.position.x = Math.sin(t * 5) * 0.2;
    }
    else if (state === "Sleepwalking!") {
      // Standing up and pacing
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 1.5, 0.1);
      groupRef.current.position.x = Math.sin(t * 2) * 2;
      groupRef.current.rotation.x = 0;
    }
  });

  const color = state === "Sleepwalking!" ? "#ef4444" : "#0ea5e9"; // Red or Neon Blue

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {/* Head */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.9, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.35, 0.1, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
      <mesh position={[0.35, 0.1, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.12, -0.7, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
      <mesh position={[0.12, -0.7, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
    </group>
  );
}

export default function PoseViewer({ state }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-700 shadow-xl">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full animate-pulse ${state === 'Sleepwalking!' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
        3D Wireframe Tracking (Simulated)
      </div>
      <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />
        
        <Avatar state={state} />
        
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} />
        
        {/* Floor and Grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <gridHelper args={[20, 20, '#334155', '#1e293b']} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
