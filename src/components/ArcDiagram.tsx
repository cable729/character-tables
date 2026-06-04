import type { Diagram, RenderArc } from '../types/characterTable'
import {
  arcGeometry,
  arcLabelToLatex,
  computeDiagramLayout,
  createDotX,
  diagramSvgWidthPx,
  getDiagramMetrics,
} from '../diagram/arcGeometry'
import { MathCell } from './MathCell'

export { diagramSvgWidthPx } from '../diagram/arcGeometry'

type ArcDiagramProps = {
  diagram: Diagram
  width?: number
  showRestriction?: boolean
  showArcLabels?: boolean
  compact?: boolean
}

export function ArcDiagram({
  diagram,
  width = 120,
  showRestriction = true,
  showArcLabels = true,
  compact = false,
}: ArcDiagramProps) {
  const { n, arcs, restriction } = diagram
  const metrics = getDiagramMetrics(compact)
  const dotX = createDotX(n, width, metrics)
  const { baselineY, height } = computeDiagramLayout(
    arcs,
    dotX,
    metrics,
    showArcLabels,
  )

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
            showArcLabels={showArcLabels}
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

function ArcPath({
  arc,
  x1,
  x2,
  baselineY,
  metrics,
  compact,
  showArcLabels,
}: {
  arc: RenderArc
  x1: number
  x2: number
  baselineY: number
  metrics: ReturnType<typeof getDiagramMetrics>
  compact: boolean
  showArcLabels: boolean
}) {
  const labelWidth = showArcLabels ? metrics.labelWidth : 0
  const { pathD, leftPathD, rightPathD, midX, apexY } = arcGeometry(
    x1,
    x2,
    baselineY,
    arc.position,
    labelWidth,
  )
  const isNonzero = arc.position === 'above'
  const title = `a_{${arc.from},${arc.to}} ${isNonzero ? '\\neq 0' : '\\in \\mathbb{F}_q'}`

  const strokeProps = {
    fill: 'none' as const,
    stroke: isNonzero ? '#2563eb' : '#64748b',
    strokeWidth: metrics.strokeWidth,
  }

  return (
    <g>
      <title>{title}</title>
      {pathD ? (
        <path d={pathD} {...strokeProps} />
      ) : (
        <>
          <path d={leftPathD} {...strokeProps} />
          <path d={rightPathD} {...strokeProps} />
        </>
      )}
      {showArcLabels && (
        <foreignObject
          x={midX - metrics.labelWidth / 2}
          y={apexY - metrics.labelHeight / 2 + metrics.labelOffsetY}
          width={metrics.labelWidth}
          height={metrics.labelHeight}
          className="overflow-visible"
        >
          <div className="flex h-full items-center justify-center leading-none">
            <MathCell
              latex={arcLabelToLatex(arc.label)}
              compact={compact}
              className={metrics.labelFontClass}
            />
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export function RowColHeader({
  diagram,
  columnWidth = 84,
  compact = false,
  showArcLabels = true,
  showRestriction = true,
  onClick,
  fillCell = false,
}: {
  diagram: Diagram
  columnWidth?: number
  compact?: boolean
  showArcLabels?: boolean
  showRestriction?: boolean
  onClick?: () => void
  fillCell?: boolean
}) {
  const diagramWidth = compact
    ? diagramSvgWidthPx(diagram.n, true)
    : Math.max(72, columnWidth - 8)
  const pad = compact ? 'px-1 py-1' : 'px-1 py-1'
  const content = (
    <ArcDiagram
      diagram={diagram}
      width={diagramWidth}
      compact={compact}
      showArcLabels={showArcLabels}
      showRestriction={showRestriction}
    />
  )

  if (!onClick) {
    return (
      <div className={`flex w-full min-w-0 flex-col items-center ${pad}`}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        fillCell
          ? `flex h-full min-h-full w-full min-w-0 cursor-pointer flex-col items-center justify-center ${pad}`
          : `flex w-full min-w-0 cursor-pointer flex-col items-center rounded hover:bg-slate-100/80 ${pad}`
      }
      title="Edit arc diagram"
    >
      {content}
    </button>
  )
}
