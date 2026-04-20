import { NextRequest, NextResponse } from 'next/server'
import { extract3DSpec } from '@/lib/claude'
import type { FloorPlan } from '@/types/floorplan'

export async function POST(req: NextRequest) {
  try {
    const { floorPlan } = await req.json() as { floorPlan: FloorPlan }
    if (!floorPlan) {
      return NextResponse.json({ error: 'floorPlan required' }, { status: 400 })
    }

    const spec = await extract3DSpec(floorPlan)
    return NextResponse.json({ spec })
  } catch (err) {
    console.error('[extract3d]', err)
    return NextResponse.json({ error: '3D extraction failed' }, { status: 500 })
  }
}
