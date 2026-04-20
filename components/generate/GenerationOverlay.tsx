'use client'
import { useEffect, useState } from 'react'
import { FloorPlanAnim } from './FloorPlanAnim'
import { HouseBuildAnim } from './HouseBuildAnim'
import { MaterialsAnim } from './MaterialsAnim'
import { Terminal } from './Terminal'

export type GenStep = 'idle' | 'floorplan' | 'spec' | 'materials' | 'done'

interface Stage {
  step: GenStep
  label: string
  sublabel: string
  terminalTitle: string
}

const STAGES: Stage[] = [
  {
    step: 'floorplan',
    label: 'Drawing Floor Plan',
    sublabel: 'Rooms, walls & openings',
    terminalTitle: 'myhouse.ai — generating floor plan',
  },
  {
    step: 'spec',
    label: 'Extracting 3D Architecture',
    sublabel: 'Roof, cutouts & ceiling variations',
    terminalTitle: 'myhouse.ai — extracting 3D spec',
  },
  {
    step: 'materials',
    label: 'Selecting Materials',
    sublabel: 'PBR surfaces & finishes',
    terminalTitle: 'myhouse.ai — choosing materials',
  },
]

const STEP_ORDER: GenStep[] = ['floorplan', 'spec', 'materials', 'done']

function stageIndex(step: GenStep): number {
  return STEP_ORDER.indexOf(step)
}

interface GenerationOverlayProps {
  step: GenStep
  streamingText: string
}

export function GenerationOverlay({ step, streamingText }: GenerationOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (step !== 'idle' && step !== 'done') {
      setVisible(true)
    } else if (step === 'done') {
      const t = setTimeout(() => setVisible(false), 800)
      return () => clearTimeout(t)
    }
  }, [step])

  if (!visible) return null

  const currentIdx = stageIndex(step)
  const activeStage = STAGES.find(s => s.step === step)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'rgba(5, 13, 26, 0.96)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div className="w-full max-w-5xl flex flex-col gap-5" style={{ animation: 'slideUp 0.4s ease' }}>

        {/* Stage indicator bar */}
        <div className="flex items-center justify-center gap-2">
          {STAGES.map((stage, i) => {
            const done = currentIdx > i
            const active = currentIdx === i
            return (
              <div key={stage.step} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-500 ${
                  active  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300' :
                  done    ? 'bg-emerald-600/10 border border-emerald-700/30 text-emerald-500' :
                            'border border-white/6 text-slate-700'
                }`}>
                  <span className={`w-4 text-center ${active ? 'animate-pulse' : ''}`}>
                    {done ? '✓' : active ? '›' : '○'}
                  </span>
                  {stage.label}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`w-8 h-px transition-colors duration-500 ${done ? 'bg-emerald-700/50' : 'bg-white/8'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Main content: animation + terminal */}
        <div className="flex gap-4" style={{ height: '400px' }}>

          {/* Left: thematic animation */}
          <div className="flex-1 rounded-xl border border-white/8 overflow-hidden bg-[#050d1a] flex flex-col">
            {/* Animation header */}
            <div className="px-4 py-3 border-b border-white/6 shrink-0">
              <div className="text-sm font-medium text-slate-200">
                {activeStage?.label ?? 'Processing'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {activeStage?.sublabel}
              </div>
            </div>

            {/* The animation itself */}
            <div className="flex-1 relative">
              {step === 'floorplan' && <FloorPlanAnim />}
              {step === 'spec'      && <HouseBuildAnim />}
              {step === 'materials' && <MaterialsAnim />}
            </div>
          </div>

          {/* Right: streaming terminal */}
          <div className="w-[360px] shrink-0">
            <Terminal
              text={streamingText}
              title={activeStage?.terminalTitle ?? 'myhouse.ai'}
            />
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs text-slate-700 font-mono">
          Streaming live output from Claude · {step !== 'idle' && step !== 'done' ? 'generating…' : ''}
        </p>
      </div>
    </div>
  )
}
