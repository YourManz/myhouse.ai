export type Point = { x: number; y: number }

export type WallMaterial = 'drywall' | 'concrete' | 'brick' | 'glass' | 'wood'

export type RoomType =
  | 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining'
  | 'office' | 'garage' | 'hallway' | 'laundry' | 'utility'
  | 'closet' | 'stairwell' | 'basement' | 'attic' | 'custom'

export type ElementType =
  | 'door-single' | 'door-double' | 'door-sliding'
  | 'window-standard' | 'window-bay' | 'window-skylight'
  | 'stair-straight' | 'stair-l' | 'stair-spiral'
  | 'fireplace' | 'bathtub' | 'shower' | 'toilet'
  | 'sink' | 'kitchen-island' | 'kitchen-counter'

export type ToolMode = 'select' | 'room' | 'wall' | 'door' | 'window' | 'pan'

export type ViewMode = '2d' | '3d' | 'split'

export interface WallSegment {
  id: string
  startVertex: number
  endVertex: number
  thickness: number        // inches (6=exterior, 4=interior)
  height: number           // inches
  material: WallMaterial
  isExterior: boolean
}

export interface Room {
  id: string
  type: RoomType
  label: string
  vertices: number[]       // ordered indices into Floor.vertices
  fillColor: string
  area?: number            // computed sq ft
}

export interface PlacedElement {
  id: string
  elementType: ElementType
  wallId?: string
  positionAlongWall?: number   // 0..1
  x?: number
  y?: number
  rotation: number
  width: number            // inches
  height: number
}

export interface Floor {
  id: string
  level: number            // -1=basement, 0=ground, 1+=upper
  label: string
  ceilingHeight: number    // inches (default 108 = 9ft)
  vertices: Point[]        // shared vertex pool
  walls: WallSegment[]
  rooms: Room[]
  elements: PlacedElement[]
}

export type RoofType = 'flat' | 'gable' | 'hip' | 'shed' | 'butterfly' | 'mansard' | 'gambrel' | 'sawtooth'

export type CutoutType =
  | 'dormer' | 'courtyard-void' | 'double-height-void' | 'arch-opening'
  | 'skylight-shaft' | 'cantilever-void' | 'bay-window-void'

export type CeilingType = 'standard' | 'vaulted' | 'coffered' | 'exposed-beams' | 'double-height'

export type FeatureType =
  | 'wraparound-porch' | 'balcony' | 'clerestory' | 'chimney'
  | 'canopy' | 'pergola' | 'sunken-living'

export interface CutoutGeometry {
  x: number
  y: number
  width: number
  depth: number
  heightStart: number
  heightEnd: number
  shape: 'rect' | 'arch' | 'triangle'
}

export interface ThreeDCutout {
  id: string
  type: CutoutType
  targetFloor: number
  targetWallId?: string
  geometry: CutoutGeometry
  enabled: boolean
  rationale: string
}

export interface CeilingOverride {
  roomId: string
  type: CeilingType
  height: number
  peakHeight?: number
  enabled: boolean
}

export interface ArchitecturalFeature {
  id: string
  type: FeatureType
  location: string
  geometry: { x: number; y: number; width: number; depth: number; height: number }
  enabled: boolean
  rationale: string
}

export interface SubRoof {
  footprintRoomIds: string[]
  type: RoofType
  pitch: number
}

export interface ThreeDSpec {
  roof: {
    type: RoofType
    pitch: number
    overhang: number
    ridgeDirection?: 'ns' | 'ew'
    subRoofs?: SubRoof[]
  }
  cutouts: ThreeDCutout[]
  ceilingOverrides: CeilingOverride[]
  features: ArchitecturalFeature[]
  rationale: string
}

export type SurfaceTarget =
  | 'exterior-wall' | 'interior-wall' | 'floor' | 'ceiling' | 'roof'
  | 'kitchen-backsplash' | 'bathroom-tile' | 'trim' | 'door' | 'window-frame'

export type TextureCategory = 'wood' | 'stone' | 'tile' | 'concrete' | 'brick' | 'metal' | 'fabric' | 'paint'

export interface PBRTexture {
  id: string
  label: string
  category: TextureCategory
  color: string            // fallback hex color when textures aren't loaded
  repeat: [number, number]
}

export interface MaterialSurface {
  target: SurfaceTarget
  roomTypes?: RoomType[]
  texture: PBRTexture
  rationale: string
  enabled: boolean
}

export interface MaterialPalette {
  surfaces: MaterialSurface[]
}

export interface FloorPlan {
  version: '1.0'
  id: string
  title: string
  description?: string
  prompt?: string
  style?: string
  lotWidth: number         // feet
  lotDepth: number
  northRotation: number
  scale: number            // px/ft (default 8)
  floors: Floor[]
  threeDSpec?: ThreeDSpec
  materialPalette?: MaterialPalette
}

// What Claude returns for Call 1 — converted by lib/floorplan.ts
export interface AIRoom {
  type: RoomType
  label: string
  x: number
  y: number
  width: number
  depth: number
  adjacentTo?: string[]
}

export interface AIElement {
  type: ElementType
  attachedToRoom: string
  wallSide: 'north' | 'south' | 'east' | 'west'
  positionPercent: number
  widthInches: number
}

export interface AIFloor {
  level: number
  label: string
  ceilingHeightFt: number
  rooms: AIRoom[]
  elements: AIElement[]
}

export interface AIFloorPlanResponse {
  title: string
  description: string
  style: string
  lotWidth: number
  lotDepth: number
  floors: AIFloor[]
}

// Room fill colors by type
export const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: '#dbeafe',
  bathroom: '#e0f2fe',
  kitchen: '#fef9c3',
  living: '#f0fdf4',
  dining: '#fefce8',
  office: '#faf5ff',
  garage: '#f1f5f9',
  hallway: '#f8fafc',
  laundry: '#ecfdf5',
  utility: '#f1f5f9',
  closet: '#fafafa',
  stairwell: '#fef3c7',
  basement: '#e2e8f0',
  attic: '#fef9c3',
  custom: '#f8fafc',
}
