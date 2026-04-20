'use client'
import { MousePointer2, Square, Minus, DoorOpen, AppWindow, Hand, Undo2, Redo2, Download, Box, Layers } from 'lucide-react'
import type { ToolMode, ViewMode } from '@/types/floorplan'
import { useEditorStore } from '@/store/useEditorStore'
import { useUIStore } from '@/store/useUIStore'

const TOOLS: { mode: ToolMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'select', icon: <MousePointer2 size={16} />, label: 'Select (V)' },
  { mode: 'pan', icon: <Hand size={16} />, label: 'Pan (Space)' },
  { mode: 'room', icon: <Square size={16} />, label: 'Add Room (R)' },
  { mode: 'wall', icon: <Minus size={16} />, label: 'Add Wall (W)' },
  { mode: 'door', icon: <DoorOpen size={16} />, label: 'Place Door (D)' },
  { mode: 'window', icon: <AppWindow size={16} />, label: 'Place Window (N)' },
]

const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: '2d', label: '2D' },
  { mode: 'split', label: 'Split' },
  { mode: '3d', label: '3D' },
]

export function EditorToolbar() {
  const { activeTool, setActiveTool, undo, redo, canUndo, canRedo } = useEditorStore()
  const { viewMode, setViewMode, setExportDialogOpen } = useUIStore()

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-3 mr-1">
        {TOOLS.map(({ mode, icon, label }) => (
          <button
            key={mode}
            title={label}
            onClick={() => setActiveTool(mode)}
            className={`
              p-2 rounded transition-colors
              ${activeTool === mode
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
            `}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-3 mr-1">
        <button
          title="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={16} />
        </button>
        <button
          title="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* View mode */}
      <div className="flex items-center rounded overflow-hidden border border-slate-700">
        {VIEW_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`
              px-3 py-1.5 text-xs font-medium transition-colors
              ${viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Export */}
      <button
        onClick={() => setExportDialogOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
      >
        <Download size={14} />
        Export
      </button>
    </div>
  )
}
