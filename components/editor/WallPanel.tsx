'use client'
import { useEditorStore } from '@/store/useEditorStore'
import type { WallMaterial } from '@/types/floorplan'

const MATERIALS: WallMaterial[] = ['drywall', 'concrete', 'brick', 'glass', 'wood']

export function WallPanel() {
  const { floorPlan, selectedIds, activeFloor, updateWall } = useEditorStore()
  const floor = activeFloor()
  if (!floor || !floorPlan || selectedIds.length !== 1) return null

  const wall = floor.walls.find(w => w.id === selectedIds[0])
  if (!wall) return null

  // Compute length in feet
  const sv = floor.vertices[wall.startVertex]
  const ev = floor.vertices[wall.endVertex]
  const lengthFt = sv && ev
    ? Math.round(Math.sqrt((ev.x - sv.x) ** 2 + (ev.y - sv.y) ** 2) / floorPlan.scale * 10) / 10
    : 0

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {wall.isExterior ? 'Exterior Wall' : 'Interior Wall'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Length (read-only) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Length</label>
          <div className="text-sm text-slate-300 font-mono">{lengthFt} ft</div>
        </div>

        {/* Thickness */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Thickness (inches)</label>
          <div className="flex gap-2">
            {[4, 6, 8, 12].map(t => (
              <button
                key={t}
                onClick={() => updateWall(wall.id, { thickness: t })}
                className={`flex-1 py-1.5 rounded-md text-xs font-mono transition-colors border ${
                  wall.thickness === t
                    ? 'bg-blue-600/25 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}"
              </button>
            ))}
          </div>
        </div>

        {/* Height */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Height (inches)</label>
          <input
            type="number"
            value={wall.height}
            min={60}
            max={240}
            step={6}
            onChange={e => updateWall(wall.id, { height: Number(e.target.value) })}
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          />
          <div className="text-[11px] text-slate-600 font-mono">{Math.round(wall.height / 12 * 10) / 10} ft</div>
        </div>

        {/* Material */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500">Material</label>
          <div className="flex flex-wrap gap-1.5">
            {MATERIALS.map(m => (
              <button
                key={m}
                onClick={() => updateWall(wall.id, { material: m })}
                className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-colors border ${
                  wall.material === m
                    ? 'bg-blue-600/25 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Exterior toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-500">Exterior wall</label>
          <button
            onClick={() => updateWall(wall.id, { isExterior: !wall.isExterior })}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              wall.isExterior ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              wall.isExterior ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  )
}
