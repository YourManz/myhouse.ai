'use client'
import { useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { useUIStore } from '@/store/useUIStore'
import { useApiKey } from '@/components/ApiKeyGate'
import { generateFloorPlan, extract3DSpec, getMaterialPalette } from '@/lib/claude-client'
import { aiResponseToFloorPlan } from '@/lib/floorplan'

const EXAMPLES = [
  'Craftsman 3BR with open kitchen, master ensuite, attached garage, wraparound porch',
  'Modern 2BR flat with open plan living, home office, rooftop terrace',
  'Colonial 4BR, formal dining, home office, 2.5 baths, double garage',
  'Minimalist single-storey 2BR with indoor-outdoor flow and courtyard',
  'Farmhouse 3BR with mudroom, pantry, large kitchen island, wrap porch',
]

type Step = 'idle' | 'floorplan' | 'spec' | 'materials' | 'done'

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  floorplan: 'Generating floor plan...',
  spec: 'Extracting 3D architecture...',
  materials: 'Choosing materials...',
  done: 'Done',
}

export function PromptForm() {
  const [prompt, setPrompt] = useState('')
  const { setFloorPlan, setIsGenerating, isGenerating, generationStep, setGenerationStep } = useEditorStore()
  const { setSpecPanelOpen } = useUIStore()
  const { apiKey } = useApiKey()

  const run = async () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)

    try {
      // Call 1: floor plan
      setGenerationStep('floorplan')
      const aiResponse = await generateFloorPlan(prompt, apiKey)
      const floorPlan = aiResponseToFloorPlan(aiResponse)
      floorPlan.prompt = prompt
      setFloorPlan(floorPlan)

      // Call 2: 3D spec
      setGenerationStep('spec')
      const spec = await extract3DSpec(floorPlan, apiKey)
      const fpWithSpec = { ...floorPlan, threeDSpec: spec }
      setFloorPlan(fpWithSpec)

      // Call 3: materials
      setGenerationStep('materials')
      const palette = await getMaterialPalette(fpWithSpec, apiKey)
      setFloorPlan({ ...fpWithSpec, materialPalette: palette })

      setGenerationStep('done')
      setSpecPanelOpen(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationStep('idle'), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-slate-800 bg-slate-950">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run() } }}
            placeholder="Describe your dream house... (e.g. craftsman 3BR open kitchen master ensuite)"
            rows={2}
            className="w-full resize-none rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
        <button
          onClick={run}
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors self-stretch"
        >
          {isGenerating
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Sparkles size={15} />}
          Generate
        </button>
      </div>

      {isGenerating && generationStep !== 'idle' && (
        <div className="flex items-center gap-2 text-xs text-blue-400">
          <span className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          {STEP_LABELS[generationStep]}
        </div>
      )}

      {!isGenerating && (
        <div className="flex gap-2 flex-wrap">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ChevronRight size={10} />
              {ex.slice(0, 40)}...
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
