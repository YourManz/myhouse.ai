'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { KeyRound, ExternalLink, Eye, EyeOff, Home } from 'lucide-react'

const STORAGE_KEY = 'myhouse_anthropic_key'

interface ApiKeyContextValue {
  apiKey: string
  clearKey: () => void
}

const ApiKeyContext = createContext<ApiKeyContextValue>({ apiKey: '', clearKey: () => {} })

export function useApiKey() {
  return useContext(ApiKeyContext)
}

export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setApiKey(stored ?? '')
    setMounted(true)
  }, [])

  const save = async () => {
    const trimmed = input.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key must start with sk-ant-')
      return
    }
    setValidating(true)
    setError('')
    try {
      // Quick validation: try a tiny request
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: trimmed, dangerouslyAllowBrowser: true })
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }],
      })
      localStorage.setItem(STORAGE_KEY, trimmed)
      setApiKey(trimmed)
    } catch {
      setError('Invalid key or API error — double-check and try again.')
    } finally {
      setValidating(false)
    }
  }

  const clearKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setInput('')
  }

  // Don't render until mounted (avoids SSG hydration mismatch)
  if (!mounted) return null

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100 tracking-tight">myhouse.ai</div>
              <div className="text-xs text-slate-500">AI-Powered Architectural CAD</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-200">Enter your Anthropic API Key</h2>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Your key runs entirely in your browser — it is never sent to any server other than Anthropic directly.
              It is saved to <code className="text-slate-400 bg-slate-800 px-1 rounded">localStorage</code> on this device only.
            </p>

            <div className="relative mb-3">
              <input
                type={show ? 'text' : 'password'}
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && save()}
                placeholder="sk-ant-api03-..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 pr-10 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            <button
              onClick={save}
              disabled={validating || !input.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {validating
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Validating...</>
                : 'Start Designing'}
            </button>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-1 text-xs text-slate-600">
              <ExternalLink size={10} />
              <a
                href="https://console.anthropic.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-400 transition-colors"
              >
                Get an API key at console.anthropic.com
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-700 mt-4">
            Calls cost ~$0.01–0.05 per design (3 × claude-sonnet-4-6 calls)
          </p>
        </div>
      </div>
    )
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, clearKey }}>
      {children}
    </ApiKeyContext.Provider>
  )
}
