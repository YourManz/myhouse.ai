'use client'
import { useEffect, useState } from 'react'

// Isometric house assembling from a flat floor plan.
// SVG using isometric projection: x' = x - y, y' = (x + y) * 0.5
// All source coords in a 10×8 "grid" unit space, then projected.

const ISO_SCALE = 14
const ISO_ORIGIN = { x: 160, y: 60 }

function iso(gx: number, gy: number, gz: number = 0): { x: number; y: number } {
  return {
    x: ISO_ORIGIN.x + (gx - gy) * ISO_SCALE,
    y: ISO_ORIGIN.y + (gx + gy) * ISO_SCALE * 0.5 - gz * ISO_SCALE * 0.85,
  }
}

function pts(...coords: [number, number, number][]) {
  return coords.map(([x, y, z]) => iso(x, y, z)).map(p => `${p.x},${p.y}`).join(' ')
}

// House footprint: 10×8 grid units
// Walls: 3 units tall
const W = 10, D = 8, H = 3

// Roof peak in the centre of the long axis
const RIDGE_H = H + 2.2

const COMPONENTS = [
  // 1. Ground slab
  {
    id: 'slab',
    delay: 0,
    duration: 400,
    element: () => (
      <polygon
        points={pts([0,0,0],[W,0,0],[W,D,0],[0,D,0])}
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
    ),
  },
  // 2. Floor plan lines on slab
  {
    id: 'plan',
    delay: 500,
    duration: 300,
    element: () => (
      <g stroke="#60a5fa" strokeWidth="0.5" opacity="0.5">
        <line {...lineIso(4, 0, 0, 4, D, 0)} />
        <line {...lineIso(0, 5, 0, W, 5, 0)} />
        <line {...lineIso(7, 5, 0, 7, D, 0)} />
      </g>
    ),
  },
  // 3. Back left wall (far face)
  {
    id: 'wallBack',
    delay: 900,
    duration: 500,
    element: () => (
      <polygon
        points={pts([0,0,0],[W,0,0],[W,0,H],[0,0,H])}
        fill="#1e3a5f"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 4. Back right wall
  {
    id: 'wallRight',
    delay: 1100,
    duration: 500,
    element: () => (
      <polygon
        points={pts([W,0,0],[W,D,0],[W,D,H],[W,0,H])}
        fill="#172d4a"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 5. Front left wall
  {
    id: 'wallLeft',
    delay: 1200,
    duration: 500,
    element: () => (
      <polygon
        points={pts([0,0,0],[0,D,0],[0,D,H],[0,0,H])}
        fill="#172d4a"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 6. Front face wall (near face)
  {
    id: 'wallFront',
    delay: 1400,
    duration: 500,
    element: () => (
      <polygon
        points={pts([0,D,0],[W,D,0],[W,D,H],[0,D,H])}
        fill="#243b55"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 7. Windows — front face
  {
    id: 'windows',
    delay: 2000,
    duration: 300,
    element: () => (
      <g>
        {/* window left */}
        <polygon
          points={pts([1.5,D,1],[3,D,1],[3,D,2.2],[1.5,D,2.2])}
          fill="rgba(147,197,253,0.25)"
          stroke="#60a5fa"
          strokeWidth="0.7"
        />
        {/* window right */}
        <polygon
          points={pts([6,D,1],[8,D,1],[8,D,2.2],[6,D,2.2])}
          fill="rgba(147,197,253,0.25)"
          stroke="#60a5fa"
          strokeWidth="0.7"
        />
        {/* door */}
        <polygon
          points={pts([4,D,0],[5.5,D,0],[5.5,D,2],[4,D,2])}
          fill="rgba(147,197,253,0.15)"
          stroke="#93c5fd"
          strokeWidth="0.8"
        />
      </g>
    ),
  },
  // 8. Gable left end triangle
  {
    id: 'gableLeft',
    delay: 2400,
    duration: 400,
    element: () => (
      <polygon
        points={pts([0,0,H],[W,0,H],[W/2,0,RIDGE_H])}
        fill="#1a3b6b"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 9. Gable right end triangle
  {
    id: 'gableRight',
    delay: 2500,
    duration: 400,
    element: () => (
      <polygon
        points={pts([0,D,H],[W,D,H],[W/2,D,RIDGE_H])}
        fill="#243b55"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 10. Roof left slope
  {
    id: 'roofLeft',
    delay: 2700,
    duration: 500,
    element: () => (
      <polygon
        points={pts([0,0,H],[0,D,H],[W/2,D,RIDGE_H],[W/2,0,RIDGE_H])}
        fill="#1e3a5f"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 11. Roof right slope
  {
    id: 'roofRight',
    delay: 2900,
    duration: 500,
    element: () => (
      <polygon
        points={pts([W,0,H],[W,D,H],[W/2,D,RIDGE_H],[W/2,0,RIDGE_H])}
        fill="#162d4a"
        stroke="#2d5986"
        strokeWidth="0.8"
      />
    ),
  },
  // 12. Chimney
  {
    id: 'chimney',
    delay: 3400,
    duration: 300,
    element: () => (
      <g>
        <polygon points={pts([7,2,H+1],[8,2,H+1],[8,2,RIDGE_H+0.8],[7,2,RIDGE_H+0.8])} fill="#1e293b" stroke="#334155" strokeWidth="0.7" />
        <polygon points={pts([7,2,RIDGE_H+0.8],[8,2,RIDGE_H+0.8],[8,3,RIDGE_H+0.8],[7,3,RIDGE_H+0.8])} fill="#243b55" stroke="#334155" strokeWidth="0.5" />
      </g>
    ),
  },
]

function lineIso(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  const p1 = iso(x1, y1, z1)
  const p2 = iso(x2, y2, z2)
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
}

export function HouseBuildAnim() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => {
      const e = Date.now() - start
      setElapsed(e < 4200 ? e : 4200) // hold at end
      if (e > 4200) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 320 220"
        className="w-full h-full max-w-[380px] max-h-[280px]"
        style={{ filter: 'drop-shadow(0 0 20px rgba(96,165,250,0.2))' }}
      >
        <rect width="320" height="220" fill="#050d1a" rx="4" />

        {/* Subtle ground shadow */}
        {elapsed > 200 && (
          <ellipse
            cx={ISO_ORIGIN.x}
            cy={ISO_ORIGIN.y + D * ISO_SCALE * 0.5 + 4}
            rx={W * ISO_SCALE * 0.8}
            ry={D * ISO_SCALE * 0.25}
            fill="rgba(0,0,0,0.4)"
            opacity={Math.min(1, (elapsed - 200) / 400)}
          />
        )}

        {/* Render components in order, fading each in */}
        {COMPONENTS.map(comp => {
          const opacity = elapsed > comp.delay
            ? Math.min(1, (elapsed - comp.delay) / comp.duration)
            : 0
          if (opacity === 0) return null
          return (
            <g key={comp.id} opacity={opacity}>
              {comp.element()}
            </g>
          )
        })}

        {/* Ridge line highlight */}
        {elapsed > 3000 && (() => {
          const p1 = iso(W/2, 0, RIDGE_H)
          const p2 = iso(W/2, D, RIDGE_H)
          return (
            <line
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#60a5fa"
              strokeWidth="1"
              opacity={Math.min(0.7, (elapsed - 3000) / 400)}
            />
          )
        })()}

        {/* Label */}
        {elapsed > 3800 && (
          <text
            x="16" y="200"
            fontSize="7"
            fill="rgba(96,165,250,0.5)"
            fontFamily="ui-monospace, monospace"
            opacity={Math.min(1, (elapsed - 3800) / 300)}
          >
            GABLE ROOF · 7:12 PITCH · 24&quot; OVERHANG
          </text>
        )}
      </svg>
    </div>
  )
}
