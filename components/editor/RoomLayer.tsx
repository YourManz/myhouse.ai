'use client'
import { Layer, Group, Line, Text, Circle } from 'react-konva'
import type Konva from 'konva'
import type { Floor, Room, ToolMode } from '@/types/floorplan'
import { useEditorStore } from '@/store/useEditorStore'

interface RoomLayerProps {
  floor: Floor
  floorId: string
  activeTool: ToolMode
  selectedIds: string[]
  onSelect: (id: string) => void
  onRoomMove: (roomId: string, dx: number, dy: number) => void
}

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

export function RoomLayer({ floor, floorId, activeTool, selectedIds, onSelect, onRoomMove }: RoomLayerProps) {
  const { moveVertex, pushHistory } = useEditorStore()
  const isDraggable = activeTool === 'select'

  // Collect unique vertex indices for the selected room
  const selectedRoom = selectedIds.length === 1
    ? floor.rooms.find(r => r.id === selectedIds[0])
    : null
  const handleVertices = selectedRoom
    ? [...new Set(selectedRoom.vertices)]
    : []

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

      {/* Vertex drag handles for selected room */}
      {isDraggable && handleVertices.map(vi => {
        const v = floor.vertices[vi]
        if (!v) return null
        return (
          <Circle
            key={`vh-${vi}`}
            x={v.x}
            y={v.y}
            radius={5}
            fill="#1e40af"
            stroke="#60a5fa"
            strokeWidth={1.5}
            draggable
            onMouseEnter={e => { e.target.getStage()!.container().style.cursor = 'crosshair' }}
            onMouseLeave={e => { e.target.getStage()!.container().style.cursor = 'default' }}
            onDragStart={() => pushHistory()}
            onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
              moveVertex(floorId, vi, e.target.x(), e.target.y())
            }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
              moveVertex(floorId, vi, e.target.x(), e.target.y())
            }}
          />
        )
      })}
    </Layer>
  )
}
