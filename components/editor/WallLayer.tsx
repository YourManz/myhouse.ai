'use client'
import { Layer, Line, Text } from 'react-konva'
import type { Floor, WallSegment, ToolMode } from '@/types/floorplan'

interface WallLayerProps {
  floor: Floor
  activeTool: ToolMode
  selectedIds: string[]
  onSelect: (id: string) => void
  scale: number // px per foot — used for stroke width scaling
}

function wallMidpoint(wall: WallSegment, floor: Floor) {
  const sv = floor.vertices[wall.startVertex]
  const ev = floor.vertices[wall.endVertex]
  return { x: (sv.x + ev.x) / 2, y: (sv.y + ev.y) / 2 }
}

function wallLengthFt(wall: WallSegment, floor: Floor, scale: number): number {
  const sv = floor.vertices[wall.startVertex]
  const ev = floor.vertices[wall.endVertex]
  const dx = ev.x - sv.x
  const dy = ev.y - sv.y
  return Math.sqrt(dx * dx + dy * dy) / scale
}

export function WallLayer({ floor, activeTool, selectedIds, onSelect, scale }: WallLayerProps) {
  return (
    <Layer>
      {floor.walls.map(wall => {
        const sv = floor.vertices[wall.startVertex]
        const ev = floor.vertices[wall.endVertex]
        if (!sv || !ev) return null

        const isSelected = selectedIds.includes(wall.id)
        const thickness = (wall.thickness / 12) * scale // convert inches → px

        return (
          <Line
            key={wall.id}
            points={[sv.x, sv.y, ev.x, ev.y]}
            stroke={isSelected ? '#60a5fa' : wall.isExterior ? '#334155' : '#475569'}
            strokeWidth={Math.max(thickness, isSelected ? 3 : 2)}
            lineCap="square"
            lineJoin="miter"
            onClick={() => onSelect(wall.id)}
            onTap={() => onSelect(wall.id)}
            hitStrokeWidth={12}
          />
        )
      })}
    </Layer>
  )
}
