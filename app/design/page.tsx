'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MessageSquare, Clock, Palette } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { FloorSelector } from '@/components/editor/FloorSelector'
import { RoomPanel } from '@/components/editor/RoomPanel'
import { WallPanel } from '@/components/editor/WallPanel'
import { PromptForm } from '@/components/generate/PromptForm'
import { DesignChat } from '@/components/chat/DesignChat'
import { HistorySidebar } from '@/components/history/HistorySidebar'
import { SpecReviewPanel } from '@/components/specreview/SpecReviewPanel'
import { MaterialReviewPanel } from '@/components/materials/MaterialReviewPanel'
import { ExportDialog } from '@/components/export/ExportDialog'
import { useEditorStore } from '@/store/useEditorStore'
import { useUIStore } from '@/store/useUIStore'

const FloorPlanEditor = dynamic(
  () => import('@/components/editor/FloorPlanEditor').then(m => ({ default: m.FloorPlanEditor })),
  { ssr: false },
)

const HouseViewer3D = dynamic(
  () => import('@/components/viewer3d/HouseViewer3D').then(m => ({ default: m.HouseViewer3D })),
  { ssr: false },
)

export default function DesignPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const { floorPlan, activeFloorId, setActiveFloorId, selectedIds, selectionType } = useEditorStore()
  const {
    viewMode, chatOpen, toggleChat, historyOpen, toggleHistory,
    materialPanelOpen, toggleMaterials,
  } = useUIStore()

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setCanvasSize({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Right panel priority: chat > materials > room/wall selection > spec
  const showRoomPanel     = !chatOpen && !materialPanelOpen && selectedIds.length > 0 && selectionType === 'room'
  const showWallPanel     = !chatOpen && !materialPanelOpen && selectedIds.length > 0 && selectionType === 'wall'
  const showSpecPanel     = !chatOpen && !materialPanelOpen && selectedIds.length === 0 && !!floorPlan?.threeDSpec
  const showAnyRightPanel = chatOpen || materialPanelOpen || showRoomPanel || showWallPanel || showSpecPanel

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Header />
      <PromptForm />

      {/* Toolbar row */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex-1">
          <EditorToolbar />
        </div>
        <div className="flex items-center gap-1 px-3">
          <button
            onClick={toggleHistory}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
              historyOpen ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock size={13} />
            History
          </button>
          <button
            onClick={toggleMaterials}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
              materialPanelOpen
                ? 'bg-emerald-800/20 border border-emerald-700/30 text-emerald-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Palette size={13} />
            Materials
          </button>
          <button
            onClick={toggleChat}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
              chatOpen
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MessageSquare size={13} />
            Chat
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History sidebar (left) */}
        {historyOpen && (
          <div className="w-56 shrink-0 border-r border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            <HistorySidebar />
          </div>
        )}

        {/* Floor selector */}
        {floorPlan && (
          <div className="shrink-0 border-r border-slate-800 bg-slate-950">
            <FloorSelector
              floors={floorPlan.floors}
              activeFloorId={activeFloorId}
              onSelect={setActiveFloorId}
            />
          </div>
        )}

        {/* Main canvas */}
        <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-slate-950">
          {(viewMode === '2d' || viewMode === 'split') && (
            <div
              className="absolute inset-0"
              style={viewMode === 'split' ? { right: '50%' } : {}}
            >
              <FloorPlanEditor
                width={viewMode === 'split' ? canvasSize.width / 2 : canvasSize.width}
                height={canvasSize.height}
              />
            </div>
          )}

          {(viewMode === '3d' || viewMode === 'split') && (
            <div
              className="absolute inset-0 border-l border-slate-800"
              style={viewMode === 'split' ? { left: '50%' } : {}}
            >
              <HouseViewer3D />
            </div>
          )}

          {!floorPlan && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🏡</div>
                <h2 className="text-xl font-semibold text-slate-300 mb-2">Design Your Dream Home</h2>
                <p className="text-sm text-slate-500">
                  Describe your ideal house above and let AI generate an interactive floor plan,
                  3D architectural spec, and material palette in seconds.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-blue-500 text-lg mb-1">①</div>
                    AI generates floor plan
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-blue-500 text-lg mb-1">②</div>
                    Review 3D spec & cutouts
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-blue-500 text-lg mb-1">③</div>
                    PBR render & export
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panels */}
        {showAnyRightPanel && (
          <div className={`shrink-0 border-l border-slate-800 bg-slate-950 overflow-hidden flex flex-col ${
            chatOpen ? 'w-80' : 'w-72'
          }`}>
            {chatOpen && (
              <>
                <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-2">
                  <MessageSquare size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Design Assistant</span>
                </div>
                <DesignChat />
              </>
            )}
            {!chatOpen && materialPanelOpen && <MaterialReviewPanel />}
            {!chatOpen && !materialPanelOpen && showRoomPanel && <RoomPanel />}
            {!chatOpen && !materialPanelOpen && showWallPanel && <WallPanel />}
            {!chatOpen && !materialPanelOpen && showSpecPanel && <SpecReviewPanel />}
          </div>
        )}
      </div>

      <ExportDialog />
    </div>
  )
}
