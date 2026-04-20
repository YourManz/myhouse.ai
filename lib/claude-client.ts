'use client'
import Anthropic from '@anthropic-ai/sdk'
import type { AIFloorPlanResponse, FloorPlan, ThreeDSpec, MaterialPalette } from '@/types/floorplan'

function getClient(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const FLOOR_PLAN_SYSTEM = `You are myhouse.ai, an expert residential architect.
When given a description of a house, generate a structured floor plan JSON object.
Respond with ONLY valid JSON — no markdown, no code fences, no explanation.

Rules:
- Room bounding boxes must NOT overlap (check x,y,width,depth)
- Adjacent rooms must share an exact edge (bounding boxes touch precisely)
- List shared rooms in adjacentTo arrays on both sides
- Min sizes: bedroom 10x10ft, bathroom 5x8ft, kitchen 10x12ft, living 12x14ft
- Every bathroom: toilet + sink + (shower or bathtub) elements
- Every kitchen: sink + kitchen-counter elements
- Every floor needs hallway or stairwell connections
- Ground floor: must include kitchen, living, at least one bathroom
- Bedrooms on upper floor for multi-storey, ground floor for single-storey
- lotWidth and lotDepth must comfortably contain all rooms with 2ft margin on all sides
- Place door-single on every room, window-standard on all exterior walls
- Include stair-straight on every floor if more than one floor

Respond with this exact JSON shape:
{
  "title": string,
  "description": string,
  "style": string,
  "lotWidth": number,
  "lotDepth": number,
  "floors": [{
    "level": number,
    "label": string,
    "ceilingHeightFt": number,
    "rooms": [{
      "type": string,
      "label": string,
      "x": number,
      "y": number,
      "width": number,
      "depth": number,
      "adjacentTo": string[]
    }],
    "elements": [{
      "type": string,
      "attachedToRoom": string,
      "wallSide": "north"|"south"|"east"|"west",
      "positionPercent": number,
      "widthInches": number
    }]
  }]
}`

const THREE_D_SPEC_SYSTEM = `You are a senior architectural designer specialising in 3D building design.
Given a floor plan JSON, propose a ThreeDSpec — 3D architectural decisions that make the building visually interesting and stylistically coherent.
Respond with ONLY valid JSON — no markdown, no code fences.

For each cutout, ceiling override, and feature: include a short "rationale".
Set all "enabled" fields to true.
Match roof type and features to the architectural style.

Examples by style:
- craftsman: gable 7:12, 24" overhang, front dormer, exposed-beams in living
- contemporary: butterfly or flat roof, double-height-void in entry, clerestory
- farmhouse: gable 8:12, wraparound-porch, exposed-beams, large overhangs
- colonial: hip 6:12, symmetrical dormers, chimney
- mediterranean: flat with parapet, courtyard-void if U-shape

Respond with this exact JSON shape:
{
  "roof": {
    "type": string,
    "pitch": number,
    "overhang": number,
    "ridgeDirection": "ns"|"ew"|null,
    "subRoofs": null
  },
  "cutouts": [{
    "id": string,
    "type": string,
    "targetFloor": number,
    "targetWallId": null,
    "geometry": {"x": number, "y": number, "width": number, "depth": number, "heightStart": number, "heightEnd": number, "shape": "rect"|"arch"|"triangle"},
    "enabled": true,
    "rationale": string
  }],
  "ceilingOverrides": [{
    "roomId": string,
    "type": string,
    "height": number,
    "peakHeight": null|number,
    "enabled": true
  }],
  "features": [{
    "id": string,
    "type": string,
    "location": string,
    "geometry": {"x": number, "y": number, "width": number, "depth": number, "height": number},
    "enabled": true,
    "rationale": string
  }],
  "rationale": string
}`

const MATERIALS_SYSTEM = `You are an interior and exterior design specialist.
Given a floor plan and architectural style, recommend a MaterialPalette — a mapping of surfaces to PBR textures.
Respond with ONLY valid JSON — no markdown, no code fences.

Available texture IDs:
- Wood: oak-hardwood, maple-hardwood, walnut-hardwood, pine-plank, cedar-siding, shiplap-white
- Stone: marble-white, slate-grey, limestone-beige, travertine
- Tile: subway-tile-white, subway-tile-grey, hex-tile-white, terracotta-tile, porcelain-large
- Concrete: concrete-polished, concrete-raw, concrete-white
- Brick: brick-red, brick-white, brick-grey
- Metal: steel-brushed, copper-aged, zinc-standing-seam
- Paint: paint-warm-white, paint-charcoal, paint-sage, paint-navy, paint-terracotta

Match materials to architectural style and room function. Set all "enabled" to true.

Respond with this exact JSON shape:
{
  "surfaces": [{
    "target": string,
    "roomTypes": null|string[],
    "texture": {
      "id": string,
      "label": string,
      "category": string,
      "color": string,
      "repeat": [number, number]
    },
    "rationale": string,
    "enabled": true
  }]
}`

const SUGGEST_SYSTEM = `You are myhouse.ai. Given lifestyle preferences, generate 3 distinct house prompt descriptions.
Each should be a single rich sentence a user would type into a house design tool — specific, evocative, architectural.
Vary the suggestions meaningfully (different styles, layouts, or features).
Respond with ONLY valid JSON — no markdown, no code fences.

Respond with this exact JSON shape:
{
  "suggestions": [
    { "label": string, "prompt": string },
    { "label": string, "prompt": string },
    { "label": string, "prompt": string }
  ]
}`

export interface PromptSuggestion {
  label: string
  prompt: string
}

export async function suggestPrompts(
  lifestyle: Record<string, string>,
  apiKey: string,
): Promise<PromptSuggestion[]> {
  const client = getClient(apiKey)
  const content = Object.entries(lifestyle)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SUGGEST_SYSTEM,
    messages: [{ role: 'user', content }],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(clean) as { suggestions: PromptSuggestion[] }
  return parsed.suggestions
}

const CLARIFY_SYSTEM = `You are myhouse.ai. Analyze the user's house description prompt and decide if key details are missing.
Return 0–3 clarifying questions ONLY for genuinely missing info. If the prompt is already detailed, return an empty array.
Respond with ONLY valid JSON — no markdown, no code fences.

Question types:
- "select": provide 4–6 options array
- "text": free-form answer with a placeholder

Focus on: bedroom/bathroom count, architectural style, lot size, must-have features, budget tier.
Never ask about things already mentioned in the prompt.

Respond with this exact JSON shape:
{
  "needsClarification": boolean,
  "questions": [{
    "id": string,
    "question": string,
    "type": "select"|"text",
    "options": string[]|null,
    "placeholder": string|null
  }]
}`

export interface ClarifyQuestion {
  id: string
  question: string
  type: 'select' | 'text'
  options: string[] | null
  placeholder: string | null
}

export interface ClarifyResponse {
  needsClarification: boolean
  questions: ClarifyQuestion[]
}

export async function clarifyPrompt(
  prompt: string,
  apiKey: string,
): Promise<ClarifyResponse> {
  const client = getClient(apiKey)
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: CLARIFY_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as ClarifyResponse
}

type ChunkCallback = (chunk: string) => void

async function streamCall<T>(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  onChunk?: ChunkCallback,
): Promise<T> {
  if (onChunk) {
    const stream = client.messages.stream(params as Anthropic.MessageStreamParams)
    stream.on('text', (text) => onChunk(text))
    const msg = await stream.finalMessage()
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean) as T
  } else {
    const message = await client.messages.create(params)
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean) as T
  }
}

