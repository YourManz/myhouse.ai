import * as THREE from 'three'
import type { FloorPlan, Floor, Room, WallSegment, MaterialPalette } from '@/types/floorplan'

// ------------------------------------------------------------------
// Coordinate helpers — FloorPlan uses px (Y-down); Three.js uses ft (Y-up)
// ------------------------------------------------------------------

export function getBuildingCenter(floorPlan: FloorPlan): { cx: number; cz: number } {
  const floor = floorPlan.floors[0]
  if (!floor?.vertices.length) return { cx: 0, cz: 0 }
  const s = floorPlan.scale
  const xs = floor.vertices.map(v => v.x / s)
  const zs = floor.vertices.map(v => v.y / s)
  return {
    cx: (Math.min(...xs) + Math.max(...xs)) / 2,
    cz: (Math.min(...zs) + Math.max(...zs)) / 2,
  }
}

// ------------------------------------------------------------------
// Color helpers
// ------------------------------------------------------------------

const SURFACE_DEFAULTS: Record<string, string> = {
  'exterior-wall': '#c4b9a8',
  'interior-wall': '#e8e4df',
  'floor':         '#c49a6c',
  'ceiling':       '#f5f0e8',
  'roof':          '#4a3d35',
  'window-frame':  '#4a4a4a',
  'door':          '#6b5a47',
  'trim':          '#f5f0e8',
}

export function surfaceColor(target: string, palette?: MaterialPalette | null): string {
  if (palette) {
    const s = palette.surfaces.find(x => x.target === target && x.enabled)
    if (s?.texture?.color) return s.texture.color
  }
  return SURFACE_DEFAULTS[target] ?? '#808080'
}

// ------------------------------------------------------------------
// Wall geometry
// ------------------------------------------------------------------

export interface WallGeo {
  geometry: THREE.BoxGeometry
  position: THREE.Vector3
  rotationY: number
  isExterior: boolean
}

export function buildWalls(floor: Floor, scale: number, cx: number, cz: number): WallGeo[] {
  const result: WallGeo[] = []
  for (const wall of floor.walls) {
    const sv = floor.vertices[wall.startVertex]
    const ev = floor.vertices[wall.endVertex]
    if (!sv || !ev) continue

    const sx = sv.x / scale - cx,  sz = sv.y / scale - cz
    const ex = ev.x / scale - cx,  ez = ev.y / scale - cz

    const length = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2)
    if (length < 0.05) continue

    const h = wall.height / 12        // inches → ft
    const t = wall.thickness / 12

    result.push({
      geometry: new THREE.BoxGeometry(length, h, t),
      position: new THREE.Vector3((sx + ex) / 2, h / 2, (sz + ez) / 2),
      rotationY: -Math.atan2(ez - sz, ex - sx),
      isExterior: wall.isExterior,
    })
  }
  return result
}

// ------------------------------------------------------------------
// Floor slab geometry (one ShapeGeometry per room)
// ------------------------------------------------------------------

export interface FloorGeo {
  geometry: THREE.BufferGeometry
}

export function buildFloorSlabs(floor: Floor, scale: number, cx: number, cz: number): FloorGeo[] {
  const result: FloorGeo[] = []
  for (const room of floor.rooms) {
    const pts = room.vertices.map(i => floor.vertices[i]).filter(Boolean)
    if (pts.length < 3) continue

    const shape = new THREE.Shape()
    shape.moveTo(pts[0].x / scale - cx, -(pts[0].y / scale - cz))
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x / scale - cx, -(pts[i].y / scale - cz))
    }
    shape.closePath()

    // ShapeGeometry is in XY plane; rotate to XZ plane (floor)
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    result.push({ geometry: geo })
  }
  return result
}

// ------------------------------------------------------------------
// Roof geometry — gable, hip, flat, shed
// ------------------------------------------------------------------

function floorBounds(floor: Floor, scale: number, cx: number, cz: number, overhang: number) {
  const xs = floor.vertices.map(v => v.x / scale - cx)
  const zs = floor.vertices.map(v => v.y / scale - cz)
  return {
    minX: Math.min(...xs) - overhang,
    maxX: Math.max(...xs) + overhang,
    minZ: Math.min(...zs) - overhang,
    maxZ: Math.max(...zs) + overhang,
  }
}

function maxWallHeight(floor: Floor): number {
  if (!floor.walls.length) return floor.ceilingHeight / 12
  return Math.max(...floor.walls.map(w => w.height / 12))
}

