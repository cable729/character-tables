import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Diagram, RenderArc } from '../types/characterTable'
import {
  arcGeometry,
  arcKey,
  arcLabelToLatex,
  computeEditableDiagramLayout,
  editorDiagramWidth,
  getDiagramMetrics,
  suggestArcLabel,
} from '../diagram/arcGeometry'
import { dragPositionFromY } from '../diagram/utils'
import { MathCell } from './MathCell'

const DOT_HIT_RADIUS = 16
/** Fraction of inter-dot spacing used as horizontal snap half-width. */
const SNAP_X_FRACTION = 0.2
const ARC_HIT_STROKE_WIDTH = 14

type EditableArcDiagramProps = {
  diagram: Diagram
  onDiagramChange: (diagram: Diagram) => void
  width?: number
  showArcLabels?: boolean
  showExpansionCountField?: boolean
  expansionCount?: string
  onExpansionCountChange?: (value: string) => void
}

type DragState = {
  from: number
  endX: number
  endDot: number | null
  svgY: number
  pointerId: number
}

const RESTRICTION_PRESETS = [
  { label: '\\neg(a=b=0)', value: '\\neg(a=b=0)' },
  { label: '\\neg(a=c=0)', value: '\\neg(a=c=0)' },
]

export function EditableArcDiagram({
  diagram,
  onDiagramChange,
  width: widthProp,
  showArcLabels = true,
  showExpansionCountField = false,
  expansionCount,
  onExpansionCountChange,
}: EditableArcDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { n, arcs, restriction } = diagram
  const width = widthProp ?? editorDiagramWidth(n)
  const metrics = getDiagramMetrics(false)
  const { baselineY, height, dotX } = useMemo(
    () => computeEditableDiagramLayout(n, width, metrics, showArcLabels),
    [n, width, metrics, showArcLabels],
  )

  const snapHalfWidth = useMemo(() => {
    if (n <= 1) {
      return width * 0.1
    }
    return (dotX(1) - dotX(0)) * SNAP_X_FRACTION
  }, [n, dotX, width])

  const [drag, setDrag] = useState<DragState | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const arcsRef = useRef(arcs)
  arcsRef.current = arcs
  const diagramRef = useRef(diagram)
  diagramRef.current = diagram

  const svgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: clientX, y: clientY }
      const rect = svg.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    [width, height],
  )

  /** Snap to nearest dot by horizontal distance only. */
  const snapDotByX = useCallback(
    (x: number, excludeFrom?: number): number | null => {
      let bestIndex: number | null = null
      let bestDist = snapHalfWidth + 1
      for (let i = 0; i < n; i++) {
        const index = i + 1
        if (excludeFrom != null && index === excludeFrom) {
          continue
        }
        const dist = Math.abs(x - dotX(i))
        if (dist <= snapHalfWidth && dist < bestDist) {
          bestDist = dist
          bestIndex = index
        }
      }
      return bestIndex
    },
    [n, dotX, snapHalfWidth],
  )

  const updateArcs = (nextArcs: RenderArc[]) => {
    onDiagramChange({ ...diagram, arcs: nextArcs })
  }

  const replaceArcAtKey = (key: string, arc: RenderArc) => {
    const newKey = arcKey(arc)
    const next = [
      ...arcs.filter((a) => arcKey(a) !== key && arcKey(a) !== newKey),
      arc,
    ]
    updateArcs(next)
    setSelectedKey(newKey)
  }

  const finishDrag = useCallback(
    (state: DragState, clientX: number, clientY: number) => {
      const pt = svgPoint(clientX, clientY)
      const snapped = snapDotByX(pt.x, state.from)
      const to = snapped ?? state.endDot
      const position = dragPositionFromY(pt.y, baselineY)
      if (to != null && to !== state.from) {
        const currentArcs = arcsRef.current
        const label = suggestArcLabel(currentArcs)
        const arc: RenderArc = {
          from: state.from,
          to,
          label,
          position,
        }
        const key = arcKey(arc)
        onDiagramChange({
          ...diagramRef.current,
          arcs: [...currentArcs.filter((a) => arcKey(a) !== key), arc],
        })
        setSelectedKey(arcKey(arc))
      }
      setDrag(null)
      try {
        svgRef.current?.releasePointerCapture(state.pointerId)
      } catch {
        /* capture may already be released */
      }
    },
    [svgPoint, snapDotByX, baselineY, onDiagramChange],
  )

  const updateDragFromPointer = useCallback(
    (clientX: number, clientY: number, prev: DragState): DragState => {
      const pt = svgPoint(clientX, clientY)
      const snapped = snapDotByX(pt.x, prev.from)
      let endX = pt.x
      let endDot: number | null = null

      if (snapped != null) {
        endDot = snapped
        endX = dotX(snapped - 1)
      } else {
        endX = Math.max(metrics.padding, Math.min(width - metrics.padding, pt.x))
      }

      return {
        ...prev,
        endX,
        endDot,
        svgY: pt.y,
      }
    },
    [svgPoint, dotX, snapDotByX, metrics.padding, width],
  )

  useEffect(() => {
    if (!drag) return

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      setDrag((prev) => (prev ? updateDragFromPointer(e.clientX, e.clientY, prev) : null))
    }

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      finishDrag(drag, e.clientX, e.clientY)
    }

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      setDrag(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [drag, finishDrag, updateDragFromPointer])

  const dragPreview =
    drag != null
      ? {
          x1: dotX(drag.from - 1),
          x2: drag.endX,
          position: dragPositionFromY(drag.svgY, baselineY),
        }
      : null

  const selectedArc = selectedKey
    ? arcs.find((a) => arcKey(a) === selectedKey) ?? null
    : null

  const renderArcAtEndpoints = (
    x1: number,
    x2: number,
    position: 'above' | 'below',
    opts: { preview?: boolean; arc?: RenderArc },
  ) => {
    const labelWidth =
      showArcLabels && opts.arc?.label.trim() ? metrics.labelWidth : 0
    const { pathD, leftPathD, rightPathD, midX, apexY } = arcGeometry(
      x1,
      x2,
      baselineY,
      position,
      labelWidth,
    )
    const isSelected =
      !opts.preview && opts.arc != null && arcKey(opts.arc) === selectedKey
    const stroke = opts.preview
      ? position === 'above'
        ? '#60a5fa'
        : '#94a3b8'
      : position === 'above'
        ? '#2563eb'
        : '#64748b'
    const strokeWidth = isSelected ? 3 : metrics.strokeWidth
    const segments = pathD
      ? [pathD]
      : [leftPathD, rightPathD].filter(Boolean)

    const onArcClick = opts.preview
      ? undefined
      : (e: React.MouseEvent) => {
          if (opts.arc) {
            e.stopPropagation()
            setSelectedKey(arcKey(opts.arc))
          }
        }

    const key = opts.arc
      ? arcKey(opts.arc)
      : `preview-${x1}-${x2}-${position}`

    return (
      <g key={key}>
        {!opts.preview &&
          segments.map((d, si) => (
            <path
              key={`hit-${si}`}
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={ARC_HIT_STROKE_WIDTH}
              pointerEvents="stroke"
              className="cursor-pointer"
              onClick={onArcClick}
            />
          ))}
        {segments.map((d, si) => (
          <path
            key={`vis-${si}`}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opts.preview ? 0.9 : 1}
            pointerEvents="none"
          />
        ))}
        {showArcLabels && !opts.preview && opts.arc?.label.trim() && (
          <foreignObject
            x={midX - metrics.labelWidth / 2}
            y={apexY - metrics.labelHeight / 2 + metrics.labelOffsetY}
            width={metrics.labelWidth}
            height={metrics.labelHeight}
            className="pointer-events-none overflow-visible"
          >
            <div className="flex h-full items-center justify-center leading-none">
              <MathCell
                latex={arcLabelToLatex(opts.arc.label)}
                className={metrics.labelFontClass}
              />
            </div>
          </foreignObject>
        )}
      </g>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex justify-center">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="touch-none overflow-visible rounded border border-slate-200 bg-white"
          onClick={() => setSelectedKey(null)}
        >
          {arcs.map((arc) =>
            renderArcAtEndpoints(
              dotX(arc.from - 1),
              dotX(arc.to - 1),
              arc.position,
              { arc },
            ),
          )}
          {dragPreview &&
            renderArcAtEndpoints(
              dragPreview.x1,
              dragPreview.x2,
              dragPreview.position,
              { preview: true },
            )}

          {Array.from({ length: n }, (_, i) => {
            const index = i + 1
            return (
              <circle
                key={i}
                cx={dotX(i)}
                cy={baselineY}
                r={DOT_HIT_RADIUS}
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const pt = svgPoint(e.clientX, e.clientY)
                  svgRef.current?.setPointerCapture(e.pointerId)
                  setDrag({
                    from: index,
                    endX: dotX(i),
                    endDot: null,
                    svgY: pt.y,
                    pointerId: e.pointerId,
                  })
                  setSelectedKey(null)
                }}
              />
            )
          })}

          {Array.from({ length: n }, (_, i) => (
            <circle
              key={`dot-${i}`}
              cx={dotX(i)}
              cy={baselineY}
              r={metrics.dotRadius}
              fill={
                drag?.from === i + 1 || drag?.endDot === i + 1
                  ? '#0f172a'
                  : '#1e293b'
              }
              className="pointer-events-none"
            />
          ))}
        </svg>
      </div>

      {selectedArc && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="mb-2 font-medium text-slate-700">
            Arc {selectedArc.from}–{selectedArc.to} ({selectedArc.position})
          </p>
          <label className="mb-2 block">
            <span className="text-xs text-slate-500">Label (LaTeX)</span>
            <input
              type="text"
              value={selectedArc.label}
              onChange={(e) => {
                replaceArcAtKey(arcKey(selectedArc), {
                  ...selectedArc,
                  label: e.target.value,
                })
              }}
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${
                selectedArc.position === 'above'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
              onClick={() =>
                replaceArcAtKey(arcKey(selectedArc), {
                  ...selectedArc,
                  position: 'above',
                })
              }
            >
              Above (nonzero)
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${
                selectedArc.position === 'below'
                  ? 'bg-slate-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
              onClick={() =>
                replaceArcAtKey(arcKey(selectedArc), {
                  ...selectedArc,
                  position: 'below',
                })
              }
            >
              Below
            </button>
          </div>
          <button
            type="button"
            className="text-xs text-red-600 hover:underline"
            onClick={() => {
              setDrag(null)
              updateArcs(arcs.filter((a) => arcKey(a) !== arcKey(selectedArc)))
              setSelectedKey(null)
            }}
          >
            Delete arc
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600">
          Restriction (LaTeX)
        </label>
        <input
          type="text"
          value={restriction ?? ''}
          onChange={(e) =>
            onDiagramChange({
              ...diagram,
              restriction: e.target.value || undefined,
            })
          }
          placeholder="e.g. \\neg(a=b=0)"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
        />
        {restriction?.trim() ? (
          <div
            className={`mt-2 rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-center text-slate-600 ${metrics.restrictionFontClass}`}
          >
            <MathCell latex={restriction} />
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          {RESTRICTION_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
              onClick={() =>
                onDiagramChange({ ...diagram, restriction: p.value })
              }
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
            onClick={() =>
              onDiagramChange({ ...diagram, restriction: undefined })
            }
          >
            Clear
          </button>
        </div>
        {restriction?.trim() && showExpansionCountField && (
          <label className="mt-2 block">
            <span className="text-xs text-slate-500">expansionCount (required)</span>
            <input
              type="text"
              value={expansionCount ?? ''}
              onChange={(e) => onExpansionCountChange?.(e.target.value)}
              placeholder="(q^2-1)(q-1)"
              className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
            />
          </label>
        )}
      </div>
    </div>
  )
}
