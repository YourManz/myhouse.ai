'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Check, X, MessageSquare } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { useApiKey } from '@/components/ApiKeyGate'
import { chatWithDesign } from '@/lib/claude-client'
import type { ChatMessage } from '@/lib/claude-client'
import type { FloorPlan } from '@/types/floorplan'

interface DisplayMessage {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  proposedFloorPlanJson?: string
}

const STARTERS = [
  "What's the total square footage?",
  'How are the bedrooms oriented?',
  'Make the kitchen bigger',
  'Add a mudroom near the garage',
  'Explain the roof design',
]

export function DesignChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { floorPlan, setFloorPlan } = useEditorStore()
  const { apiKey } = useApiKey()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const appendToLast = useCallback((chunk: string) => {
    setMessages(prev => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { ...last, text: last.text + chunk }
      }
      return copy
    })
  }, [])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || busy || !floorPlan) return
    setInput('')
    setBusy(true)

    const userMsg: DisplayMessage = { role: 'user', text: content }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', text: '', streaming: true }])

    const history: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.text })),
      { role: 'user', content },
    ]

    try {
      const result = await chatWithDesign(history, floorPlan, apiKey, appendToLast)
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          text: result.text,
          streaming: false,
          proposedFloorPlanJson: result.proposedFloorPlanJson,
        }
        return copy
      })
    } catch (err) {
      console.error(err)
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', text: 'Something went wrong — try again.' }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  const applyEdit = (json: string, msgIdx: number) => {
    try {
      const fp = JSON.parse(json) as FloorPlan
      setFloorPlan(fp)
      setMessages(prev => {
        const copy = [...prev]
        copy[msgIdx] = { ...copy[msgIdx], proposedFloorPlanJson: undefined }
        return copy
      })
    } catch {
      console.error('Failed to parse proposed floor plan')
    }
  }

  const dismissEdit = (msgIdx: number) => {
    setMessages(prev => {
      const copy = [...prev]
      copy[msgIdx] = { ...copy[msgIdx], proposedFloorPlanJson: undefined }
      return copy
    })
  }

  if (!floorPlan) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 p-6 text-center">
        <MessageSquare size={24} className="text-slate-700" />
        <p className="text-xs text-slate-600">Generate a floor plan first to start chatting with your design.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[11px] text-slate-600 font-mono px-1">Ask about your design:</p>
            {STARTERS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[88%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600/25 border border-blue-600/30 text-blue-100'
                : 'bg-slate-800/60 border border-slate-700/40 text-slate-200'
            }`}>
              {msg.text || (msg.streaming && <span className="inline-block w-2 h-3 bg-sky-400 ml-0.5 align-middle animate-pulse" />)}
              {msg.streaming && msg.text && <span className="inline-block w-2 h-3 bg-sky-400 ml-0.5 align-middle animate-pulse" />}
            </div>

            {msg.proposedFloorPlanJson && (
              <div className="max-w-[88%] flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-700/40 bg-emerald-950/20 text-xs text-emerald-300">
                <span className="flex-1">Floor plan edit ready</span>
                <button
                  onClick={() => applyEdit(msg.proposedFloorPlanJson!, i)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/40 transition-colors"
                >
                  <Check size={11} /> Apply
                </button>
                <button
                  onClick={() => dismissEdit(i)}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about your design…"
            disabled={busy}
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