export async function generateFloorPlan(
  prompt: string,
  apiKey: string,
  onChunk?: ChunkCallback,
): Promise<AIFloorPlanResponse> {
  const client = getClient(apiKey)
  return streamCall<AIFloorPlanResponse>(client, {
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: FLOOR_PLAN_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  }, onChunk)
}

export async function extract3DSpec(
  floorPlan: FloorPlan,
  apiKey: string,
  onChunk?: ChunkCallback,
): Promise<ThreeDSpec> {
  const client = getClient(apiKey)
  return streamCall<ThreeDSpec>(client, {
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: THREE_D_SPEC_SYSTEM,
    messages: [{
      role: 'user',
      content: `Architectural style: ${floorPlan.style ?? 'modern'}
Original prompt: ${floorPlan.prompt ?? ''}
Floors: ${JSON.stringify(floorPlan.floors.map(f => ({ level: f.level, label: f.label, rooms: f.rooms.map(r => ({ id: r.id, type: r.type, label: r.label })) })), null, 2)}`,
    }],
  }, onChunk)
}

const CHAT_SYSTEM = `You are myhouse.ai's design assistant. The user is viewing a floor plan they generated.
Answer questions about the design clearly and concisely.

When the user asks to MODIFY the floor plan (resize rooms, add rooms, change layout, etc.):
1. Explain what you're changing and why in plain text
2. Then wrap the COMPLETE modified floor plan JSON in [EDIT] and [/EDIT] tags

Important edit rules:
- Return the ENTIRE FloorPlan JSON (all floors, rooms, walls, elements)
- Keep all unchanged data exactly as-is
- Only modify what the user asked for
- Maintain room adjacency rules (touching rooms must share exact edges)

If the user is just asking a question (area, style, features), respond with plain text only — no [EDIT] tags.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResult {
  text: string
  proposedFloorPlanJson?: string
}

export async function chatWithDesign(
  messages: ChatMessage[],
  floorPlan: object,
  apiKey: string,
  onChunk?: ChunkCallback,
): Promise<ChatResult> {
  const client = getClient(apiKey)
  const systemWithContext = `${CHAT_SYSTEM}

Current floor plan JSON:
${JSON.stringify(floorPlan, null, 2)}`

  let fullText = ''
  if (onChunk) {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemWithContext,
      messages,
    } as Anthropic.MessageStreamParams)
    stream.on('text', (text) => { fullText += text; onChunk(text) })
    await stream.finalMessage()
  } else {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemWithContext,
      messages,
    })
    fullText = msg.content[0].type === 'text' ? msg.content[0].text : ''
  }

  // Extract [EDIT]...[/EDIT] block if present
  const editMatch = fullText.match(/\[EDIT\]([\s\S]*?)\[\/EDIT\]/)
  if (editMatch) {
    const clean = editMatch[1].replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const displayText = fullText.replace(/\[EDIT\][\s\S]*?\[\/EDIT\]/, '').trim()
    return { text: displayText, proposedFloorPlanJson: clean }
  }

  return { text: fullText }
}

export async function getMaterialPalette(
  floorPlan: FloorPlan,
  apiKey: string,
  onChunk?: ChunkCallback,
): Promise<MaterialPalette> {
  const client = getClient(apiKey)
  return streamCall<MaterialPalette>(client, {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: MATERIALS_SYSTEM,
    messages: [{
      role: 'user',
      content: `Style: ${floorPlan.style ?? 'modern'}
Room types: ${[...new Set(floorPlan.floors.flatMap(f => f.rooms.map(r => r.type)))].join(', ')}
Roof type: ${floorPlan.threeDSpec?.roof.type ?? 'unknown'}`,
    }],
  }, onChunk)
}
