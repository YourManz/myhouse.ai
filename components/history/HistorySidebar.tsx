'use client'
import { useEffect, useState } from 'react'
import { Clock, Trash2, ChevronRight } from 'lucide-react'
import { loadDesigns, deleteDesign } from '@/lib/db'
import type { SavedDesign } from '@/lib/db'
import { useEditorStore } from '@/store/useEditorStore'
import type { FloorPlan } from '@/types/floorplan'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export function HistorySidebar() {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const { setFloorPlan } = useEditorStore()

  const refresh = async () => {
    try {
      setDesigns(await loadDesigns())
    } catch {
      // IndexedDB may be unavailable in some contexts
    }
  }

  useEffect(() => { refresh() }, [])

  const load = (d: SavedDesign) => {
    try {
      const fp = JSON.parse(d.floorPlanJson) as FloorPlan
      setFloorPlan(fp)
    } catch { /* corrupt entry */ }
  }

  const remove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await deleteDesign(id)
    refresh()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {designs.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-600">No saved designs yet.</p>
            <p className="text-[11px] text-slate-700 mt-1">Designs save automatically after generation.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-800/60">
            {designs.map(d => (
              <button
                key={d.id}
                onClick={() => load(d)}
                className="group flex items-start gap-2 p-3 text-left hover:bg-slate-900/60 transition-colors"
              >
                <ChevronRight size={11} className="text-slate-700 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 font-medium truncate">{d.title}</div>
                  {d.prompt && (
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">{d.prompt.slice(0, 60)}</div>
                  )}
                  <div className="text-[10px] text-slate-700 mt-1 font-mono">{timeAgo(d.timestamp)}</div>
                </div>
                <button
                  onClick={e => remove(e, d.id!)}
                  className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all p-1 shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
