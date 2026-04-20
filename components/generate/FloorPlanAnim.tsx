'use client'
import { useEffect, useState } from 'react'

// Preset simple floor plan — independent of the actual prompt
// 5 rooms: living, kitchen, bedroom×2, bathroom
// All coordinates in a 200×160 viewBox

const GRID_SIZE = 10
const ROOMS = [
  { id: 'living',   x: 10,  y: 10,  w: 80, h: 80,  label: 'Living',   color: 'rgba(96,165,250,0.12)',  delay: 0    },
  { id: 'kitchen',  x: 90,  y: 10,  w: 60, h: 50,  label: 'Kitchen',  color: 'rgba(251,191,36,0.12)',  delay: 400  },
  { id: 'dining',   x: 90,  y: 60,  w: 60, h: 30,  label: 'Dining',   color: 'rgba(167,243,208,0.12)', delay: 700  },
  { id: 'bed1',     x: 10,  y: 90,  w: 60, h: 60,  label: 'Bedroom',  color: 'rgba(196,181,253,0.12)', delay: 1000 },
  { id: 'bath',     x: 70,  y: 90,  w: 40, h: 30,  label: 'Bath',     color: 'rgba(125,211,252,0.12)', delay: 1300 },
  { id: 'bed2',     x: 110, y: 90,  w: 40, h: 60,  label: 'Bed 2',    color: 'rgba(196,181,253,0.12)', delay: 1600 },
]

// Walls as individual line segments — each animates in sequence
const WALLS = [
  // Outer perimeter
  { x1: 10,  y1: 10,  x2: 150, y2: 10,  delay: 0   },
  { x1: 150, y1: 10,  x2: 150, y2: 150, delay: 150  },
  { x1: 150, y1: 150, x2: 10,  y2: 150, delay: 300  },
  { x1: 10,  y1: 150, x2: 10,  y2: 10,  delay: 450  },
  // Interior vertical — living / kitchen split
  { x1: 90,  y1: 10,  x2: 90,  y2: 90,  delay: 650  },
  // Interior horizontal — living / bed split
  { x1: 10,  y1: 90,  x2: 150, y2: 90,  delay: 800  },
  // Kitchen / dining split
  { x1: 90,  y1: 60,  x2: 150, y2: 60,  delay: 950  },
  // Bath / bed2 vertical
  { x1: 110, y1: 90,  x2: 110, y2: 150, delay: 1100 },
  // Bath bottom
  { x1: 70,  y1: 90,  x2: 70,  y2: 120, delay: 1200 },
  { x1: 70,  y1: 120, x2: 110, y2: 120, delay: 1300 },
]

