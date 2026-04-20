'use client'
import { Layer, Line } from 'react-konva'

interface GridLayerProps {
  width: number
  height: number
  scale: number     // px per foot
  offsetX: number
  offsetY: number
  stageScale: number
}

export function GridLayer({ width, height, scale, offsetX, offsetY, stageScale }: GridLayerProps) {
  const lines: React.ReactElement[] = []
  const gridSize = scale // 1 grid cell = 1 foot
  const majorEvery = 5  // thicker line every 5 feet

  // Start before viewport to handle offset
  const startX = Math.floor(-offsetX / stageScale / gridSize) * gridSize
  const startY = Math.floor(-offsetY / stageScale / gridSize) * gridSize
  const endX = startX + width / stageScale + gridSize * 2
  const endY = startY + height / stageScale + gridSize * 2

  for (let x = startX; x <= endX; x += gridSize) {
    const isMajor = Math.round(x / gridSize) % majorEvery === 0
    lines.push(
      <Line
        key={`vx${x}`}
        points={[x, startY, x, endY]}
        stroke={isMajor ? '#2a2a3a' : '#1a1a28'}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    )
  }

  for (let y = startY; y <= endY; y += gridSize) {
    const isMajor = Math.round(y / gridSize) % majorEvery === 0
    lines.push(
      <Line
        key={`hy${y}`}
        points={[startX, y, endX, y]}
        stroke={isMajor ? '#2a2a3a' : '#1a1a28'}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    )
  }

  return <Layer listening={false}>{lines}</Layer>
}
