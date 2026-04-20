'use client'
import type { Floor } from '@/types/floorplan'

interface FloorSelectorProps {
  floors: Floor[]
  activeFloorId: string | null
  onSelect: (id: string) => void
}

const levelLabel = (level: number) => {
  if (level === -1) return 'B'
  if (level === 0) return 'G'
  return `L${level}`
}

export function FloorSelector({ floors, activeFloorId, onSelect }: FloorSelectorProps) {
  const sorted = [...floors].sort((a, b) => b.level - a.level)

  return (
    <div className="flex flex-col gap-1 p-2">
      {sorted.map(floor => (
        <button
          key={floor.id}
          onClick={() => onSelect(floor.id)}
          className={`
            w-10 h-10 rounded text-xs font-bold transition-colors
            ${activeFloorId === floor.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}
          `}
          title={floor.label}
        >
          {levelLabel(floor.level)}
        </button>
      ))}
    </div>
  )
}
