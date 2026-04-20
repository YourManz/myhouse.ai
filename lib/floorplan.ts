import { v4 as uuidv4 } from 'uuid'
import type {
  FloorPlan, Floor, Room, WallSegment, PlacedElement,
  AIFloorPlanResponse, AIRoom, AIElement, Point, RoomType, ElementType,
  WallMaterial,
} from '@/types/floorplan'
import { ROOM_COLORS } from '@/types/floorplan'

const DEFAULT_SCALE = 8 // px per foot
const VERTEX_TOLERANCE = 4 // px — merge vertices within this distance

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function findOrAddVertex(pool: Point[], pt: Point): number {
  for (let i = 0; i < pool.length; i++) {
    if (dist(pool[i], pt) < VERTEX_TOLERANCE) return i
  }
  pool.push(pt)
  return pool.length - 1
}

// Returns the 4 corners of a room bounding box in px (top-left origin, clockwise)
function roomCorners(room: AIRoom, scale: number): Point[] {
  const x = room.x * scale
  const y = room.y * scale
  const w = room.width * scale
  const d = room.depth * scale
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + d },
    { x, y: y + d },
  ]
}

// Find the shared edge between two axis-aligned bounding boxes (in px)
function sharedEdge(a: AIRoom, b: AIRoom, scale: number): [Point, Point] | null {
  const ax1 = a.x * scale, ax2 = (a.x + a.width) * scale
  const ay1 = a.y * scale, ay2 = (a.y + a.depth) * scale
  const bx1 = b.x * scale, bx2 = (b.x + b.width) * scale
  const by1 = b.y * scale, by2 = (b.y + b.depth) * scale

  const tol = VERTEX_TOLERANCE

  // Shared vertical edge (east of a == west of b or vice versa)
  if (Math.abs(ax2 - bx1) < tol || Math.abs(bx2 - ax1) < tol) {
    const sharedX = Math.abs(ax2 - bx1) < tol ? ax2 : bx2
    const overlapY1 = Math.max(ay1, by1)
    const overlapY2 = Math.min(ay2, by2)
    if (overlapY2 - overlapY1 > tol) {
      return [{ x: sharedX, y: overlapY1 }, { x: sharedX, y: overlapY2 }]
    }
  }

  // Shared horizontal edge (south of a == north of b or vice versa)
  if (Math.abs(ay2 - by1) < tol || Math.abs(by2 - ay1) < tol) {
    const sharedY = Math.abs(ay2 - by1) < tol ? ay2 : by2
    const overlapX1 = Math.max(ax1, bx1)
    const overlapX2 = Math.min(ax2, bx2)
    if (overlapX2 - overlapX1 > tol) {
      return [{ x: overlapX1, y: sharedY }, { x: overlapX2, y: sharedY }]
    }
  }

  return null
}

// Determine if a wall is on the perimeter (exterior) of the combined footprint
function isExteriorWall(start: Point, end: Point, allRooms: AIRoom[], scale: number): boolean {
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return false
  const nx = -dy / len
  const ny = dx / len
  const eps = 2

  // Check both sides — if one side is outside all rooms, it's exterior
  const sideA = { x: mid.x + nx * eps, y: mid.y + ny * eps }
  const sideB = { x: mid.x - nx * eps, y: mid.y - ny * eps }

  const inAny = (pt: Point) => allRooms.some(r => {
    const rx1 = r.x * scale, rx2 = (r.x + r.width) * scale
    const ry1 = r.y * scale, ry2 = (r.y + r.depth) * scale
    return pt.x >= rx1 && pt.x <= rx2 && pt.y >= ry1 && pt.y <= ry2
  })

  return !inAny(sideA) || !inAny(sideB)
}

function placeElementOnWall(
  element: AIElement,
  room: AIRoom,
  walls: WallSegment[],
  vertices: Point[],
  scale: number
): Partial<PlacedElement> {
  const rx1 = room.x * scale, rx2 = (room.x + room.width) * scale
  const ry1 = room.y * scale, ry2 = (room.y + room.depth) * scale

  // Find the wall on the specified side of this room
  const targetWall = walls.find(w => {
    const sv = vertices[w.startVertex]
    const ev = vertices[w.endVertex]
    const tol = VERTEX_TOLERANCE * 2
    switch (element.wallSide) {
      case 'north': return Math.abs(sv.y - ry1) < tol && Math.abs(ev.y - ry1) < tol
      case 'south': return Math.abs(sv.y - ry2) < tol && Math.abs(ev.y - ry2) < tol
      case 'west':  return Math.abs(sv.x - rx1) < tol && Math.abs(ev.x - rx1) < tol
      case 'east':  return Math.abs(sv.x - rx2) < tol && Math.abs(ev.x - rx2) < tol
    }
  })

  if (targetWall) {
    return { wallId: targetWall.id, positionAlongWall: element.positionPercent / 100 }
  }

  // Fallback: place at room center
  return { x: (rx1 + rx2) / 2, y: (ry1 + ry2) / 2 }
}

