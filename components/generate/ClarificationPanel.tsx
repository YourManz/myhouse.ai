'use client'
import { X } from 'lucide-react'
import type { ClarifyQuestion } from '@/lib/claude-client'

interface ClarificationPanelProps {
  questions: ClarifyQuestion[]
  answers: Record<string, string>
  onAnswer: (id: string, value: string) => void
  onDismiss: () => void
}

export function ClarificationPanel({ questions, answers, onAnswer, onDismiss }: ClarificationPanelProps) {
  if (questions.length === 0) return null

  return (
    <div className="flex flex-col gap-3 px-4 pb-3 border-b border-slate-800 bg-slate-950 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-mono">
          <span className="text-blue-400">›</span> A few quick details will help Claude design this better
        </p>
        <button
          onClick={onDismiss}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          title="Skip clarification"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {questions.map(q => (
          <div key={q.id} className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">{q.question}</label>
            {q.type === 'select' && q.options ? (
              <div className="flex flex-wrap gap-1.5">
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => onAnswer(q.id, selected ? '' : opt)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        selected
                          ? 'bg-blue-600/30 border border-blue-500/60 text-blue-300'
                          : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={e => onAnswer(q.id, e.target.value)}
                placeholder={q.placeholder ?? ''}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
