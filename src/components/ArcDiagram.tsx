import type { Diagram, RenderArc } from '../types/characterTable'
import { MathCell } from './MathCell'

type ArcDiagramProps = {
  diagram: Diagram
  width?: number
  showRestriction?: boolean
  compact?: boolean
}

type DiagramMetrics = {
  dotRadius: number
  padding: number
  labelHeight: number
  labelWidth: number
  verticalPadding: number
  /** Nudge label box upward (px); negative moves down. */
  labelOffsetY: number
  strokeWidth: number
  labelFontClass: string
  restrictionFontClass: string
}

export function diagramSvgWidthPx(n: number, compact: boolean): number {
  const metrics = getDiagramMetrics(compact)
  const dotSpacing = compact ? 11 : 13
  return metrics.padding * 2 + Math.max(0, n - 1) * dotSpacing
}

function getDiagramMetrics(compact: boolean): DiagramMetrics {
  if (compact) {
    return {
      dotRadius: 3.5,
      padding: 9,
      labelHeight: 10,
      labelWidth: 10,
      verticalPadding: 6,
      labelOffsetY: -1,
      strokeWidth: 1.4,
      labelFontClass: 'text-[9px] [&_.katex]:!text-[9px]',
      restrictionFontClass: 'text-[8px] leading-tight [&_.katex]:!text-[8px]',
    }
  }
  return {
    dotRadius: 4,
    padding: 12,
    labelHeight: 12,
    labelWidth: 12,
    verticalPadding: 8,
    labelOffsetY: 0,
    strokeWidth: 1.75,
    labelFontClass: 'text-[11px]',
    restrictionFontClass: 'text-[9px]',
  }
}

function computeLayout(
  arcs: RenderArc[],
  dotX: (index: number) => number,
  metrics: DiagramMetrics,
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

  const labelOverhang = metrics.labelHeight / 2
  const baselineY =
    metrics.verticalPadding +
    labelOverhang +
    maxAboveRadius +
    metrics.dotRadius
  const height =
    baselineY +
    maxBelowRadius +
    metrics.dotRadius +
    metrics.verticalPadding +
    labelOverhang

  return { baselineY, height }
}

export function ArcDiagram({
  diagram,
  width = 120,
  showRestriction = true,
  compact = false,
}: ArcDiagramProps) {
  const { n, arcs, restriction } = diagram
  const metrics = getDiagramMetrics(compact)
  const usableWidth = width - metrics.padding * 2
  const dotSpacing = n > 1 ? usableWidth / (n - 1) : 0
  const dotX = (index: number) => metrics.padding + index * dotSpacing
  const { baselineY, height } = computeLayout(arcs, dotX, metrics)

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
            metrics={metrics}
            compact={compact}
          />
        ))}

        {Array.from({ length: n }, (_, i) => (
          <circle
            key={i}
            cx={dotX(i)}
            cy={baselineY}
            r={metrics.dotRadius}
            fill="#1e293b"
          />
        ))}
      </svg>

      {showRestriction && restriction && (
        <div
          className={`mx-auto max-w-full min-w-0 overflow-hidden whitespace-nowrap text-center text-slate-600 ${compact ? 'w-max px-0' : 'w-full px-0.5'} ${metrics.restrictionFontClass}`}
          title={restriction}
        >
          <MathCell latex={restriction} compact={compact} />
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
  labelWidth: number,
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

  const gapHalfWidth = labelWidth / 2
  const gapHalfAngle = Math.min(gapHalfWidth / radius, Math.PI / 5)
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
  metrics,
  compact,
}: {
  arc: RenderArc
  x1: number
  x2: number
  baselineY: number
  metrics: DiagramMetrics
  compact: boolean
}) {
  const { leftPathD, rightPathD, midX, apexY } = arcGeometry(
    x1,
    x2,
    baselineY,
    arc.position,
    metrics.labelWidth,
  )
  const isNonzero = arc.position === 'above'
  const title = `a_{${arc.from},${arc.to}} ${isNonzero ? '\\neq 0' : '\\in \\mathbb{F}_q'}`

  const labelLatex = arcLabelToLatex(arc.label)
  const labelY =
    apexY - metrics.labelHeight / 2 + metrics.labelOffsetY
  const strokeProps = {
    fill: 'none' as const,
    stroke: isNonzero ? '#2563eb' : '#64748b',
    strokeWidth: metrics.strokeWidth,
  }

  return (
    <g>
      <title>{title}</title>
      <path d={leftPathD} {...strokeProps} />
      <path d={rightPathD} {...strokeProps} />
      <foreignObject
        x={midX - metrics.labelWidth / 2}
        y={labelY}
        width={metrics.labelWidth}
        height={metrics.labelHeight}
        className="overflow-visible"
      >
        <div className="flex h-full items-center justify-center leading-none">
          <MathCell
            latex={labelLatex}
            compact={compact}
            className={metrics.labelFontClass}
          />
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
  compact = false,
}: {
  diagram: Diagram
  columnWidth?: number
  compact?: boolean
}) {
  const diagramWidth = compact
    ? diagramSvgWidthPx(diagram.n, true)
    : Math.max(72, columnWidth - 8)
  const pad = compact ? 'px-1 py-1' : 'px-1 py-1'
  return (
    <div className={`flex w-full min-w-0 flex-col items-center ${pad}`}>
      <ArcDiagram diagram={diagram} width={diagramWidth} compact={compact} />
    </div>
  )
}
