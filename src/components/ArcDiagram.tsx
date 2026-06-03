import type { Diagram, RenderArc } from '../types/characterTable'
import { MathCell } from './MathCell'

type ArcDiagramProps = {
  diagram: Diagram
  width?: number
  showRestriction?: boolean
  compact?: boolean
}

const DOT_RADIUS = 4
const PADDING = 12
const LABEL_HEIGHT = 12
const LABEL_WIDTH = 12
const LABEL_ARC_GAP = 0
const VERTICAL_PADDING = 8

function computeLayout(
  arcs: RenderArc[],
  dotX: (index: number) => number,
): { baselineY: number; height: number } {
  let maxAboveRadius = 0
  let maxBelowRadius = 0

  for (const arc of arcs) {
    const span = Math.abs(dotX(arc.to - 1) - dotX(arc.from - 1))
    const radius = span / 2
    if (arc.position === 'above') {
      maxAboveRadius = Math.max(maxAboveRadius, radius)
    } else {
      maxBelowRadius = Math.max(maxBelowRadius, radius)
    }
  }

  const labelOverhang = LABEL_HEIGHT / 2
  const baselineY =
    VERTICAL_PADDING + labelOverhang + maxAboveRadius + DOT_RADIUS
  const height =
    baselineY + maxBelowRadius + DOT_RADIUS + VERTICAL_PADDING + labelOverhang

  return { baselineY, height }
}

export function ArcDiagram({
  diagram,
  width = 120,
  showRestriction = true,
  compact = false,
}: ArcDiagramProps) {
  const { n, arcs, restriction } = diagram
  const usableWidth = width - PADDING * 2
  const dotSpacing = n > 1 ? usableWidth / (n - 1) : 0
  const dotX = (index: number) => PADDING + index * dotSpacing
  const { baselineY, height } = computeLayout(arcs, dotX)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={`Diagram with ${n} nodes and ${arcs.length} arcs`}
      >
        {arcs.map((arc, i) => (
          <ArcPath
            key={`${arc.from}-${arc.to}-${arc.label}-${arc.position}-${i}`}
            arc={arc}
            x1={dotX(arc.from - 1)}
            x2={dotX(arc.to - 1)}
            baselineY={baselineY}
          />
        ))}

        {Array.from({ length: n }, (_, i) => (
          <circle
            key={i}
            cx={dotX(i)}
            cy={baselineY}
            r={DOT_RADIUS}
            fill="#1e293b"
          />
        ))}
      </svg>

      {showRestriction && restriction && !compact && (
        <div
          className="w-full min-w-0 overflow-hidden whitespace-nowrap px-0.5 text-center text-[9px] text-slate-600"
          title={restriction}
        >
          <MathCell latex={restriction} />
        </div>
      )}
    </div>
  )
}

function pointOnCircle(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

function arcGeometry(
  x1: number,
  x2: number,
  baselineY: number,
  position: 'above' | 'below',
): {
  leftPathD: string
  rightPathD: string
  midX: number
  apexY: number
} {
  const leftX = Math.min(x1, x2)
  const rightX = Math.max(x1, x2)
  const span = rightX - leftX
  const midX = (leftX + rightX) / 2

  if (span === 0) {
    return { leftPathD: '', rightPathD: '', midX, apexY: baselineY }
  }

  const radius = span / 2
  const above = position === 'above'
  const cx = midX
  const cy = baselineY
  const apexAngle = above ? -Math.PI / 2 : Math.PI / 2
  const apex = pointOnCircle(cx, cy, radius, apexAngle)
  const sweep = above ? 1 : 0

  const gapHalfWidth = LABEL_WIDTH / 2 + LABEL_ARC_GAP
  const gapHalfAngle = Math.min(gapHalfWidth / radius, Math.PI / 5)
  // Along-path gap: above arcs sweep upward (π → −π/2 → 0); below sweep downward
  // (π → π/2 → 0), so the “before apex” / “after apex” angles flip for below.
  const gapStartAngle = apexAngle + (above ? -gapHalfAngle : gapHalfAngle)
  const gapEndAngle = apexAngle + (above ? gapHalfAngle : -gapHalfAngle)
  const gapStart = pointOnCircle(cx, cy, radius, gapStartAngle)
  const gapEnd = pointOnCircle(cx, cy, radius, gapEndAngle)

  const leftPathD = `M ${leftX} ${baselineY} A ${radius} ${radius} 0 0 ${sweep} ${gapStart.x} ${gapStart.y}`
  const rightPathD = `M ${gapEnd.x} ${gapEnd.y} A ${radius} ${radius} 0 0 ${sweep} ${rightX} ${baselineY}`

  return { leftPathD, rightPathD, midX, apexY: apex.y }
}

function ArcPath({
  arc,
  x1,
  x2,
  baselineY,
}: {
  arc: RenderArc
  x1: number
  x2: number
  baselineY: number
}) {
  const { leftPathD, rightPathD, midX, apexY } = arcGeometry(
    x1,
    x2,
    baselineY,
    arc.position,
  )
  const isNonzero = arc.position === 'above'
  const title = `a_{${arc.from},${arc.to}} ${isNonzero ? '\\neq 0' : '\\in \\mathbb{F}_q'}`

  const labelLatex = arcLabelToLatex(arc.label)
  const labelY = apexY - LABEL_HEIGHT / 2
  const strokeProps = {
    fill: 'none' as const,
    stroke: isNonzero ? '#2563eb' : '#64748b',
    strokeWidth: 1.75,
  }

  return (
    <g>
      <title>{title}</title>
      <path d={leftPathD} {...strokeProps} />
      <path d={rightPathD} {...strokeProps} />
      <foreignObject
        x={midX - LABEL_WIDTH / 2}
        y={labelY}
        width={LABEL_WIDTH}
        height={LABEL_HEIGHT}
        className="overflow-visible"
      >
        <div className="flex h-full items-center justify-center text-[11px] leading-none">
          <MathCell latex={labelLatex} />
        </div>
      </foreignObject>
    </g>
  )
}

function arcLabelToLatex(label: string): string {
  if (label.startsWith('\\')) {
    return label
  }
  if (label.length === 1 && /[a-zA-Z]/.test(label)) {
    return label
  }
  if (/^[a-z]+$/.test(label)) {
    return `\\${label}`
  }
  return label
}

export function RowColHeader({
  diagram,
  columnWidth = 84,
}: {
  diagram: Diagram
  columnWidth?: number
}) {
  const diagramWidth = Math.max(72, columnWidth - 8)
  return (
    <div className="flex w-full min-w-0 flex-col items-center px-1 py-1">
      <ArcDiagram diagram={diagram} width={diagramWidth} />
    </div>
  )
}
