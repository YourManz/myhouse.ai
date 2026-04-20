'use client'
import { Layer, Group, Line, Text, Rect } from 'react-konva'
import type { Floor, Room, ToolMode } from '@/types/floorplan'

interface RoomLayerProps {
  floor: Floor
  activeTool: ToolMode
  selectedIds: string[]
  onSelect: (id: string) => void
  onRoomMove: (roomId: string, dx: number, dy: number) => void
}

// Convert hex to RGBA for Konva fill
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function roomCenter(room: Room, vertices: Floor['vertices']): { x: number; y: number } {
  const pts = room.vertices.map(i => vertices[i])
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
  return { x: cx, y: cy }
}

export function RoomLayer({ floor, activeTool, selectedIds, onSelect, onRoomMove }: RoomLayerProps) {
  const isDraggable = activeTool === 'select'

  return (
    <Layer>
      {floor.rooms.map(room => {
        const pts = room.vertices.map(i => floor.vertices[i])
        const flatPoints = pts.flatMap(p => [p.x, p.y])
        const center = roomCenter(room, floor.vertices)
        const isSelected = selectedIds.includes(room.id)

        return (
          <Group
            key={room.id}
            draggable={isDraggable}
            onClick={() => onSelect(room.id)}
            onTap={() => onSelect(room.id)}
            onDragEnd={(e) => {
              const dx = e.target.x()
              const dy = e.target.y()
              e.target.x(0)
              e.target.y(0)
              onRoomMove(room.id, dx, dy)
            }}
          >
            <Line
              points={flatPoints}
              closed
              fill={hexToRgba(room.fillColor, 0.85)}
              stroke={isSelected ? '#60a5fa' : '#475569'}
              strokeWidth={isSelected ? 2 : 1}
              shadowEnabled={isSelected}
              shadowColor="#60a5fa"
              shadowBlur={8}
              shadowOpacity={0.4}
            />
            <Text
              x={center.x}
              y={center.y}
              text={room.label}
              fontSize={10}
              fill="#1e293b"
              align="center"
              verticalAlign="middle"
              offsetX={40}
              width={80}
              listening={false}
            />
          </Group>
        )
      })}
    </Layer>
  )
}