// Door arcs — appear after walls
const DOORS = [
  { cx: 10, cy: 50, r: 20, startAngle: -90, endAngle: 0,   delay: 1500 }, // living west
  { cx: 90, cy: 70, r: 15, startAngle: 180, endAngle: 90,  delay: 1600 }, // kitchen
  { cx: 40, cy: 90, r: 15, startAngle: 90,  endAngle: 0,   delay: 1700 }, // bedroom 1
  { cx: 75, cy: 90, r: 12, startAngle: 90,  endAngle: 180, delay: 1800 }, // bath
]

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = { x: cx + r * Math.cos((startDeg * Math.PI) / 180), y: cy + r * Math.sin((startDeg * Math.PI) / 180) }
  const end   = { x: cx + r * Math.cos((endDeg   * Math.PI) / 180), y: cy + r * Math.sin((endDeg   * Math.PI) / 180) }
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${large},1 ${end.x},${end.y} Z`
}

function wallLength(w: typeof WALLS[0]) {
  return Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2)
}

export function FloorPlanAnim() {
  const [tick, setTick] = useState(0)

  // Drive animation with a simple interval
  useEffect(() => {
    const t = setInterval(() => setTick(n => (n + 1) % 2400), 50)
    return () => clearInterval(t)
  }, [])

  const elapsed = tick * 50

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Blueprint grid background */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[340px] max-h-[280px] drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 0 24px rgba(96,165,250,0.2))' }}
      >
        <defs>
          {/* Blueprint paper */}
          <pattern id="grid" x="0" y="0" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="0.4" />
          </pattern>
          <pattern id="gridMajor" x="0" y="0" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="rgba(96,165,250,0.22)" strokeWidth="0.6" />
          </pattern>
          <clipPath id="planClip">
            <rect x="0" y="0" width="200" height="200" />
          </clipPath>
        </defs>

        {/* Background */}
        <rect width="200" height="200" fill="#050d1a" rx="4" />
        <rect width="200" height="200" fill="url(#grid)" rx="4" />
        <rect width="200" height="200" fill="url(#gridMajor)" rx="4" />

        {/* Room fills — fade in after walls */}
        {ROOMS.map(room => (
          <rect
            key={room.id}
            x={room.x} y={room.y} width={room.w} height={room.h}
            fill={room.color}
            opacity={elapsed > room.delay + 400 ? Math.min(1, (elapsed - room.delay - 400) / 300) : 0}
          />
        ))}

        {/* Wall segments — draw in sequence */}
        {WALLS.map((wall, i) => {
          const len = wallLength(wall)
          const progress = elapsed > wall.delay
            ? Math.min(1, (elapsed - wall.delay) / 300)
            : 0
          const dashOffset = len * (1 - progress)
          return (
            <line
              key={i}
              x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
              stroke="#93c5fd"
              strokeWidth="1.5"
              strokeDasharray={len}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          )
        })}

        {/* Door arcs */}
        {DOORS.map((door, i) => {
          const opacity = elapsed > door.delay ? Math.min(1, (elapsed - door.delay) / 200) : 0
          return (
            <path
              key={i}
              d={arcPath(door.cx, door.cy, door.r, door.startAngle, door.endAngle)}
              fill="rgba(147,197,253,0.15)"
              stroke="#60a5fa"
              strokeWidth="0.8"
              opacity={opacity}
            />
          )
        })}

        {/* Room labels */}
        {ROOMS.map(room => {
          const opacity = elapsed > room.delay + 700 ? Math.min(1, (elapsed - room.delay - 700) / 300) : 0
          return (
            <text
              key={`label-${room.id}`}
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + 3}
              textAnchor="middle"
              fontSize="6"
              fill="rgba(147,197,253,0.8)"
              opacity={opacity}
              fontFamily="ui-monospace, monospace"
            >
              {room.label}
            </text>
          )
        })}

        {/* Dimension lines */}
        {elapsed > 2000 && (
          <>
            <line x1="10" y1="158" x2="150" y2="158" stroke="rgba(96,165,250,0.4)" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x="80" y="164" textAnchor="middle" fontSize="4.5" fill="rgba(96,165,250,0.6)" fontFamily="ui-monospace, monospace">
              46&apos;-0&quot;
            </text>
          </>
        )}

        {/* Title block */}
        <text x="155" y="170" fontSize="4" fill="rgba(96,165,250,0.4)" fontFamily="ui-monospace, monospace">FLOOR PLAN</text>
        <text x="155" y="176" fontSize="3.5" fill="rgba(96,165,250,0.3)" fontFamily="ui-monospace, monospace">GROUND FL.</text>
        <text x="155" y="182" fontSize="3" fill="rgba(96,165,250,0.25)" fontFamily="ui-monospace, monospace">1:100</text>

        {/* Animated cursor dot */}
        {elapsed < 1900 && (() => {
          const activeWall = WALLS.reduce((acc, w, i) =>
            elapsed > w.delay && elapsed < w.delay + 350 ? i : acc, -1)
          if (activeWall < 0) return null
          const w = WALLS[activeWall]
          const progress = Math.min(1, (elapsed - w.delay) / 300)
          return (
            <circle
              cx={w.x1 + (w.x2 - w.x1) * progress}
              cy={w.y1 + (w.y2 - w.y1) * progress}
              r="2"
              fill="#60a5fa"
              opacity="0.9"
            >
              <animate attributeName="opacity" values="1;0.4;1" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )
        })()}
      </svg>
    </div>
  )
}
