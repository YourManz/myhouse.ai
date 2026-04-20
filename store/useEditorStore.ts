'use client'
import { create } from 'zustand'
import type { FloorPlan, Floor, Room, WallSegment, PlacedElement, ToolMode, RoomType, WallMaterial } from '@/types/floorplan'

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
  selectionType: 'room' | 'wall' | null
  setSelectedIds: (ids: string[], type?: 'room' | 'wall') => void
  clearSelection: () => void

  canvasTransform: CanvasTransform
  setCanvasTransform: (t: Partial<CanvasTransform>) => void

  // Mutations
  updateRoom: (roomId: string, patch: Partial<Pick<Room, 'type' | 'label'>>) => void
  deleteRoom: (roomId: string) => void
  updateWall: (wallId: string, patch: Partial<Pick<WallSegment, 'thickness' | 'height' | 'material' | 'isExterior'>>) => void
  moveVertex: (floorId: string, vertexIdx: number, x: number, y: number) => void

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
    set({ floorPlan: updater(current) })
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
  selectionType: null,
  setSelectedIds: (ids, type) => set({ selectedIds: ids, selectionType: type ?? null }),
  clearSelection: () => set({ selectedIds: [], selectionType: null }),

  canvasTransform: { x: 0, y: 0, scale: 1 },
  setCanvasTransform: (t) =>
    set(s => ({ canvasTransform: { ...s.canvasTransform, ...t } })),

  updateRoom: (roomId, patch) => {
    get().pushHistory()
    get().updateFloorPlan(fp => ({
      ...fp,
      floors: fp.floors.map(f => ({
        ...f,
        rooms: f.rooms.map(r => r.id === roomId ? { ...r, ...patch } : r),
      })),
    }))
  },

  deleteRoom: (roomId) => {
    get().pushHistory()
    get().updateFloorPlan(fp => ({
      ...fp,
      floors: fp.floors.map(f => {
        const room = f.rooms.find(r => r.id === roomId)
        if (!room) return f
        const roomVertexSet = new Set(room.vertices)
        const remainingRooms = f.rooms.filter(r => r.id !== roomId)
        const usedVertices = new Set(remainingRooms.flatMap(r => r.vertices))
        const orphanVertices = [...roomVertexSet].filter(vi => !usedVertices.has(vi))
        const orphanSet = new Set(orphanVertices)
        const remainingWalls = f.walls.filter(w =>
          !(orphanSet.has(w.startVertex) && orphanSet.has(w.endVertex))
        )
        return { ...f, rooms: remainingRooms, walls: remainingWalls }
      }),
    }))
    get().clearSelection()
  },

  updateWall: (wallId, patch) => {
    get().pushHistory()
    get().updateFloorPlan(fp => ({
      ...fp,
      floors: fp.floors.map(f => ({
        ...f,
        walls: f.walls.map(w => w.id === wallId ? { ...w, ...patch } : w),
      })),
    }))
  },

  moveVertex: (floorId, vertexIdx, x, y) => {
    get().updateFloorPlan(fp => ({
      ...fp,
      floors: fp.floors.map(f => {
        if (f.id !== floorId) return f
        const newVerts = [...f.vertices]
        newVerts[vertexIdx] = { x, y }
        return { ...f, vertices: newVerts }
      }),
    }))
  },

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
