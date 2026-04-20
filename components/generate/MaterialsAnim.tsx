'use client'
import { useEffect, useState } from 'react'

// The finished house gets painted surface by surface.
// Reuses the same isometric projection as HouseBuildAnim.

const ISO_SCALE = 14
const ISO_ORIGIN = { x: 160, y: 60 }
const W = 10, D = 8, H = 3, RIDGE_H = H + 2.2

function iso(gx: number, gy: number, gz: number = 0) {
  return {
    x: ISO_ORIGIN.x + (gx - gy) * ISO_SCALE,
    y: ISO_ORIGIN.y + (gx + gy) * ISO_SCALE * 0.5 - gz * ISO_SCALE * 0.85,
  }
}

function pts(...coords: [number, number, number][]) {
  return coords.map(([x, y, z]) => iso(x, y, z)).map(p => `${p.x},${p.y}`).join(' ')
}

interface Surface {
  id: string
  points: string
  wireColor: string
  matColor: string
  matLabel: string
  delay: number
}

const SURFACES: Surface[] = [
  {
    id: 'roofLeft',
    points: pts([0,0,H],[0,D,H],[W/2,D,RIDGE_H],[W/2,0,RIDGE_H]),
    wireColor: '#1e3a5f',
    matColor: '#7c3f2b',
    matLabel: 'Cedar Shake',
    delay: 0,
  },
  {
    id: 'roofRight',
    points: pts([W,0,H],[W,D,H],[W/2,D,RIDGE_H],[W/2,0,RIDGE_H]),
    wireColor: '#162d4a',
    matColor: '#6b3524',
    matLabel: 'Cedar Shake',
    delay: 200,
  },
  {
    id: 'wallFront',
    points: pts([0,D,0],[W,D,0],[W,D,H],[0,D,H]),
    wireColor: '#243b55',
    matColor: '#c4a882',
    matLabel: 'Limestone',
    delay: 600,
  },
  {
    id: 'wallLeft',
    points: pts([0,0,0],[0,D,0],[0,D,H],[0,0,H]),
    wireColor: '#172d4a',
    matColor: '#a8956e',
    matLabel: 'Limestone',
    delay: 800,
  },
  {
    id: 'wallRight',
    points: pts([W,0,0],[W,D,0],[W,D,H],[W,0,H]),
    wireColor: '#172d4a',
    matColor: '#a8956e',
    matLabel: 'Limestone',
    delay: 1000,
  },
  {
    id: 'slab',
    points: pts([0,0,0],[W,0,0],[W,D,0],[0,D,0]),
    wireColor: '#1e293b',
    matColor: '#4a4a4a',
    matLabel: 'Concrete Slab',
    delay: 1400,
  },
]

const MATERIAL_CHIPS = [
  { color: '#7c3f2b', label: 'Cedar Shake',   desc: 'Roof',     delay: 300  },
  { color: '#c4a882', label: 'Limestone',      desc: 'Exterior', delay: 900  },
  { color: '#5c4a3a', label: 'Oak Hardwood',   desc: 'Floors',   delay: 1500 },
  { color: '#e8e0d8', label: 'Warm White',     desc: 'Interior', delay: 1800 },
  { color: '#2c4a6e', label: 'Steel Brushed',  desc: 'Windows',  delay: 2100 },
]

export function MaterialsAnim() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => {
      const e = Date.now() - start
      setElapsed(Math.min(e, 2800))
      if (e > 2800) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 320 220"
        className="w-full h-full max-w-[380px] max-h-[280px]"
        style={{ filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.2))' }}
      >
        <defs>
          {/* Paint sweep gradient for each surface */}
          {SURFACES.map(s => (
            <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={s.matColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={s.matColor} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>

        <rect width="320" height="220" fill="#050d1a" rx="4" />

        {/* Ground shadow */}
        <ellipse
          cx={ISO_ORIGIN.x}
          cy={ISO_ORIGIN.y + D * ISO_SCALE * 0.5 + 4}
          rx={W * ISO_SCALE * 0.8}
          ry={D * ISO_SCALE * 0.25}
          fill="rgba(0,0,0,0.4)"
        />

        {/* Render surfaces — transition from wireframe to material */}
        {SURFACES.map(s => {
          const matProgress = elapsed > s.delay
            ? Math.min(1, (elapsed - s.delay) / 500)
            : 0
          return (
            <g key={s.id}>
              {/* Wireframe base */}
              <polygon
                points={s.points}
                fill={s.wireColor}
                stroke="#2d5986"
                strokeWidth="0.8"
              />
              {/* Material overlay sweeping in */}
              {matProgress > 0 && (
                <polygon
                  points={s.points}
                  fill={`url(#grad-${s.id})`}
                  stroke={s.matColor}
                  strokeWidth="0.5"
                  opacity={matProgress}
                />
              )}
            </g>
          )
        })}

        {/* Windows (always on top) */}
        {elapsed > 1200 && (
          <g opacity={Math.min(1, (elapsed - 1200) / 300)}>
            <polygon
              points={pts([1.5,D,1],[3,D,1],[3,D,2.2],[1.5,D,2.2])}
              fill="rgba(147,197,253,0.35)"
              stroke="#60a5fa"
              strokeWidth="0.7"
            />
            <polygon
              points={pts([6,D,1],[8,D,1],[8,D,2.2],[6,D,2.2])}
              fill="rgba(147,197,253,0.35)"
              stroke="#60a5fa"
              strokeWidth="0.7"
            />
            <polygon
              points={pts([4,D,0],[5.5,D,0],[5.5,D,2],[4,D,2])}
              fill="rgba(147,197,253,0.2)"
              stroke="#93c5fd"
              strokeWidth="0.8"
            />
          </g>
        )}

        {/* Ridge line */}
        {(() => {
          const p1 = iso(W/2, 0, RIDGE_H)
          const p2 = iso(W/2, D, RIDGE_H)
          return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
        })()}

        {/* Gables */}
        <polygon points={pts([0,0,H],[W,0,H],[W/2,0,RIDGE_H])} fill="transparent" stroke="#2d5986" strokeWidth="0.6" />
        <polygon points={pts([0,D,H],[W,D,H],[W/2,D,RIDGE_H])} fill="transparent" stroke="#2d5986" strokeWidth="0.6" />

        {/* Material chip legend — bottom */}
        {MATERIAL_CHIPS.map((chip, i) => {
          const opacity = elapsed > chip.delay ? Math.min(1, (elapsed - chip.delay) / 300) : 0
          const x = 12 + i * 58
          if (opacity === 0) return null
          return (
            <g key={chip.label} opacity={opacity}>
              <rect x={x} y="192" width="8" height="8" rx="1.5" fill={chip.color} />
              <text x={x + 10} y="198" fontSize="5.5" fill="rgba(203,213,225,0.8)" fontFamily="ui-monospace, monospace">
                {chip.label}
              </text>
              <text x={x + 10} y="204" fontSize="4.5" fill="rgba(148,163,184,0.5)" fontFamily="ui-monospace, monospace">
                {chip.desc}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
