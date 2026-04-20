'use client'
import { create } from 'zustand'
import type { FloorPlan, Floor, Room, WallSegment, PlacedElement, ToolMode } from '@/types/floorplan'

interface CanvasTransform {
  x: number
  y: number
  scale: number
}

interface EditorStore {
  floorPlan: FloorPlan | null
  setFloorPlan: (fp: FloorPlan) => void
  updateFloorPlan: (updater: (fp: FloorPlan) => FloorPlan) => void

  activeFloorId: string | null
  setActiveFloorId: (id: string) => void
  activeFloor: () => Floor | null

  activeTool: ToolMode
  setActiveTool: (tool: ToolMode) => void

  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  clearSelection: () => void

  canvasTransform: CanvasTransform
  setCanvasTransform: (t: Partial<CanvasTransform>) => void

  // Undo/redo
  history: FloorPlan[]
  historyIndex: number
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  isGenerating: boolean
  setIsGenerating: (v: boolean) => void
  generationStep: 'idle' | 'floorplan' | 'spec' | 'materials' | 'done'
  setGenerationStep: (s: EditorStore['generationStep']) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  floorPlan: null,
  setFloorPlan: (fp) => {
    set({
      floorPlan: fp,
      activeFloorId: fp.floors[0]?.id ?? null,
      history: [fp],
      historyIndex: 0,
    })
  },
  updateFloorPlan: (updater) => {
    const current = get().floorPlan
    if (!current) return
    const next = updater(current)
    set({ floorPlan: next })
  },

  activeFloorId: null,
  setActiveFloorId: (id) => set({ activeFloorId: id }),
  activeFloor: () => {
    const { floorPlan, activeFloorId } = get()
    if (!floorPlan || !activeFloorId) return null
    return floorPlan.floors.find(f => f.id === activeFloorId) ?? null
  },

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  canvasTransform: { x: 0, y: 0, scale: 1 },
  setCanvasTransform: (t) =>
    set(s => ({ canvasTransform: { ...s.canvasTransform, ...t } })),

  history: [],
  historyIndex: -1,
  pushHistory: () => {
    const { floorPlan, history, historyIndex } = get()
    if (!floorPlan) return
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(floorPlan)
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    set({ floorPlan: history[newIndex], historyIndex: newIndex })
  },
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    set({ floorPlan: history[newIndex], historyIndex: newIndex })
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  generationStep: 'idle',
  setGenerationStep: (s) => set({ generationStep: s }),
}))
