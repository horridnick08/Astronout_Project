import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { X, Maximize2, Minimize2, Share2, Layers, Cpu, Radio, Sparkles } from 'lucide-react';
import {
  protocolInterpreterManager,
  ProtocolInterpreterState,
  JsonLdPayload,
} from '../../engine/ProtocolInterpreterManager.ts';

interface GraphNodeData {
  id: string;
  label: string;
  key: string;
  value: string;
  type: string;
  position: [number, number, number];
  color: string;
  size: number;
  shape: 'sphere' | 'box' | 'octahedron' | 'icosahedron';
}

/**
 * 3D Node Mesh Component with Floating Hover Tag
 */
function GraphNode({
  node,
  isCore = false,
  isHovered,
  onHover,
}: {
  node: GraphNodeData;
  isCore?: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isCore ? 0.35 : 0.6);
      meshRef.current.rotation.x += delta * (isCore ? 0.15 : 0.4);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.5;
      ringRef.current.rotation.x += delta * 0.25;
    }
  });

  return (
    <group position={node.position}>
      {/* Node Geometry */}
      <mesh
        ref={meshRef}
        scale={isHovered ? 1.35 : 1.0}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        {node.shape === 'box' ? (
          <boxGeometry args={[node.size, node.size, node.size]} />
        ) : node.shape === 'octahedron' ? (
          <octahedronGeometry args={[node.size * 0.85]} />
        ) : node.shape === 'icosahedron' ? (
          <icosahedronGeometry args={[node.size * 0.85]} />
        ) : (
          <sphereGeometry args={[node.size, 24, 24]} />
        )}
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isHovered ? 1.8 : isCore ? 1.2 : 0.75}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Orbiting Wireframe Rings for Core & Hovered Nodes */}
      {(isCore || isHovered) && (
        <mesh ref={ringRef}>
          <torusGeometry args={[node.size * 1.55, 0.025, 12, 36]} />
          <meshBasicMaterial
            color={node.color}
            wireframe
            transparent
            opacity={isHovered ? 0.85 : 0.5}
          />
        </mesh>
      )}

      {/* Billboard Node Title Label */}
      <Html position={[0, -node.size * 1.45, 0]} center distanceFactor={12}>
        <div
          style={{
            fontSize: isCore ? '10px' : '8.5px',
            backgroundColor: 'rgba(2, 6, 23, 0.88)',
            borderColor: isHovered ? node.color : 'rgba(0, 240, 255, 0.35)',
            color: isHovered ? '#ffffff' : node.color,
            boxShadow: isHovered
              ? `0 0 12px ${node.color}`
              : '0 0 8px rgba(0, 240, 255, 0.2)',
          }}
          className="px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none select-none transition-all duration-200"
        >
          {node.label}
        </div>
      </Html>

      {/* Interactive Hologram Hover Card (Rendered when this node is hovered) */}
      {isHovered && (
        <Html position={[0, node.size * 2.2, 0]} center distanceFactor={10}>
          <div
            style={{
              width: '260px',
              backgroundColor: 'rgba(2, 12, 22, 0.94)',
              borderColor: node.color,
              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.9), 0 0 20px ${node.color}55`,
            }}
            className="p-2.5 rounded-xl border backdrop-blur-xl font-mono select-none pointer-events-none text-left flex flex-col gap-1.5 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
              <span
                style={{ color: node.color }}
                className="text-[9.5px] font-bold tracking-wider uppercase truncate"
              >
                [NODE: {node.key}]
              </span>
              <span className="text-[7.5px] font-bold px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                {node.type}
              </span>
            </div>

            {/* Live Attribute Value */}
            <div className="flex flex-col bg-slate-950/70 p-1.5 rounded border border-cyan-500/15">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest">
                JSON-LD VALUE
              </span>
              <span className="text-[10px] text-cyan-200 font-bold break-all leading-tight mt-0.5">
                {node.value}
              </span>
            </div>

            {/* Linkage Metadata Footer */}
            <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300 font-semibold">BUS INJECTION OK</span>
              </span>
              <span className="text-cyan-400 font-bold">120 FPS // 0.12ms</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Animated Laser Connector Line & Flowing Photon Data Particles
 */
function ConnectorLine({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const progress = useRef(Math.random());

  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((_, delta) => {
    // Animate data stream particle along connector line vector
    progress.current = (progress.current + delta * 0.75) % 1.0;
    if (particleRef.current) {
      particleRef.current.position.lerpVectors(
        points[0],
        points[1],
        progress.current
      );
    }
  });

  return (
    <group>
      {/* 3D Glowing Laser Vector Line */}
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          linewidth={1.5}
        />
      </line>

      {/* Pulsing Flowing Data Particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/**
 * 3D Runtime Node Graph Scene
 */
function ProtocolGraphScene({
  payload,
  hoveredNodeId,
  onHoverNode,
}: {
  payload: JsonLdPayload;
  hoveredNodeId: string | null;
  onHoverNode: (id: string | null) => void;
}) {
  // Construct 3D Graph Nodes from JSON-LD Schema
  const { coreNode, branchNodes } = useMemo(() => {
    const core: GraphNodeData = {
      id: 'core',
      label: '[SPACECRAFT_CORE]',
      key: 'SPACECRAFT_CORE',
      value: 'CENTRAL_RUNTIME_ORCHESTRATOR',
      type: 'CoreEngine',
      position: [0, 0, 0],
      color: '#00f0ff',
      size: 0.7,
      shape: 'sphere',
    };

    const branches: GraphNodeData[] = [
      {
        id: 'node-context',
        label: '@context',
        key: '@context',
        value: payload.contextUri,
        type: 'URI / Vocabulary',
        position: [-3.2, 1.4, 0.8],
        color: '#00ff99',
        size: 0.45,
        shape: 'octahedron',
      },
      {
        id: 'node-type',
        label: `@type: ${payload.type}`,
        key: '@type',
        value: payload.type,
        type: 'SchemaType',
        position: [3.0, 1.6, -0.6],
        color: '#00e5ff',
        size: 0.48,
        shape: 'icosahedron',
      },
      {
        id: 'node-script',
        label: `payload: ${payload.payloadScript}`,
        key: 'payloadScript',
        value: payload.payloadScript,
        type: 'ExecutableModule',
        position: [2.2, -2.0, 1.5],
        color: '#ffaa00',
        size: 0.42,
        shape: 'box',
      },
      {
        id: 'node-hook',
        label: `hook: ${payload.telemetryHook}`,
        key: 'telemetry_hook',
        value: payload.telemetryHook,
        type: 'TelemetryBus',
        position: [-2.4, -1.8, -1.4],
        color: '#38bdf8',
        size: 0.42,
        shape: 'octahedron',
      },
    ];

    // Attribute Nodes
    const attrPositions: [number, number, number][] = [
      [0.0, 3.2, 1.6],
      [-1.8, 0.6, -3.2],
      [2.8, -0.4, 2.8],
      [-1.2, -3.0, 0.6],
    ];

    const attrColors = ['#00ff99', '#00e5ff', '#a78bfa', '#34d399'];
    const attrShapes: ('sphere' | 'box' | 'octahedron' | 'icosahedron')[] = [
      'sphere',
      'icosahedron',
      'octahedron',
      'box',
    ];

    payload.attributes.forEach((attr, idx) => {
      const pos = attrPositions[idx % attrPositions.length];
      branches.push({
        id: `node-attr-${attr.key}`,
        label: `${attr.key}`,
        key: attr.key,
        value: String(attr.value),
        type: attr.type,
        position: pos,
        color: attrColors[idx % attrColors.length],
        size: 0.38,
        shape: attrShapes[idx % attrShapes.length],
      });
    });

    return { coreNode: core, branchNodes: branches };
  }, [payload]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#00f0ff" distance={10} />
      <pointLight position={[5, 8, 5]} intensity={1.2} color="#00ff99" />
      <pointLight position={[-5, -8, -5]} intensity={1.0} color="#00e5ff" />

      {/* OrbitControls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={25}
        minDistance={3}
        autoRotate={false}
      />

      {/* Background Cyber Dust / Floating Grid Particles */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Central Core Node */}
        <GraphNode
          node={coreNode}
          isCore
          isHovered={hoveredNodeId === coreNode.id}
          onHover={onHoverNode}
        />

        {/* Dynamic Branch Nodes & Connector Lines */}
        {branchNodes.map((node) => (
          <React.Fragment key={node.id}>
            <ConnectorLine
              start={coreNode.position}
              end={node.position}
              color={node.color}
            />
            <GraphNode
              node={node}
              isHovered={hoveredNodeId === node.id}
              onHover={onHoverNode}
            />
          </React.Fragment>
        ))}
      </Float>
    </>
  );
}

/**
 * ProtocolGraphCanvas
 *
 * Fullscreen Interactive 3D WebGL Simulation Viewport for JSON-LD Node Graph:
 * - OrbitControls for user exploration (Rotate, Pan, Zoom).
 * - Interactive Hologram Hover Cards.
 * - Top-Right [✖ CLOSE GRAPH] / [⛶ FULLSCREEN GRAPH VIEW] toggle overlay.
 */
export default function ProtocolGraphCanvas() {
  const [managerState, setManagerState] = useState<ProtocolInterpreterState>(() =>
    protocolInterpreterManager.getState()
  );
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(true);

  React.useEffect(() => {
    return protocolInterpreterManager.subscribe((state) => {
      setManagerState(state);
    });
  }, []);

  if (!managerState.isGraphActive) {
    return null;
  }

  const { activePayload, hoveredNodeId } = managerState;

  return (
    <div
      id="protocol-graph-viewport-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 45,
        backgroundColor: '#020617',
        animation: 'fadeIn 0.25s ease-out',
      }}
      className="w-screen h-screen relative select-none font-mono overflow-hidden"
    >
      {/* ─── 1. INTERACTIVE THREE.JS / R3F 3D CANVAS ────────────────── */}
      <Canvas
        camera={{ position: [0, 2.5, 9.5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => protocolInterpreterManager.setHoveredNode(null)}
      >
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 12, 30]} />
        <ProtocolGraphScene
          payload={activePayload}
          hoveredNodeId={hoveredNodeId}
          onHoverNode={(id) => protocolInterpreterManager.setHoveredNode(id)}
        />
      </Canvas>

      {/* ─── 2. TOP HUD STATUS BAR & CONTROLS OVERLAY ───────────────── */}
      <header
        style={{
          top: '1rem',
          left: '1rem',
          right: '1rem',
        }}
        className="fixed flex items-center justify-between pointer-events-none z-50 font-mono"
      >
        {/* Left Side: Graph Metadata Header */}
        <div
          style={{
            backgroundColor: 'rgba(2, 10, 20, 0.90)',
            borderColor: 'rgba(0, 240, 255, 0.4)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 240, 255, 0.2)',
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-md pointer-events-auto shadow-xl"
        >
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 shrink-0">
            <Share2 className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white tracking-wider uppercase truncate">
                PROTOCOL INTERPRETER // 3D RUNTIME GRAPH
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-[9px] text-[#00e5ff] font-medium mt-0.5">
              <span className="text-[#00ff99] font-bold">{activePayload.filename}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">SCHEMA: JSON-LD 1.1</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">9 NODES // 8 LASER EDGES</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action & Close Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Fullscreen Toggle Button */}
          <button
            id="btn-toggle-fullscreen-graph"
            onClick={() => setIsFullscreenMode((v) => !v)}
            title="Toggle Viewport Mode"
            style={{
              backgroundColor: 'rgba(2, 10, 20, 0.90)',
              borderColor: 'rgba(0, 240, 255, 0.4)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
              fontSize: '10px',
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-cyan-300 hover:text-white hover:border-[#00f0ff] hover:bg-cyan-950/80 transition-all font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
          >
            {isFullscreenMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>[⛶ FULLSCREEN GRAPH VIEW]</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>[⛶ WINDOWED VIEW]</span>
              </>
            )}
          </button>

          {/* Close Graph Action Button */}
          <button
            id="btn-close-protocol-graph"
            onClick={() => protocolInterpreterManager.setGraphActive(false)}
            title="Close 3D Graph and Return to Mission Control"
            style={{
              backgroundColor: 'rgba(20, 5, 12, 0.92)',
              borderColor: 'rgba(255, 0, 85, 0.55)',
              boxShadow: '0 4px 16px rgba(255, 0, 85, 0.25)',
              fontSize: '10.5px',
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-red-400 hover:text-white hover:border-red-400 hover:bg-red-950/80 transition-all font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
          >
            <X className="w-4 h-4 text-red-400" />
            <span>[✖ CLOSE GRAPH]</span>
          </button>
        </div>
      </header>

      {/* ─── 3. BOTTOM PAYLOAD SWITCHER & NAVIGATION BAR ────────────── */}
      <footer
        style={{
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '92vw',
        }}
        className="fixed flex flex-col items-center gap-2 pointer-events-none z-50 font-mono"
      >
        {/* Quick Payload Switcher Tabs */}
        <div
          style={{
            backgroundColor: 'rgba(2, 10, 20, 0.92)',
            borderColor: 'rgba(0, 240, 255, 0.35)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 240, 255, 0.15)',
          }}
          className="flex items-center gap-1.5 p-1.5 rounded-xl border backdrop-blur-md pointer-events-auto shadow-2xl overflow-x-auto max-w-full"
        >
          {managerState.payloads.map((payload) => {
            const isSelected = payload.id === activePayload.id;
            return (
              <button
                key={payload.id}
                onClick={() => protocolInterpreterManager.selectPayload(payload.id)}
                style={{
                  fontSize: '9.5px',
                  backgroundColor: isSelected
                    ? 'rgba(0, 240, 255, 0.2)'
                    : 'transparent',
                  borderColor: isSelected
                    ? 'rgba(0, 240, 255, 0.6)'
                    : 'transparent',
                  color: isSelected ? '#00f0ff' : '#94a3b8',
                }}
                className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected ? 'shadow-sm text-white' : 'hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>{payload.filename}</span>
              </button>
            );
          })}
        </div>

        {/* OrbitControls Mouse Interaction Hint */}
        <div
          style={{
            fontSize: '8.5px',
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            borderColor: 'rgba(0, 240, 255, 0.25)',
          }}
          className="px-3 py-1 rounded-full border text-slate-400 tracking-wider uppercase font-semibold backdrop-blur-sm pointer-events-auto"
        >
          [LEFT DRAG: ROTATE | RIGHT DRAG: PAN | SCROLL: ZOOM | HOVER NODE: INSPECT JSON-LD]
        </div>
      </footer>
    </div>
  );
}