export function buildRoof(floorPlan: FloorPlan, cx: number, cz: number): THREE.BufferGeometry | null {
  const floor = floorPlan.floors.find(f => f.level === 0) ?? floorPlan.floors[0]
  if (!floor?.vertices.length) return null

  const spec     = floorPlan.threeDSpec
  const roofType = spec?.roof.type ?? 'gable'
  const pitch    = spec?.roof.pitch ?? 6
  const overhang = spec?.roof.overhang ?? 1.5
  const scale    = floorPlan.scale

  const { minX, maxX, minZ, maxZ } = floorBounds(floor, scale, cx, cz, overhang)
  const wallH   = maxWallHeight(floor)
  const spanX   = maxX - minX
  const spanZ   = maxZ - minZ

  if (roofType === 'flat') {
    const geo = new THREE.BoxGeometry(spanX, 0.4, spanZ)
    geo.translate((minX + maxX) / 2, wallH + 0.2, (minZ + maxZ) / 2)
    return geo
  }

  if (roofType === 'shed') {
    const rise = (pitch / 12) * spanZ
    return triangulated([
      minX, wallH, minZ,
      maxX, wallH, minZ,
      maxX, wallH + rise, maxZ,
      minX, wallH + rise, maxZ,
    ], [[0, 1, 2], [0, 2, 3]])
  }

  if (roofType === 'hip') {
    return buildHipRoof(minX, maxX, minZ, maxZ, wallH, pitch)
  }

  // gable / butterfly / mansard / gambrel — all fall back to gable
  return buildGableRoof(minX, maxX, minZ, maxZ, wallH, pitch)
}

function buildGableRoof(
  minX: number, maxX: number, minZ: number, maxZ: number,
  wallH: number, pitch: number,
): THREE.BufferGeometry {
  const spanX = maxX - minX
  const spanZ = maxZ - minZ
  const ridgeAlongX = spanX >= spanZ
  const midX = (minX + maxX) / 2
  const midZ = (minZ + maxZ) / 2

  if (ridgeAlongX) {
    const rise = (pitch / 12) * (spanZ / 2)
    const peak = wallH + rise
    return triangulated([
      minX, wallH, minZ,  // 0
      maxX, wallH, minZ,  // 1
      maxX, wallH, maxZ,  // 2
      minX, wallH, maxZ,  // 3
      minX, peak,  midZ,  // 4
      maxX, peak,  midZ,  // 5
    ], [
      [0,1,5], [0,5,4],   // front slope
      [3,4,5], [3,5,2],   // back slope
      [0,4,3],            // left gable
      [1,2,5],            // right gable
    ])
  } else {
    const rise = (pitch / 12) * (spanX / 2)
    const peak = wallH + rise
    return triangulated([
      minX, wallH, minZ,  // 0
      maxX, wallH, minZ,  // 1
      maxX, wallH, maxZ,  // 2
      minX, wallH, maxZ,  // 3
      midX, peak,  minZ,  // 4
      midX, peak,  maxZ,  // 5
    ], [
      [0,4,5], [0,5,3],   // left slope
      [1,2,5], [1,5,4],   // right slope
      [0,1,4],            // front gable
      [3,5,2],            // back gable
    ])
  }
}

function buildHipRoof(
  minX: number, maxX: number, minZ: number, maxZ: number,
  wallH: number, pitch: number,
): THREE.BufferGeometry {
  const spanX = maxX - minX
  const spanZ = maxZ - minZ
  const halfMin = Math.min(spanX, spanZ) / 2
  const rise = (pitch / 12) * halfMin
  const peak = wallH + rise

  if (spanX >= spanZ) {
    const rz = (minZ + maxZ) / 2
    const rx1 = minX + halfMin
    const rx2 = maxX - halfMin
    return triangulated([
      minX, wallH, minZ,  // 0
      maxX, wallH, minZ,  // 1
      maxX, wallH, maxZ,  // 2
      minX, wallH, maxZ,  // 3
      rx1,  peak,  rz,    // 4
      rx2,  peak,  rz,    // 5
    ], [
      [0,1,5], [0,5,4],   // front slope
      [3,4,5], [3,5,2],   // back slope
      [0,4,3],            // left hip
      [1,2,5],            // right hip
    ])
  } else {
    const rx = (minX + maxX) / 2
    const rz1 = minZ + halfMin
    const rz2 = maxZ - halfMin
    return triangulated([
      minX, wallH, minZ,  // 0
      maxX, wallH, minZ,  // 1
      maxX, wallH, maxZ,  // 2
      minX, wallH, maxZ,  // 3
      rx,   peak,  rz1,   // 4
      rx,   peak,  rz2,   // 5
    ], [
      [0,4,5], [0,5,3],   // left slope
      [1,2,5], [1,5,4],   // right slope
      [0,1,4],            // front hip
      [3,5,2],            // back hip
    ])
  }
}

function triangulated(verts: number[], faces: number[][]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setIndex(faces.flat())
  geo.computeVertexNormals()
  return geo
}