export function aiResponseToFloorPlan(response: AIFloorPlanResponse): FloorPlan {
  const scale = DEFAULT_SCALE

  const floors: Floor[] = response.floors.map(aiFloor => {
    const vertices: Point[] = []
    const walls: WallSegment[] = []
    const rooms: Room[] = []
    const elements: PlacedElement[] = []
    const ceilingInches = Math.round(aiFloor.ceilingHeightFt * 12)

    // Build rooms with vertex indices
    const roomVertexMap = new Map<string, number[]>()

    for (const aiRoom of aiFloor.rooms) {
      const corners = roomCorners(aiRoom, scale)
      const indices = corners.map(c => findOrAddVertex(vertices, c))
      roomVertexMap.set(aiRoom.label, indices)

      rooms.push({
        id: uuidv4(),
        type: aiRoom.type,
        label: aiRoom.label,
        vertices: indices,
        fillColor: ROOM_COLORS[aiRoom.type] ?? '#f8fafc',
      })
    }

    // Build walls from adjacency hints + exterior perimeter
    const wallSet = new Set<string>()

    const addWall = (sv: Point, ev: Point, isExt: boolean) => {
      const key = `${Math.round(sv.x)},${Math.round(sv.y)}-${Math.round(ev.x)},${Math.round(ev.y)}`
      const keyRev = `${Math.round(ev.x)},${Math.round(ev.y)}-${Math.round(sv.x)},${Math.round(sv.y)}`
      if (wallSet.has(key) || wallSet.has(keyRev)) return
      wallSet.add(key)
      walls.push({
        id: uuidv4(),
        startVertex: findOrAddVertex(vertices, sv),
        endVertex: findOrAddVertex(vertices, ev),
        thickness: isExt ? 6 : 4,
        height: ceilingInches,
        material: isExt ? 'brick' as WallMaterial : 'drywall' as WallMaterial,
        isExterior: isExt,
      })
    }

    // Shared interior walls from adjacency
    for (const aiRoom of aiFloor.rooms) {
      if (!aiRoom.adjacentTo) continue
      for (const adjLabel of aiRoom.adjacentTo) {
        const adjRoom = aiFloor.rooms.find(r => r.label === adjLabel)
        if (!adjRoom) continue
        const edge = sharedEdge(aiRoom, adjRoom, scale)
        if (edge) addWall(edge[0], edge[1], false)
      }
    }

    // Exterior walls: all 4 sides of each room that aren't interior
    for (const aiRoom of aiFloor.rooms) {
      const corners = roomCorners(aiRoom, scale)
      for (let i = 0; i < 4; i++) {
        const sv = corners[i]
        const ev = corners[(i + 1) % 4]
        if (isExteriorWall(sv, ev, aiFloor.rooms, scale)) {
          addWall(sv, ev, true)
        }
      }
    }

    // Place elements
    for (const aiElem of aiFloor.elements) {
      const attachedRoom = aiFloor.rooms.find(r => r.label === aiElem.attachedToRoom)
      if (!attachedRoom) continue

      const wallPlacement = placeElementOnWall(aiElem, attachedRoom, walls, vertices, scale)

      elements.push({
        id: uuidv4(),
        elementType: aiElem.type as ElementType,
        rotation: 0,
        width: aiElem.widthInches,
        height: aiElem.widthInches,
        ...wallPlacement,
      })
    }

    return {
      id: uuidv4(),
      level: aiFloor.level,
      label: aiFloor.label,
      ceilingHeight: ceilingInches,
      vertices,
      walls,
      rooms,
      elements,
    }
  })

  return {
    version: '1.0',
    id: uuidv4(),
    title: response.title,
    description: response.description,
    prompt: response.description,
    style: response.style,
    lotWidth: response.lotWidth,
    lotDepth: response.lotDepth,
    northRotation: 0,
    scale,
    floors,
  }
}

// Compute room area in sq ft from vertex indices
export function computeRoomArea(room: Room, vertices: Point[], scale: number): number {
  const pts = room.vertices.map(i => vertices[i])
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  const areaPx = Math.abs(area) / 2
  return areaPx / (scale * scale) // convert px² → ft²
}

// Wall length in feet
export function wallLengthFt(wall: WallSegment, vertices: Point[], scale: number): number {
  const sv = vertices[wall.startVertex]
  const ev = vertices[wall.endVertex]
  return dist(sv, ev) / scale
}
