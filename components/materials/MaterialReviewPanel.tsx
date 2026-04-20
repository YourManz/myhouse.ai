'use client'
import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import type { SurfaceTarget, TextureCategory } from '@/types/floorplan'

interface TextureOption {
  id: string
  label: string
  category: TextureCategory
  color: string
}

const TEXTURE_LIBRARY: TextureOption[] = [
  // Wood
  { id: 'oak-hardwood',    label: 'Oak Hardwood',    category: 'wood',     color: '#c49a6c' },
  { id: 'maple-hardwood',  label: 'Maple',           category: 'wood',     color: '#d4b483' },
  { id: 'walnut-hardwood', label: 'Walnut',          category: 'wood',     color: '#7c5a3c' },
  { id: 'pine-plank',      label: 'Pine Plank',      category: 'wood',     color: '#c8a878' },
  { id: 'cedar-siding',    label: 'Cedar Siding',    category: 'wood',     color: '#a0614a' },
  { id: 'shiplap-white',   label: 'Shiplap White',   category: 'wood',     color: '#f0ede8' },
  // Stone
  { id: 'marble-white',    label: 'White Marble',    category: 'stone',    color: '#f0eeeb' },
  { id: 'slate-grey',      label: 'Slate Grey',      category: 'stone',    color: '#6b7280' },
  { id: 'limestone-beige', label: 'Limestone',       category: 'stone',    color: '#c4b9a0' },
  { id: 'travertine',      label: 'Travertine',      category: 'stone',    color: '#d4c8b4' },
  // Tile
  { id: 'subway-tile-white', label: 'Subway White',  category: 'tile',     color: '#f5f3f0' },
  { id: 'subway-tile-grey',  label: 'Subway Grey',   category: 'tile',     color: '#c0bab4' },
  { id: 'hex-tile-white',    label: 'Hex Tile',      category: 'tile',     color: '#f0eeeb' },
  { id: 'terracotta-tile',   label: 'Terracotta',    category: 'tile',     color: '#c06a3c' },
  { id: 'porcelain-large',   label: 'Large Porcelain', category: 'tile',   color: '#e8e4df' },
  // Concrete
  { id: 'concrete-polished', label: 'Polished Concrete', category: 'concrete', color: '#9ca3af' },
  { id: 'concrete-raw',      label: 'Raw Concrete',   category: 'concrete', color: '#7c8490' },
  { id: 'concrete-white',    label: 'White Concrete', category: 'concrete', color: '#ddd9d4' },
  // Brick
  { id: 'brick-red',        label: 'Red Brick',       category: 'brick',   color: '#a85732' },
  { id: 'brick-white',      label: 'White Brick',     category: 'brick',   color: '#e8e4df' },
  { id: 'brick-grey',       label: 'Grey Brick',      category: 'brick',   color: '#9ca3af' },
  // Metal
  { id: 'steel-brushed',    label: 'Brushed Steel',   category: 'metal',   color: '#9ba3ad' },
  { id: 'copper-aged',      label: 'Aged Copper',     category: 'metal',   color: '#7a9a8c' },
  { id: 'zinc-standing-seam', label: 'Zinc Seam',     category: 'metal',   color: '#7a8a90' },
  // Paint
  { id: 'paint-warm-white', label: 'Warm White',      category: 'paint',   color: '#f5f0e8' },
  { id: 'paint-charcoal',   label: 'Charcoal',        category: 'paint',   color: '#374151' },
  { id: 'paint-sage',       label: 'Sage Green',      category: 'paint',   color: '#6b8f71' },
  { id: 'paint-navy',       label: 'Navy',            category: 'paint',   color: '#1e3a5f' },
  { id: 'paint-terracotta', label: 'Terracotta',      category: 'paint',   color: '#c06a3c' },
]

const CATEGORY_LABELS: Record<TextureCategory, string> = {
  wood: 'Wood', stone: 'Stone', tile: 'Tile',
  concrete: 'Concrete', brick: 'Brick', metal: 'Metal',
  fabric: 'Fabric', paint: 'Paint',
}

