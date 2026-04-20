'use client'
import { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { GridLayer } from './GridLayer'
import { RoomLayer } from './RoomLayer'
import { WallLayer } from './WallLayer'
import { ElementLayer } from './ElementLayer'
import { useEditorStore } from '@/store/useEditorStore'
import type { FloorPlan } from '@/types/floorplan'

const MIN_SCALE = 0.3
const MAX_SCALE = 5

interface FloorPlanEditorProps {
  width: number
  height: number
}

export function FloorPlanEditor({ width, height }: FloorPlanEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const {
    floorPlan, activeFloor, activeTool, selectedIds,
    setSelectedIds, clearSelection, canvasTransform, setCanvasTransform,
    updateFloorPlan, pushHistory,
  } = useEditorStore()

  const floor = activeFloor()

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const store = useEditorStore.getState()
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.shiftKey ? store.redo() : store.undo()
      }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) store.redo()
      if (e.key === 'Escape') store.clearSelection()
      if (e.key === 'v') store.setActiveTool('select')
      if (e.key === 'r') store.setActiveTool('room')
      if (e.key === 'w') store.setActiveTool('wall')
      if (e.key === 'd') store.setActiveTool('door')
      if (e.key === 'n') store.setActiveTool('window')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Zoom on wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = canvasTransform.scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.08
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, MAX_SCALE)
      : Math.max(oldScale / scaleBy, MIN_SCALE)

    const mousePointTo = {
      x: (pointer.x - canvasTransform.x) / oldScale,
      y: (pointer.y - canvasTransform.y) / oldScale,
    }

    setCanvasTransform({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [canvasTransform, setCanvasTransform])

  const handleRoomMove = useCallback((roomId: string, dx: number, dy: number) => {
    if (!floorPlan) return
    pushHistory()
    updateFloorPlan(fp => {
      const floors = fp.floors.map(f => {
        if (f.id !== useEditorStore.getState().activeFloorId) return f
        const room = f.rooms.find(r => r.id === roomId)
        if (!room) return f

        // Move all unique vertices belonging to this room
        const movedSet = new Set<number>()
        const newVertices = [...f.vertices]

        for (const vIdx of room.vertices) {
          if (!movedSet.has(vIdx)) {
            movedSet.add(vIdx)
            newVertices[vIdx] = {
              x: newVertices[vIdx].x + dx,
              y: newVertices[vIdx].y + dy,
            }
          }
        }

        return { ...f, vertices: newVertices }
      })
      return { ...fp, floors }
    })
  }, [floorPlan, pushHistory, updateFloorPlan])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      clearSelection()
    }
  }, [clearSelection])

  if (!floor || !floorPlan) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
        Generate a floor plan to begin editing
      </div>
    )
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={canvasTransform.x}
      y={canvasTransform.y}
      scaleX={canvasTransform.scale}
      scaleY={canvasTransform.scale}
      draggable={activeTool === 'pan'}
      onDragEnd={e => {
        setCanvasTransform({ x: e.target.x(), y: e.target.y() })
      }}
      onWheel={handleWheel}
      onClick={handleStageClick}
      style={{ cursor: activeTool === 'pan' ? 'grab' : 'default' }}
    >
      <GridLayer
        width={width}
        height={height}
        scale={floorPlan.scale}
        offsetX={canvasTransform.x}
        offsetY={canvasTransform.y}
        stageScale={canvasTransform.scale}
      />
      <RoomLayer
        floor={floor}
        activeTool={activeTool}
        selectedIds={selectedIds}
        onSelect={id => setSelectedIds([id])}
        onRoomMove={handleRoomMove}
      />
      <WallLayer
        floor={floor}
        activeTool={activeTool}
        selectedIds={selectedIds}
        onSelect={id => setSelectedIds([id])}
        scale={floorPlan.scale}
      />
      <ElementLayer floor={floor} />
    </Stage>
  )
}
