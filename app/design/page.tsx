'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MessageSquare, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { FloorSelector } from '@/components/editor/FloorSelector'
import { RoomPanel } from '@/components/editor/RoomPanel'
import { WallPanel } from '@/components/editor/WallPanel'
import { PromptForm } from '@/components/generate/PromptForm'
import { DesignChat } from '@/components/chat/DesignChat'
import { HistorySidebar } from '@/components/history/HistorySidebar'
import { SpecReviewPanel } from '@/components/specreview/SpecReviewPanel'
import { useEditorStore } from '@/store/useEditorStore'
import { useUIStore } from '@/store/useUIStore'

const FloorPlanEditor = dynamic(
  () => import('@/components/editor/FloorPlanEditor').then(m => ({ default: m.FloorPlanEditor })),
  { ssr: false }
)

export default function DesignPage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const { floorPlan, activeFloor, activeFloorId, setActiveFloorId, selectedIds, selectionType } = useEditorStore()
  const { viewMode, chatOpen, toggleChat, historyOpen, toggleHistory } = useUIStore()

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

  // Determine what to show in the right panel
  const hasSelection = selectedIds.length > 0
  const showRoomPanel = hasSelection && selectionType === 'room' && !chatOpen
  const showWallPanel = hasSelection && selectionType === 'wall' && !chatOpen
  const showSpecPanel = !hasSelection && !chatOpen && !!floorPlan?.threeDSpec

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Header />
      <PromptForm />

      <div className="flex items-center border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex-1">
          <EditorToolbar />
        </div>
        <div className="flex items-center gap-1 px-3">
          <button
            onClick={toggleHistory}
            title="Design history"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
              historyOpen ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock size={13} />
            History
          </button>
          <button
            onClick={toggleChat}
            title="Design assistant"
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
          {viewMode === '2d' || viewMode === 'split' ? (
            <div className="absolute inset-0" style={viewMode === 'split' ? { right: '50%' } : {}}>
              <FloorPlanEditor
                width={viewMode === 'split' ? canvasSize.width / 2 : canvasSize.width}
                height={canvasSize.height}
              />
            </div>
          ) : null}

          {viewMode === '3d' || viewMode === 'split' ? (
            <div
              className="absolute inset-0 border-l border-slate-800"
              style={viewMode === 'split' ? { left: '50%' } : {}}
            >
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                <div className="text-center">
                  <p className="text-2xl mb-2">🏠</p>
                  <p>3D viewer coming in Phase 4</p>
                  {floorPlan?.threeDSpec && (
                    <p className="mt-2 text-xs text-blue-500">
                      Roof: {floorPlan.threeDSpec.roof.type} @ {floorPlan.threeDSpec.roof.pitch}:12
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {!floorPlan && (
            <div className="absolute inset-0 flex items-center justify-center">
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
                    PBR render & export IFC
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — context-sensitive */}
        {(showRoomPanel || showWallPanel || showSpecPanel) && (
          <div className="w-72 shrink-0 border-l border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            {showRoomPanel && <RoomPanel />}
            {showWallPanel && <WallPanel />}
            {showSpecPanel && <SpecReviewPanel />}
          </div>
        )}

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 shrink-0 border-l border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-2">
              <MessageSquare size={13} className="text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Design Assistant</span>
            </div>
            <DesignChat />
          </div>
        )}
      </div>
    </div>
  )
}