function TexturePicker({ current, onSelect, onClose }: {
  current: string
  onSelect: (tex: TextureOption) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState<TextureCategory | 'all'>('all')
  const categories = [...new Set(TEXTURE_LIBRARY.map(t => t.category))] as TextureCategory[]
  const visible = filter === 'all' ? TEXTURE_LIBRARY : TEXTURE_LIBRARY.filter(t => t.category === filter)

  return (
    <div className="absolute inset-x-0 top-0 z-10 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">Choose texture</span>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300"><X size={13} /></button>
      </div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded text-[11px] font-mono ${filter === 'all' ? 'bg-blue-600/30 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
        >all</button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono ${filter === c ? 'bg-blue-600/30 text-blue-300' : 'text-slate-500 hover:text-slate-300'}`}
          >{CATEGORY_LABELS[c]}</button>
        ))}
      </div>
      {/* Texture grid */}
      <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
        {visible.map(tex => (
          <button
            key={tex.id}
            onClick={() => { onSelect(tex); onClose() }}
            title={tex.label}
            className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-colors ${
              tex.id === current
                ? 'border-blue-500/60 bg-blue-600/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="w-7 h-7 rounded border border-slate-600" style={{ backgroundColor: tex.color }} />
            <span className="text-[9px] text-slate-500 truncate w-full text-center">{tex.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function MaterialReviewPanel() {
  const { floorPlan, updateFloorPlan } = useEditorStore()
  const [openPicker, setOpenPicker] = useState<string | null>(null)

  if (!floorPlan?.materialPalette) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <p className="text-xs text-slate-600">Generate a design first — materials will appear after the third AI call.</p>
      </div>
    )
  }

  const { surfaces } = floorPlan.materialPalette

  const toggleSurface = (target: string) => {
    updateFloorPlan(fp => ({
      ...fp,
      materialPalette: fp.materialPalette ? {
        ...fp.materialPalette,
        surfaces: fp.materialPalette.surfaces.map(s =>
          s.target === target ? { ...s, enabled: !s.enabled } : s
        ),
      } : fp.materialPalette,
    }))
  }

  const swapTexture = (target: string, tex: TextureOption) => {
    updateFloorPlan(fp => ({
      ...fp,
      materialPalette: fp.materialPalette ? {
        ...fp.materialPalette,
        surfaces: fp.materialPalette.surfaces.map(s =>
          s.target === target ? {
            ...s,
            texture: {
              ...s.texture,
              id: tex.id,
              label: tex.label,
              category: tex.category,
              color: tex.color,
            },
          } : s
        ),
      } : fp.materialPalette,
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Materials</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {surfaces.map(surf => (
          <div
            key={surf.target}
            className={`relative rounded-lg border p-3 transition-colors ${
              surf.enabled ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start gap-2">
              {/* Color swatch */}
              <button
                onClick={() => setOpenPicker(openPicker === surf.target ? null : surf.target)}
                className="w-8 h-8 rounded border border-slate-600 shrink-0 hover:border-blue-500 transition-colors"
                style={{ backgroundColor: surf.texture.color }}
                title="Change texture"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs text-slate-300 capitalize font-medium">
                    {surf.target.replace(/-/g, ' ')}
                  </span>
                  <ChevronDown size={11} className="text-slate-600" />
                </div>
                <div className="text-[11px] text-slate-500">{surf.texture.label}</div>
                {surf.rationale && (
                  <div className="text-[10px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{surf.rationale}</div>
                )}
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleSurface(surf.target)}
                className={`w-8 h-4 rounded-full transition-colors relative shrink-0 mt-0.5 ${surf.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${surf.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Texture picker dropdown */}
            {openPicker === surf.target && (
              <div className="mt-2">
                <TexturePicker
                  current={surf.texture.id}
                  onSelect={tex => swapTexture(surf.target, tex)}
                  onClose={() => setOpenPicker(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
