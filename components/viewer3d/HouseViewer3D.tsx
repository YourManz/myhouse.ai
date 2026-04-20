'use client'
import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls, Environment, Grid,
  GizmoHelper, GizmoViewport,
} from '@react-three/drei'
import { Suspense, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useEditorStore } from '@/store/useEditorStore'
import {
  buildWalls, buildFloorSlabs, buildRoof,
  getBuildingCenter, surfaceColor,
} from '@/lib/geometry3d'
import { setScene } from '@/lib/sceneStore'
import type { FloorPlan } from '@/types/floorplan'

// ─── Scene content (only renders when floorPlan is present) ────────

function HouseScene({ floorPlan }: { floorPlan: FloorPlan }) {
  const { scene } = useThree()

  useEffect(() => {
    setScene(scene)
    return () => setScene(null)
  }, [scene])

  const { cx, cz } = useMemo(() => getBuildingCenter(floorPlan), [floorPlan])

  const groundFloor = floorPlan.floors.find(f => f.level === 0) ?? floorPlan.floors[0]
  const palette = floorPlan.materialPalette ?? null

  const walls = useMemo(
    () => groundFloor ? buildWalls(groundFloor, floorPlan.scale, cx, cz) : [],
    [groundFloor, floorPlan.scale, cx, cz],
  )

  const slabs = useMemo(
    () => groundFloor ? buildFloorSlabs(groundFloor, floorPlan.scale, cx, cz) : [],
    [groundFloor, floorPlan.scale, cx, cz],
  )

  const roofGeo = useMemo(
    () => buildRoof(floorPlan, cx, cz),
    [floorPlan, cx, cz],
  )

  const extColor = surfaceColor('exterior-wall', palette)
  const intColor = surfaceColor('interior-wall', palette)
  const floorCol = surfaceColor('floor', palette)
  const roofCol  = surfaceColor('roof', palette)

  return (
    <>
      {/* Floor slabs */}
      {slabs.map((fd, i) => (
        <mesh key={`slab-${i}`} geometry={fd.geometry} position={[0, 0, 0]} receiveShadow>
          <meshStandardMaterial color={floorCol} roughness={0.8} metalness={0} />
        </mesh>
      ))}

      {/* Walls */}
      {walls.map((wd, i) => (
        <mesh
          key={`wall-${i}`}
          geometry={wd.geometry}
          position={wd.position}
          rotation-y={wd.rotationY}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={wd.isExterior ? extColor : intColor}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Roof */}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial color={roofCol} roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  )
}

// ─── Placeholder when no floor plan ────────────────────────────────

function Placeholder() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[4, 1, 4]} />
      <meshStandardMaterial color="#1e293b" roughness={1} />
    </mesh>
  )
}

// ─── Main exported component ────────────────────────────────────────

export function HouseViewer3D() {
  const { floorPlan } = useEditorStore()

  return (
    <Canvas
      shadows
      camera={{ position: [35, 28, 35], fov: 45 }}
      style={{ width: '100%', height: '100%', background: '#060d19' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <directionalLight position={[-15, 20, -15]} intensity={0.4} />

      {/* HDRI environment */}
      <Suspense fallback={null}>
        <Environment preset="city" background={false} />
      </Suspense>

      {/* Scene geometry */}
      <Suspense fallback={<Placeholder />}>
        {floorPlan ? <HouseScene floorPlan={floorPlan} /> : <Placeholder />}
      </Suspense>

      {/* Ground grid */}
      <Grid
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#1a2535"
        sectionSize={5}
        sectionThickness={0.6}
        sectionColor="#1e3a5f"
        fadeDistance={100}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid
      />

      {/* Controls */}
      <OrbitControls
        makeDefault
        minDistance={4}
        maxDistance={250}
        maxPolarAngle={Math.PI / 2.02}
        target={[0, 3, 0]}
      />

      {/* Orientation gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={['#f43f5e', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </Canvas>
  )
}
