import { NextRequest, NextResponse } from 'next/server'
import { getMaterialPalette } from '@/lib/claude'
import type { FloorPlan } from '@/types/floorplan'

export async function POST(req: NextRequest) {
  try {
    const { floorPlan } = await req.json() as { floorPlan: FloorPlan }
    if (!floorPlan) {
      return NextResponse.json({ error: 'floorPlan required' }, { status: 400 })
    }

    const palette = await getMaterialPalette(floorPlan)
    return NextResponse.json({ palette })
  } catch (err) {
    console.error('[materials]', err)
    return NextResponse.json({ error: 'Material generation failed' }, { status: 500 })
  }
}
