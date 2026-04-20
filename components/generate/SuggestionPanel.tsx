'use client'
import { useState } from 'react'
import { Wand2, ChevronRight, Loader2 } from 'lucide-react'
import { suggestPrompts } from '@/lib/claude-client'
import type { PromptSuggestion } from '@/lib/claude-client'
import { useApiKey } from '@/components/ApiKeyGate'

interface SuggestionPanelProps {
  onSelect: (prompt: string) => void
  onClose: () => void
}

const LIFESTYLE_QUESTIONS = [
  {
    id: 'household',
    label: "Who's moving in?",
    options: ['Solo', 'Couple', 'Small family', 'Large family', 'Multi-generational'],
  },
  {
    id: 'work',
    label: 'Work from home?',
    options: ['Full-time WFH', 'Hybrid', 'No — just need quiet'],
  },
  {
    id: 'lifestyle',
    label: 'How do you live?',
    options: ['Entertain often', 'Outdoor living', 'Cozy & inward', 'Minimalist', 'Active / sporty'],
  },
  {
    id: 'lot',
    label: 'Lot type?',
    options: ['Urban / narrow', 'Suburban', 'Rural acreage', 'Hillside / sloped', 'Waterfront'],
  },
  {
    id: 'style',
    label: 'Visual style?',
    options: ['Modern', 'Craftsman', 'Farmhouse', 'Colonial', 'Mediterranean', 'Minimalist', 'Scandinavian'],
  },
  {
    id: 'budget',
    label: 'Budget tier?',
    options: ['Modest', 'Mid-range', 'Premium', 'Luxury'],
  },
]

export function SuggestionPanel({ onSelect, onClose }: SuggestionPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { apiKey } = useApiKey()

  const toggle = (id: string, opt: string) => {
    setAnswers(prev => ({ ...prev, [id]: prev[id] === opt ? '' : opt }))
    setSuggestions([])
  }

  const hasAnswers = Object.values(answers).some(v => v)

  const generate = async () => {
    setLoading(true)
    setError('')
    setSuggestions([])
    try {
      const results = await suggestPrompts(answers, apiKey)
      setSuggestions(results)
    } catch {
      setError('Could not generate suggestions — check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b border-slate-800 bg-[#060d19]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 size={13} className="text-violet-400" />
          <span className="text-xs font-mono text-slate-400">Design by lifestyle</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-600 hover:text-slate-400 font-mono transition-colors"
        >
          close
        </button>
      </div>

      {/* Lifestyle questions */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {LIFESTYLE_QUESTIONS.map(q => (
          <div key={q.id} className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-500">{q.label}</span>
            <div className="flex flex-wrap gap-1">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => toggle(q.id, opt)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      selected
                        ? 'bg-violet-600/25 border border-violet-500/50 text-violet-300'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || !hasAnswers}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-md bg-violet-700/30 hover:bg-violet-700/50 border border-violet-600/40 disabled:opacity-40 disabled:cursor-not-allowed text-violet-300 text-xs font-medium transition-colors"
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" />
          : <Wand2 size={13} />}
        {loading ? 'Generating…' : 'Generate suggestions'}
      </button>

      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-slate-600 font-mono">Click a suggestion to use it:</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onSelect(s.prompt); onClose() }}
              className="flex items-start gap-2 text-left px-3 py-2.5 rounded-lg border border-slate-700/50 bg-slate-900/60 hover:border-violet-500/40 hover:bg-slate-800/60 transition-colors group"
            >
              <ChevronRight size={12} className="text-violet-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-violet-400 font-mono">{s.label}</span>
                <span className="text-xs text-slate-300 leading-relaxed">{s.prompt}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
