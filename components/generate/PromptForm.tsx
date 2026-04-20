'use client'
import { useState, useCallback } from 'react'
import { Sparkles, ChevronRight, HelpCircle, Wand2 } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { useUIStore } from '@/store/useUIStore'
import { useApiKey } from '@/components/ApiKeyGate'
import { generateFloorPlan, extract3DSpec, getMaterialPalette, clarifyPrompt } from '@/lib/claude-client'
import { saveDesign } from '@/lib/db'
import type { ClarifyQuestion } from '@/lib/claude-client'
import { aiResponseToFloorPlan } from '@/lib/floorplan'
import { GenerationOverlay } from './GenerationOverlay'
import { ClarificationPanel } from './ClarificationPanel'
import { SuggestionPanel } from './SuggestionPanel'
import type { GenStep } from './GenerationOverlay'

const EXAMPLES = [
  'Craftsman 3BR with open kitchen, master ensuite, attached garage, wraparound porch',
  'Modern 2BR flat with open plan living, home office, rooftop terrace',
  'Colonial 4BR, formal dining, home office, 2.5 baths, double garage',
  'Minimalist single-storey 2BR with indoor-outdoor flow and courtyard',
  'Farmhouse 3BR with mudroom, pantry, large kitchen island, wrap porch',
]

export function PromptForm() {
  const [prompt, setPrompt] = useState('')
  const [genStep, setGenStep] = useState<GenStep>('idle')
  const [streamText, setStreamText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isClarifying, setIsClarifying] = useState(false)
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestion[]>([])
  const [clarifyAnswers, setClarifyAnswers] = useState<Record<string, string>>({})
  const { setFloorPlan, isGenerating, setIsGenerating } = useEditorStore()
  const { setSpecPanelOpen } = useUIStore()
  const { apiKey } = useApiKey()

  const appendChunk = useCallback((chunk: string) => {
    setStreamText(prev => prev + chunk)
  }, [])

  function buildEnrichedPrompt() {
    if (clarifyQuestions.length === 0) return prompt
    const answered = clarifyQuestions
      .filter(q => clarifyAnswers[q.id]?.trim())
      .map(q => `${q.question}: ${clarifyAnswers[q.id]}`)
    if (answered.length === 0) return prompt
    return `${prompt}\n\nAdditional details:\n${answered.join('\n')}`
  }

  const handleClarify = async () => {
    if (!prompt.trim() || isClarifying || isGenerating) return
    setIsClarifying(true)
    setClarifyQuestions([])
    setClarifyAnswers({})
    try {
      const result = await clarifyPrompt(prompt, apiKey)
      if (result.needsClarification && result.questions.length > 0) {
        setClarifyQuestions(result.questions)
      } else {
        // Nothing to clarify — go straight to generation
        await runGeneration(prompt)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsClarifying(false)
    }
  }

  const runGeneration = async (enrichedPrompt: string) => {
    if (isGenerating) return
    setIsGenerating(true)
    setStreamText('')

    try {
      setGenStep('floorplan')
      const aiResponse = await generateFloorPlan(enrichedPrompt, apiKey, appendChunk)
      const floorPlan = aiResponseToFloorPlan(aiResponse)
      floorPlan.prompt = enrichedPrompt
      setFloorPlan(floorPlan)

      setGenStep('spec')
      setStreamText('')
      const spec = await extract3DSpec(floorPlan, apiKey, appendChunk)
      const fpWithSpec = { ...floorPlan, threeDSpec: spec }
      setFloorPlan(fpWithSpec)

      setGenStep('materials')
      setStreamText('')
      const palette = await getMaterialPalette(fpWithSpec, apiKey, appendChunk)
      setFloorPlan({ ...fpWithSpec, materialPalette: palette })

      setGenStep('done')
      setSpecPanelOpen(true)
      setClarifyQuestions([])
      setClarifyAnswers({})
      saveDesign({ ...fpWithSpec, materialPalette: palette }).catch(() => {})
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
      setTimeout(() => { setGenStep('idle'); setStreamText('') }, 800)
    }
  }

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    runGeneration(buildEnrichedPrompt())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (clarifyQuestions.length === 0) {
        handleClarify()
      } else {
        handleGenerate()
      }
    }
  }

  const busy = isGenerating || isClarifying

  return (
    <>
      <GenerationOverlay step={genStep} streamingText={streamText} />

      {showSuggestions && (
        <SuggestionPanel
          onSelect={p => { setPrompt(p); setClarifyQuestions([]); setClarifyAnswers({}) }}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      <div className="flex flex-col gap-3 p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              value={prompt}
              onChange={e => { setPrompt(e.target.value); if (clarifyQuestions.length > 0) { setClarifyQuestions([]); setClarifyAnswers({}) } }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your dream house… (e.g. craftsman 3BR open kitchen master ensuite)"
              rows={2}
              className="w-full resize-none rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div className="flex flex-col gap-1.5 self-stretch">
            {/* Inspire / suggestion button */}
            <button
              onClick={() => { setShowSuggestions(v => !v); setClarifyQuestions([]); setClarifyAnswers({}) }}
              disabled={busy}
              title="Answer a few lifestyle questions and get AI-crafted prompt suggestions"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                showSuggestions
                  ? 'bg-violet-700/25 border-violet-500/50 text-violet-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Wand2 size={13} />
              Inspire
            </button>

            {/* Clarify button */}
            <button
              onClick={handleClarify}
              disabled={busy || !prompt.trim() || clarifyQuestions.length > 0}
              title="Ask Claude a few quick questions to refine your prompt"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors border border-slate-700"
            >
              {isClarifying
                ? <span className="w-3 h-3 border border-slate-400/40 border-t-slate-400 rounded-full animate-spin" />
                : <HelpCircle size={13} />}
              Clarify
            </button>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={busy || !prompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isGenerating
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Sparkles size={15} />}
              Generate
            </button>
          </div>
        </div>

        {!busy && (
          <div className="flex gap-2 flex-wrap">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setPrompt(ex); setClarifyQuestions([]); setClarifyAnswers({}) }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronRight size={10} />
                {ex.slice(0, 40)}...
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clarification panel — rendered below the prompt bar */}
      {clarifyQuestions.length > 0 && (
        <ClarificationPanel
          questions={clarifyQuestions}
          answers={clarifyAnswers}
          onAnswer={(id, val) => setClarifyAnswers(prev => ({ ...prev, [id]: val }))}
          onDismiss={() => { setClarifyQuestions([]); setClarifyAnswers({}) }}
        />
      )}
    </>
  )
}
