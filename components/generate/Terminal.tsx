'use client'
import { useEffect, useRef } from 'react'

interface TerminalProps {
  text: string
  title: string
}

function colorizeLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let i = 0
  while (i < line.length) {
    // JSON key
    const keyMatch = line.slice(i).match(/^("[\w\s_-]+")\s*:/)
    if (keyMatch) {
      parts.push(<span key={`k${i}`} className="text-sky-400">{keyMatch[1]}</span>)
      parts.push(<span key={`kc${i}`} className="text-slate-600">: </span>)
      i += keyMatch[0].length
      continue
    }
    // String value
    const strMatch = line.slice(i).match(/^"((?:[^"\\]|\\.)*)"/)
    if (strMatch) {
      parts.push(<span key={`s${i}`} className="text-emerald-400">"{strMatch[1]}"</span>)
      i += strMatch[0].length
      continue
    }
    // Number
    const numMatch = line.slice(i).match(/^-?\d+(\.\d+)?/)
    if (numMatch) {
      parts.push(<span key={`n${i}`} className="text-amber-400">{numMatch[0]}</span>)
      i += numMatch[0].length
      continue
    }
    // Boolean / null
    const boolMatch = line.slice(i).match(/^(true|false|null)/)
    if (boolMatch) {
      parts.push(<span key={`b${i}`} className="text-violet-400">{boolMatch[0]}</span>)
      i += boolMatch[0].length
      continue
    }
    const ch = line[i]
    if ('{}[]'.includes(ch)) {
      parts.push(<span key={`br${i}`} className="text-slate-500">{ch}</span>)
    } else if (ch === ',') {
      parts.push(<span key={`cm${i}`} className="text-slate-600">{ch}</span>)
    } else {
      parts.push(<span key={`o${i}`} className="text-slate-400">{ch}</span>)
    }
    i++
  }
  return <>{parts}</>
}

export function Terminal({ text, title }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text])

  const lines = text.split('\n')
  // Show last 40 lines, older ones fade out
  const WINDOW = 40
  const visible = lines.slice(-WINDOW)
  const isEmpty = text.trim() === ''

  return (
    <div className="flex flex-col h-full border border-white/8 rounded-xl overflow-hidden bg-[#070d14]">
      {/* macOS-style title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-[#0a1420] shrink-0">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
        <span className="flex-1 text-center text-xs text-slate-600 font-mono truncate">
          {title}
        </span>
        <div className="w-12" />
      </div>

      {/* Stream content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-5 select-text"
      >
        {isEmpty ? (
          <div className="text-slate-700">
            Connecting to Claude
            <span className="inline-block w-2 h-3 bg-sky-500 ml-0.5 align-middle animate-pulse" />
          </div>
        ) : (
          visible.map((line, idx) => {
            const age = visible.length - 1 - idx
            const opacity =
              age === 0 ? 1
              : age < 4 ? 0.85
              : age < 12 ? 0.55
              : age < 24 ? 0.3
              : 0.15
            const isLast = idx === visible.length - 1
            return (
              <div
                key={idx}
                className="whitespace-pre-wrap break-all transition-opacity duration-500"
                style={{ opacity }}
              >
                {line === '' ? '\u00a0' : colorizeLine(line)}
                {isLast && (
                  <span className="inline-block w-2 h-3 bg-sky-400 ml-0.5 align-middle animate-pulse" />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Line count footer */}
      {!isEmpty && (
        <div className="px-4 py-1.5 border-t border-white/5 bg-[#0a1420] shrink-0">
          <span className="text-[10px] text-slate-700 font-mono">{lines.length} lines</span>
        </div>
      )}
    </div>
  )
}
