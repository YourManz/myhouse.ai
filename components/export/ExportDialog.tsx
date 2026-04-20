'use client'
import { useState } from 'react'
import { X, Download, FileCode, Box, Grid3x3, AlertCircle } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useEditorStore } from '@/store/useEditorStore'
import { exportDXF } from '@/lib/exportDXF'
import { exportGLTF, exportOBJ } from '@/lib/exportGLTF'

interface FormatOption {
  id: string
  label: string
  description: string
  extension: string
  badge: string
  badgeColor: string
  icon: React.ReactNode
  needsViewer?: boolean
  comingSoon?: boolean
}

const FORMATS: FormatOption[] = [
  {
    id: 'dxf',
    label: 'DXF',
    description: 'AutoCAD, LibreCAD, SketchUp — 2D walls, rooms, labels',
    extension: '.dxf',
    badge: '2D',
    badgeColor: 'bg-emerald-800/50 text-emerald-400',
    icon: <Grid3x3 size={18} />,
  },
  {
    id: 'gltf',
    label: 'glTF / GLB',
    description: 'Blender, Unity, Unreal — 3D mesh with PBR materials',
    extension: '.glb',
    badge: '3D',
    badgeColor: 'bg-blue-800/50 text-blue-400',
    icon: <Box size={18} />,
    needsViewer: true,
  },
  {
    id: 'obj',
    label: 'OBJ',
    description: 'Universal 3D mesh — any modelling tool',
    extension: '.obj',
    badge: '3D',
    badgeColor: 'bg-blue-800/50 text-blue-400',
    icon: <Box size={18} />,
    needsViewer: true,
  },
  {
    id: 'ifc',
    label: 'IFC',
    description: 'Revit, ArchiCAD, BlenderBIM — parametric BIM with walls, spaces, floors',
    extension: '.ifc',
    badge: 'BIM',
    badgeColor: 'bg-violet-800/50 text-violet-400',
    icon: <FileCode size={18} />,
    comingSoon: true,
  },
]

export function ExportDialog() {
  const { exportDialogOpen, setExportDialogOpen } = useUIStore()
  const { floorPlan } = useEditorStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  if (!exportDialogOpen) return null

  const run = async (id: string) => {
    if (!floorPlan || busy) return
    setBusy(id)
    setDone(null)
    try {
      const title = floorPlan.title || 'house'
      if (id === 'dxf')  await exportDXF(floorPlan)
      if (id === 'gltf') await exportGLTF(title)
      if (id === 'obj')  await exportOBJ(title)
      setDone(id)
      setTimeout(() => setDone(null), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(5,13,26,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) setExportDialogOpen(false) }}
    >
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Export Design</h2>
            {floorPlan && (
              <p className="text-xs text-slate-500 mt-0.5">{floorPlan.title}</p>
            )}
          </div>
          <button
            onClick={() => setExportDialogOpen(false)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Format list */}
        <div className="p-4 flex flex-col gap-2">
          {!floorPlan && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-400 mb-2">
              <AlertCircle size={13} />
              Generate a floor plan first
            </div>
          )}

          {FORMATS.map(fmt => {
            const isBusy = busy === fmt.id
            const isDone = done === fmt.id

            return (
              <button
                key={fmt.id}
                onClick={() => !fmt.comingSoon && run(fmt.id)}
                disabled={!!busy || !floorPlan || !!fmt.comingSoon}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  fmt.comingSoon
                    ? 'border-slate-800 opacity-40 cursor-not-allowed'
                    : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/60 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <div className="text-slate-500 shrink-0">{fmt.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-200">{fmt.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${fmt.badgeColor}`}>
                      {fmt.badge}
                    </span>
                    {fmt.comingSoon && (
                      <span className="text-[10px] text-slate-600 font-mono">soon</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{fmt.description}</p>
                  {fmt.needsViewer && (
                    <p className="text-[10px] text-slate-700 mt-0.5">Requires 3D view to be open</p>
                  )}
                </div>
                <div className="shrink-0">
                  {isBusy ? (
                    <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin block" />
                  ) : isDone ? (
                    <span className="text-emerald-400 text-xs font-mono">✓ saved</span>
                  ) : (
                    <Download size={15} className="text-slate-600" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
