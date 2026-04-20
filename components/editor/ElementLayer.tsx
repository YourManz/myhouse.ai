'use client'
import { Layer, Group, Arc, Line, Rect } from 'react-konva'
import type { Floor, PlacedElement } from '@/types/floorplan'

interface ElementLayerProps {
  floor: Floor
}

function DoorShape({ elem, floor }: { elem: PlacedElement; floor: Floor }) {
  if (!elem.wallId || elem.positionAlongWall === undefined) return null
  const wall = floor.walls.find(w => w.id === elem.wallId)
  if (!wall) return null

  const sv = floor.vertices[wall.startVertex]
  const ev = floor.vertices[wall.endVertex]
  const dx = ev.x - sv.x
  const dy = ev.y - sv.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len, uy = dy / len

  const pos = elem.positionAlongWall ?? 0.5
  const cx = sv.x + ux * pos * len
  const cy = sv.y + uy * pos * len
  const doorWidthPx = (elem.width / 12) * 8 // inches → ft → px

  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <Group x={cx} y={cy} rotation={angle}>
      <Line points={[0, 0, doorWidthPx, 0]} stroke="#0ea5e9" strokeWidth={2} />
      <Arc
        x={0}
        y={0}
        innerRadius={0}
        outerRadius={doorWidthPx}
        angle={90}
        fill="rgba(14,165,233,0.1)"
        stroke="#0ea5e9"
        strokeWidth={1}
        rotation={0}
      />
    </Group>
  )
}

function WindowShape({ elem, floor }: { elem: PlacedElement; floor: Floor }) {
  if (!elem.wallId || elem.positionAlongWall === undefined) return null
  const wall = floor.walls.find(w => w.id === elem.wallId)
  if (!wall) return null

  const sv = floor.vertices[wall.startVertex]
  const ev = floor.vertices[wall.endVertex]
  const dx = ev.x - sv.x
  const dy = ev.y - sv.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len, uy = dy / len

  const pos = elem.positionAlongWall ?? 0.5
  const cx = sv.x + ux * pos * len
  const cy = sv.y + uy * pos * len
  const winWidthPx = (elem.width / 12) * 8
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <Group x={cx - (winWidthPx / 2) * Math.cos(angle * Math.PI / 180)} y={cy - (winWidthPx / 2) * Math.sin(angle * Math.PI / 180)} rotation={angle}>
      <Line points={[0, -3, winWidthPx, -3]} stroke="#38bdf8" strokeWidth={1.5} />
      <Line points={[0, 0, winWidthPx, 0]} stroke="#38bdf8" strokeWidth={2} />
      <Line points={[0, 3, winWidthPx, 3]} stroke="#38bdf8" strokeWidth={1.5} />
    </Group>
  )
}

export function ElementLayer({ floor }: ElementLayerProps) {
  return (
    <Layer>
      {floor.elements.map(elem => {
        if (elem.elementType.startsWith('door')) {
          return <DoorShape key={elem.id} elem={elem} floor={floor} />
        }
        if (elem.elementType.startsWith('window')) {
          return <WindowShape key={elem.id} elem={elem} floor={floor} />
        }
        return null
      })}
    </Layer>
  )
}
