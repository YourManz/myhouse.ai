import { NextRequest, NextResponse } from 'next/server'
import { generateFloorPlan } from '@/lib/claude'
import { aiResponseToFloorPlan } from '@/lib/floorplan'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    const aiResponse = await generateFloorPlan(prompt)
    const floorPlan = aiResponseToFloorPlan(aiResponse)
    floorPlan.prompt = prompt

    return NextResponse.json({ floorPlan })
  } catch (err) {
    console.error('[generate]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
