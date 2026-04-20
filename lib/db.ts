'use client'
import Dexie, { type Table } from 'dexie'
import type { FloorPlan } from '@/types/floorplan'

export interface SavedDesign {
  id?: number
  title: string
  prompt: string
  timestamp: number
  floorPlanJson: string
}

class MyhouseDb extends Dexie {
  designs!: Table<SavedDesign>

  constructor() {
    super('myhouse')
    this.version(1).stores({
      designs: '++id, timestamp',
    })
  }
}

let _db: MyhouseDb | null = null

function db(): MyhouseDb {
  if (!_db) _db = new MyhouseDb()
  return _db
}

export async function saveDesign(floorPlan: FloorPlan): Promise<number> {
  return db().designs.add({
    title: floorPlan.title || 'Untitled',
    prompt: floorPlan.prompt || '',
    timestamp: Date.now(),
    floorPlanJson: JSON.stringify(floorPlan),
  })
}

export async function loadDesigns(): Promise<SavedDesign[]> {
  return db().designs.orderBy('timestamp').reverse().toArray()
}

export async function deleteDesign(id: number): Promise<void> {
  return db().designs.delete(id)
}
