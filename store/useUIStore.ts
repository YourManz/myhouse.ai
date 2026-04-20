'use client'
import { create } from 'zustand'
import type { ViewMode } from '@/types/floorplan'

interface UIStore {
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void

  rightPanel: 'room' | 'wall' | 'element' | 'spec' | 'materials' | null
  setRightPanel: (p: UIStore['rightPanel']) => void

  exportDialogOpen: boolean
  setExportDialogOpen: (v: boolean) => void

  specPanelOpen: boolean
  setSpecPanelOpen: (v: boolean) => void

  materialPanelOpen: boolean
  setMaterialPanelOpen: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  viewMode: '2d',
  setViewMode: (m) => set({ viewMode: m }),

  rightPanel: null,
  setRightPanel: (p) => set({ rightPanel: p }),

  exportDialogOpen: false,
  setExportDialogOpen: (v) => set({ exportDialogOpen: v }),

  specPanelOpen: false,
  setSpecPanelOpen: (v) => set({ specPanelOpen: v }),

  materialPanelOpen: false,
  setMaterialPanelOpen: (v) => set({ materialPanelOpen: v }),
}))
