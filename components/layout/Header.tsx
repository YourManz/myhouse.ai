'use client'
import { Home } from 'lucide-react'

export function Header() {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-slate-950 border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
          <Home size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-slate-100 tracking-tight">myhouse.ai</span>
      </div>
      <span className="text-slate-700">|</span>
      <span className="text-xs text-slate-500">AI-Powered Architectural CAD</span>
    </header>
  )
}
