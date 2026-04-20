import type { FloorPlan } from '@/types/floorplan'

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportDXF(floorPlan: FloorPlan): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Drawing = require('dxf-writer')
  const d = new Drawing()
  d.setUnits('Feet')

  d.addLayer('Walls',    Drawing.ACI.WHITE,  'CONTINUOUS')
  d.addLayer('Rooms',    Drawing.ACI.CYAN,   'CONTINUOUS')
  d.addLayer('Labels',   Drawing.ACI.YELLOW, 'CONTINUOUS')

  const s = floorPlan.scale

  for (const floor of floorPlan.floors) {
    // Walls as lines
    d.setActiveLayer('Walls')
    for (const wall of floor.walls) {
      const sv = floor.vertices[wall.startVertex]
      const ev = floor.vertices[wall.endVertex]
      if (!sv || !ev) continue
      // DXF Y is up; screen Y is down — flip by negating
      d.drawLine(sv.x / s, -(sv.y / s), ev.x / s, -(ev.y / s))
    }

    // Room outlines as polylines + labels
    for (const room of floor.rooms) {
      const pts = room.vertices.map(i => floor.vertices[i]).filter(Boolean)
      if (pts.length < 3) continue

      d.setActiveLayer('Rooms')
      // Draw closed polyline
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length]
        d.drawLine(a.x / s, -(a.y / s), b.x / s, -(b.y / s))
      }

      // Label at centroid
      d.setActiveLayer('Labels')
      const cx = pts.reduce((sum, p) => sum + p.x / s, 0) / pts.length
      const cy = pts.reduce((sum, p) => sum + p.y / s, 0) / pts.length
      d.drawText(cx - room.label.length * 0.15, -cy, 0.4, 0, room.label)
    }
  }

  download(d.toDxfString(), `${floorPlan.title || 'house'}.dxf`)
}
