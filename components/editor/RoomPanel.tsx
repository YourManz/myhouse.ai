'use client'
import { Trash2 } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { ROOM_COLORS } from '@/types/floorplan'
import type { RoomType } from '@/types/floorplan'

const ROOM_TYPES: RoomType[] = [
  'bedroom', 'bathroom', 'kitchen', 'living', 'dining',
  'office', 'garage', 'hallway', 'laundry', 'utility',
  'closet', 'stairwell', 'basement', 'attic', 'custom',
]

function computeArea(room: { vertices: number[] }, vertices: { x: number; y: number }[], scale: number): number {
  const pts = room.vertices.map(i => vertices[i])
  // Shoelace formula
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  const areaPx = Math.abs(area) / 2
  return Math.round(areaPx / (scale * scale))
}

export function RoomPanel() {
  const { floorPlan, selectedIds, activeFloor, updateRoom, deleteRoom } = useEditorStore()
  const floor = activeFloor()
  if (!floor || !floorPlan || selectedIds.length !== 1) return null

  const room = floor.rooms.find(r => r.id === selectedIds[0])
  if (!room) return null

  const area = computeArea(room, floor.vertices, floorPlan.scale)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room</span>
        <button
          onClick={() => deleteRoom(room.id)}
          title="Delete room"
          className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Label */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Label</label>
          <input
            type="text"
            value={room.label}
            onChange={e => updateRoom(room.id, { label: e.target.value })}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Type</label>
          <select
            value={room.type}
            onChange={e => updateRoom(room.id, { type: e.target.value as RoomType })}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
          >
            {ROOM_TYPES.map(t => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>

        {/* Color swatch */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Fill color</label>
          <div className="flex flex-wrap gap-1.5">
            {ROOM_TYPES.filter(t => ROOM_COLORS[t] !== ROOM_COLORS.custom).slice(0, 10).map(t => (
              <button
                key={t}
                onClick={() => {/* future: pick custom fill */}}
                style={{ backgroundColor: ROOM_COLORS[t] }}
                className="w-5 h-5 rounded border border-slate-600 opacity-80 hover:opacity-100 transition-opacity"
                title={t}
              />
            ))}
          </div>
        </div>

        {/* Area */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Area</label>
          <div className="text-sm text-slate-300 font-mono">{area} sq ft</div>
        </div>

        {/* Vertices count */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Vertices</label>
          <div className="text-xs text-slate-500 font-mono">
            {[...new Set(room.vertices)].length} corners · drag blue handles to resize
          </div>
        </div>
      </div>
    </div>
  )
}
