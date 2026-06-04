import type { Diagram, RenderArc } from '../types/characterTable'

/** Shared dot-line Y (px from SVG top) so column headers align horizontally. */
export type SharedDiagramBand = {
  dotBaselineY: number
}

export type DiagramMetrics = {
  dotRadius: number
  padding: number
  labelHeight: number
  labelWidth: number
  verticalPadding: number
  labelOffsetY: number
  strokeWidth: number
  labelFontClass: string
  restrictionFontClass: string
}

export function getDiagramMetrics(compact: boolean): DiagramMetrics {
  if (compact) {
    return {
      dotRadius: 2.5,
      padding: 9,
      labelHeight: 9,
      labelWidth: 10,
      verticalPadding: 3,
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
    verticalPadding: 4,
    labelOffsetY: 0,
    strokeWidth: 1.75,
    labelFontClass: 'text-[11px]',
    restrictionFontClass: 'text-[9px]',
  }
}

export function diagramSvgWidthPx(n: number, compact: boolean): number {
  const metrics = getDiagramMetrics(compact)
  const dotSpacing = compact ? 11 : 13
  return metrics.padding * 2 + Math.max(0, n - 1) * dotSpacing
}

/** Minimum SVG width for non-compact header diagrams (matches diagram col floor). */
export const NON_COMPACT_HEADER_DIAGRAM_MIN_W = 84

/** Fixed width for class/row header dot diagrams (independent of data column widths). */
export function standardHeaderDiagramWidthPx(n: number, compact: boolean): number {
  if (compact) {
    return diagramSvgWidthPx(n, true)
  }
  const metrics = getDiagramMetrics(false)
  // Wider dot spacing than diagramSvgWidthPx default — headers were too tight at ~63px for n=4.
  const headerDotSpacing = 20
  const fromSpacing = metrics.padding * 2 + Math.max(0, n - 1) * headerDotSpacing
  return Math.max(NON_COMPACT_HEADER_DIAGRAM_MIN_W, fromSpacing)
}

/** Wider canvas for the diagram editor — fits a full semicircle on outer dots. */
export function editorDiagramWidth(n: number): number {
  const metrics = getDiagramMetrics(false)
  const dotSpacing = 40
  return metrics.padding * 2 + Math.max(0, n - 1) * dotSpacing
}

/**
 * Fixed vertical layout for editing: always reserve semicircle height for the
 * full dot span so arcs and labels are not clipped.
 */
export function computeEditableDiagramLayout(
  n: number,
  width: number,
  metrics: DiagramMetrics,
  showArcLabels: boolean,
): { baselineY: number; height: number; dotX: (index: number) => number } {
  const dotX = createDotX(n, width, metrics)
  const fullSpan = n > 1 ? dotX(n - 1) - dotX(0) : 0
  const semicircleRadius = fullSpan / 2
  const labelOverhang = showArcLabels ? metrics.labelHeight / 2 + 4 : 4

  const baselineY =
    metrics.verticalPadding +
    labelOverhang +
    semicircleRadius +
    metrics.dotRadius
  const height =
    baselineY +
    semicircleRadius +
    metrics.dotRadius +
    metrics.verticalPadding +
    labelOverhang

  return { baselineY, height, dotX }
}

export function computeDiagramLayout(
  arcs: RenderArc[],
  dotX: (index: number) => number,
  metrics: DiagramMetrics,
  showArcLabels: boolean,
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

  const labelOverhang = showArcLabels ? metrics.labelHeight / 2 : 0
  const aboveLabelPad =
    maxAboveRadius > 0 && showArcLabels ? labelOverhang : 0
  const belowLabelPad =
    maxBelowRadius > 0 && showArcLabels ? labelOverhang : 0
  const baselineY =
    metrics.verticalPadding + aboveLabelPad + maxAboveRadius + metrics.dotRadius
  const isCompact = metrics.verticalPadding <= 3
  const minimalBelowPad = isCompact ? metrics.dotRadius + 1 : metrics.dotRadius + 2
  const belowPad =
    maxBelowRadius > 0
      ? maxBelowRadius +
        metrics.dotRadius +
        metrics.verticalPadding +
        belowLabelPad
      : minimalBelowPad
  const height = baselineY + belowPad

  return { baselineY, height }
}

export function computeSharedDiagramBand(
  diagrams: Diagram[],
  width: number | number[],
  metrics: DiagramMetrics,
  showArcLabels: boolean,
): SharedDiagramBand {
  let maxAbove = 0
  const widths = Array.isArray(width)
    ? width
    : diagrams.map(() => width)

  for (let i = 0; i < diagrams.length; i++) {
    const diagram = diagrams[i]!
    const w = widths[i] ?? widths[0] ?? 120
    const dotX = createDotX(diagram.n, w, metrics)
    const { baselineY } = computeDiagramLayout(
      diagram.arcs,
      dotX,
      metrics,
      showArcLabels,
    )
    maxAbove = Math.max(maxAbove, baselineY)
  }

  return { dotBaselineY: maxAbove }
}

export function diagramSvgHeightForSharedBand(
  shared: SharedDiagramBand,
  ownLayout: { baselineY: number; height: number },
): number {
  const below = ownLayout.height - ownLayout.baselineY
  return shared.dotBaselineY + below
}

/** Per-cell content height for header row min-height. */
export function diagramHeaderCellContentHeightPx(
  shared: SharedDiagramBand,
  diagram: Diagram,
  width: number,
  metrics: DiagramMetrics,
  showArcLabels: boolean,
  hasRestriction: boolean,
  compact: boolean,
): number {
  const dotX = createDotX(diagram.n, width, metrics)
  const own = computeDiagramLayout(diagram.arcs, dotX, metrics, showArcLabels)
  const svgH = diagramSvgHeightForSharedBand(shared, own)
  const topPad = compact ? 4 : 6
  const restrictionH = hasRestriction ? (compact ? 14 : 16) : 0
  const gap = hasRestriction ? (compact ? 0 : 2) : 0
  return topPad + svgH + gap + restrictionH
}

export function diagramHeaderRowMinHeightPx(
  shared: SharedDiagramBand,
  diagrams: Diagram[],
  width: number,
  metrics: DiagramMetrics,
  showArcLabels: boolean,
  hasRestriction: (diagram: Diagram) => boolean,
  compact: boolean,
): number {
  let max = 0
  for (const diagram of diagrams) {
    max = Math.max(
      max,
      diagramHeaderCellContentHeightPx(
        shared,
        diagram,
        width,
        metrics,
        showArcLabels,
        hasRestriction(diagram),
        compact,
      ),
    )
  }
  return max
}

export function createDotX(
  n: number,
  width: number,
  metrics: DiagramMetrics,
): (index: number) => number {
  const usableWidth = width - metrics.padding * 2
  const dotSpacing = n > 1 ? usableWidth / (n - 1) : 0
  return (index: number) => metrics.padding + index * dotSpacing
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

export function arcGeometry(
  x1: number,
  x2: number,
  baselineY: number,
  position: 'above' | 'below',
  labelWidth: number,
): {
  pathD: string
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
    return {
      pathD: '',
      leftPathD: '',
      rightPathD: '',
      midX,
      apexY: baselineY,
    }
  }

  const radius = span / 2
  const above = position === 'above'
  const cx = midX
  const cy = baselineY
  const apexAngle = above ? -Math.PI / 2 : Math.PI / 2
  const apex = pointOnCircle(cx, cy, radius, apexAngle)
  const sweep = above ? 1 : 0

  if (labelWidth <= 0) {
    const pathD = `M ${leftX} ${baselineY} A ${radius} ${radius} 0 0 ${sweep} ${rightX} ${baselineY}`
    return { pathD, leftPathD: '', rightPathD: '', midX, apexY: apex.y }
  }

  const gapHalfWidth = labelWidth / 2
  const gapHalfAngle = Math.min(gapHalfWidth / radius, Math.PI / 5)
  const gapStartAngle = apexAngle + (above ? -gapHalfAngle : gapHalfAngle)
  const gapEndAngle = apexAngle + (above ? gapHalfAngle : -gapHalfAngle)
  const gapStart = pointOnCircle(cx, cy, radius, gapStartAngle)
  const gapEnd = pointOnCircle(cx, cy, radius, gapEndAngle)

  const leftPathD = `M ${leftX} ${baselineY} A ${radius} ${radius} 0 0 ${sweep} ${gapStart.x} ${gapStart.y}`
  const rightPathD = `M ${gapEnd.x} ${gapEnd.y} A ${radius} ${radius} 0 0 ${sweep} ${rightX} ${baselineY}`

  return { pathD: '', leftPathD, rightPathD, midX, apexY: apex.y }
}

export function arcLabelToLatex(label: string): string {
  if (!label.trim()) {
    return '?'
  }
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

export function arcKey(arc: RenderArc): string {
  return `${arc.from}-${arc.to}-${arc.position}`
}

const SINGLE_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

export function suggestArcLabel(existing: RenderArc[]): string {
  const used = new Set(existing.map((a) => a.label.trim()).filter(Boolean))
  for (const ch of SINGLE_LETTERS) {
    if (!used.has(ch)) {
      return ch
    }
  }
  let i = 1
  while (used.has(`l${i}`)) {
    i++
  }
  return `l${i}`
}
