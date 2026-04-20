'use client'
import { useEditorStore } from '@/store/useEditorStore'
import type { RoofType, ThreeDSpec } from '@/types/floorplan'

const ROOF_TYPES: { type: RoofType; label: string; emoji: string }[] = [
  { type: 'gable',     label: 'Gable',     emoji: '🏠' },
  { type: 'hip',       label: 'Hip',       emoji: '🏡' },
  { type: 'flat',      label: 'Flat',      emoji: '⬜' },
  { type: 'shed',      label: 'Shed',      emoji: '🛖' },
  { type: 'butterfly', label: 'Butterfly', emoji: '🦋' },
  { type: 'mansard',   label: 'Mansard',   emoji: '🏰' },
  { type: 'gambrel',   label: 'Gambrel',   emoji: '🏚️' },
]

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function SpecReviewPanel() {
  const { floorPlan, updateFloorPlan } = useEditorStore()
  if (!floorPlan?.threeDSpec) return null

  const spec = floorPlan.threeDSpec

  const patchSpec = (updater: (s: ThreeDSpec) => ThreeDSpec) => {
    updateFloorPlan(fp => ({
      ...fp,
      threeDSpec: fp.threeDSpec ? updater(fp.threeDSpec) : fp.threeDSpec,
    }))
  }

  const setRoofType = (type: RoofType) => patchSpec(s => ({ ...s, roof: { ...s.roof, type } }))
  const setRoofPitch = (pitch: number) => patchSpec(s => ({ ...s, roof: { ...s.roof, pitch } }))
  const setRoofOverhang = (overhang: number) => patchSpec(s => ({ ...s, roof: { ...s.roof, overhang } }))

  const toggleCutout = (id: string) => patchSpec(s => ({
    ...s,
    cutouts: s.cutouts.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c),
  }))

  const toggleFeature = (id: string) => patchSpec(s => ({
    ...s,
    features: s.features.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f),
  }))

  const toggleCeiling = (roomId: string) => patchSpec(s => ({
    ...s,
    ceilingOverrides: s.ceilingOverrides.map(c => c.roomId === roomId ? { ...c, enabled: !c.enabled } : c),
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">3D Spec</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Roof type picker */}
        <section>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Roof type</div>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {ROOF_TYPES.map(r => (
              <button
                key={r.type}
                onClick={() => setRoofType(r.type)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-center transition-colors ${
                  spec.roof.type === r.type
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="text-lg leading-none">{r.emoji}</span>
                <span className="text-[10px] font-mono">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Pitch */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] text-slate-500 w-12">Pitch</span>
            <input
              type="range" min={1} max={16} step={1} value={spec.roof.pitch}
              onChange={e => setRoofPitch(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-slate-300 font-mono w-10 text-right">{spec.roof.pitch}:12</span>
          </div>

          {/* Overhang */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-12">Overhang</span>
            <input
              type="range" min={0} max={4} step={0.5} value={spec.roof.overhang}
              onChange={e => setRoofOverhang(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-slate-300 font-mono w-10 text-right">{spec.roof.overhang}ft</span>
          </div>
        </section>

        {/* Rationale */}
        {spec.rationale && (
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 text-xs text-blue-300 leading-relaxed">
            {spec.rationale}
          </div>
        )}

        {/* Cutouts */}
        {spec.cutouts.length > 0 && (
          <section>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
              Structural cutouts
            </div>
            <div className="flex flex-col gap-2">
              {spec.cutouts.map(cut => (
                <div
                  key={cut.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    cut.enabled
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-200 capitalize">
                          {cut.type.replace(/-/g, ' ')}
                        </span>
                        <span className="text-[10px] text-blue-400 font-mono">Floor {cut.targetFloor}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{cut.rationale}</p>
                    </div>
                    <Toggle enabled={cut.enabled} onChange={() => toggleCutout(cut.id)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features */}
        {spec.features.length > 0 && (
          <section>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
              Architectural features
            </div>
            <div className="flex flex-col gap-2">
              {spec.features.map(feat => (
                <div
                  key={feat.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    feat.enabled
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-200 capitalize">
                          {feat.type.replace(/-/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">{feat.location}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{feat.rationale}</p>
                    </div>
                    <Toggle enabled={feat.enabled} onChange={() => toggleFeature(feat.id)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ceiling overrides */}
        {spec.ceilingOverrides.length > 0 && (
          <section>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
              Ceiling overrides
            </div>
            <div className="flex flex-col gap-1.5">
              {spec.ceilingOverrides.map(co => (
                <div
                  key={co.roomId}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    co.enabled
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 capitalize">{co.type.replace(/-/g, ' ')}</span>
                    {co.peakHeight && (
                      <span className="text-[11px] text-slate-500 ml-2">
                        → {Math.round(co.peakHeight / 12 * 10) / 10}ft peak
                      </span>
                    )}
                  </div>
                  <Toggle enabled={co.enabled} onChange={() => toggleCeiling(co.roomId)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Materials preview */}
        {floorPlan.materialPalette && (
          <section>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Materials</div>
            <div className="flex flex-col gap-1.5">
              {floorPlan.materialPalette.surfaces.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded shrink-0 border border-slate-700"
                    style={{ backgroundColor: s.texture.color }}
                  />
                  <span className="text-slate-400 capitalize">{s.target.replace(/-/g, ' ')}</span>
                  <span className="text-slate-600 truncate">{s.texture.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
