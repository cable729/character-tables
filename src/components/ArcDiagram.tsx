import type { Diagram, RenderArc } from '../types/characterTable'
import { MathCell } from './MathCell'

/** Classes draw arcs above the baseline; characters draw arcs below. */
export type DiagramVariant = 'class' | 'character'

type ArcDiagramProps = {
  diagram: Diagram
  variant?: DiagramVariant
  width?: number
  showRestriction?: boolean
  compact?: boolean
}

const DOT_RADIUS = 4
const PADDING = 14

export function ArcDiagram({
  diagram,
  variant = 'class',
  width = 120,
  showRestriction = true,
  compact = false,
}: ArcDiagramProps) {
  const { n, arcs, restriction } = diagram
  const baselineY = 40
  const height = 88
  const usableWidth = width - PADDING * 2
  const dotSpacing = n > 1 ? usableWidth / (n - 1) : 0
  const dotX = (index: number) => PADDING + index * dotSpacing

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
            variant={variant}
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
        <div className="max-w-[140px] text-center text-[10px] text-slate-600">
          <MathCell latex={restriction} />
        </div>
      )}
    </div>
  )
}

function arcBulgesUp(arc: RenderArc, variant: DiagramVariant): boolean {
  const isNonzero = arc.position === 'above'
  if (variant === 'class') {
    return isNonzero
  }
  return !isNonzero
}

function ArcPath({
  arc,
  variant,
  x1,
  x2,
  baselineY,
}: {
  arc: RenderArc
  variant: DiagramVariant
  x1: number
  x2: number
  baselineY: number
}) {
  const midX = (x1 + x2) / 2
  const span = Math.abs(x2 - x1)
  const bulge = Math.max(14, span * 0.38)
  const bulgeUp = arcBulgesUp(arc, variant)
  const controlY = bulgeUp ? baselineY - bulge : baselineY + bulge
  const isNonzero = arc.position === 'above'

  const pathD = `M ${x1} ${baselineY} Q ${midX} ${controlY} ${x2} ${baselineY}`
  const title = `a_{${arc.from},${arc.to}} ${isNonzero ? '\\neq 0' : '\\in \\mathbb{F}_q'}`

  const labelLatex = arcLabelToLatex(arc.label)
  const labelY = bulgeUp ? controlY - bulge - 6 : controlY + 4

  return (
    <g>
      <title>{title}</title>
      <path
        d={pathD}
        fill="none"
        stroke={isNonzero ? '#2563eb' : '#64748b'}
        strokeWidth={1.75}
        strokeDasharray={isNonzero ? undefined : '4 3'}
      />
      <foreignObject
        x={midX - 20}
        y={labelY}
        width={40}
        height={20}
        className="overflow-visible"
      >
        <div className="flex items-center justify-center text-[11px] leading-none">
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
  variant,
  countLatex,
}: {
  diagram: Diagram
  variant: DiagramVariant
  countLatex?: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2">
      <ArcDiagram diagram={diagram} variant={variant} width={100} />
      {countLatex && (
        <span className="text-[10px] text-slate-500">
          <MathCell latex={countLatex} />
        </span>
      )}
    </div>
  )
}
