import type { Diagram, RenderArc } from '../types/characterTable'
import {
  arcGeometry,
  arcLabelToLatex,
  computeDiagramLayout,
  createDotX,
  diagramSvgHeightForSharedBand,
  getDiagramMetrics,
  standardHeaderDiagramWidthPx,
  type SharedDiagramBand,
} from '../diagram/arcGeometry'
import { MathCell } from './MathCell'

export { diagramSvgWidthPx } from '../diagram/arcGeometry'

type ArcDiagramProps = {
  diagram: Diagram
  width?: number
  showRestriction?: boolean
  showArcLabels?: boolean
  compact?: boolean
  /** Shared dot-line Y across table column headers. */
  sharedBand?: SharedDiagramBand
  /** Fill parent cell height (table header buttons). */
  fillCell?: boolean
  /** Sticky diagram column width for restriction line wrap. */
  restrictionColumnWidthPx?: number
}

export function ArcDiagram({
  diagram,
  width: widthProp,
  showRestriction = true,
  showArcLabels = true,
  compact = false,
  sharedBand,
  fillCell = false,
  restrictionColumnWidthPx,
}: ArcDiagramProps) {
  const { n, arcs, restriction } = diagram
  const metrics = getDiagramMetrics(compact)
  const width = widthProp ?? standardHeaderDiagramWidthPx(n, compact)
  const dotX = createDotX(n, width, metrics)
  const ownLayout = computeDiagramLayout(arcs, dotX, metrics, showArcLabels)
  const baselineY = sharedBand?.dotBaselineY ?? ownLayout.baselineY
  const height = sharedBand
    ? diagramSvgHeightForSharedBand(sharedBand, ownLayout)
    : ownLayout.height

  const svg = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block overflow-visible"
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
  )

  const restrictionBlock =
    showRestriction && restriction ? (
      <div
        className={`mx-auto min-w-0 overflow-visible whitespace-normal text-center text-slate-600 ${compact ? 'w-full px-0' : 'w-full px-0.5'} ${metrics.restrictionFontClass}`}
        title={restriction}
      >
        <MathCell
          latex={restriction}
          compact={compact}
          maxLines={2}
          columnWidthPx={restrictionColumnWidthPx ?? width}
        />
      </div>
    ) : null

  if (sharedBand) {
    const restrictionGap = compact ? 'mt-0' : 'mt-0.5'
    return (
      <div
        className={`flex w-full flex-col items-center ${fillCell ? 'h-full min-h-full justify-between' : 'pt-1'}`}
      >
        <div
          className={`flex w-full shrink-0 justify-center ${fillCell ? 'pt-1' : ''}`}
          style={{ height }}
        >
          {svg}
        </div>
        {restrictionBlock ? (
          <div className={`w-full shrink-0 ${restrictionGap} ${fillCell ? 'pb-1' : ''}`}>
            {restrictionBlock}
          </div>
        ) : fillCell ? (
          <div className="min-h-0 flex-1" aria-hidden />
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center ${compact ? 'gap-0' : 'gap-0.5'}`}
    >
      {svg}
      {restrictionBlock}
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
  compact = false,
  showArcLabels = true,
  showRestriction = true,
  onClick,
  fillCell = false,
  sharedBand,
  diagramWidth: diagramWidthProp,
  restrictionColumnWidthPx,
}: {
  diagram: Diagram
  /** @deprecated Use diagramWidth; headers use standardHeaderDiagramWidthPx. */
  columnWidth?: number
  compact?: boolean
  showArcLabels?: boolean
  showRestriction?: boolean
  onClick?: () => void
  fillCell?: boolean
  sharedBand?: SharedDiagramBand
  diagramWidth?: number
  restrictionColumnWidthPx?: number
}) {
  const diagramWidth =
    diagramWidthProp ?? standardHeaderDiagramWidthPx(diagram.n, compact)
  const inTableHeader = sharedBand != null
  const pad = compact ? 'px-1 py-1' : 'px-1 py-1.5'
  const content = (
    <ArcDiagram
      diagram={diagram}
      width={diagramWidth}
      compact={compact}
      showArcLabels={showArcLabels}
      showRestriction={showRestriction}
      sharedBand={sharedBand}
      fillCell={inTableHeader || fillCell}
      restrictionColumnWidthPx={restrictionColumnWidthPx}
    />
  )

  const wrapperClass = inTableHeader || fillCell
    ? `flex h-full min-h-full w-full min-w-0 flex-col items-center ${pad}`
    : `flex w-full min-w-0 flex-col items-center ${pad}`

  if (!onClick) {
    return <div className={wrapperClass}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wrapperClass} cursor-pointer rounded-none hover:bg-slate-100/80`}
      title="Edit arc diagram"
    >
      {content}
    </button>
  )
}
