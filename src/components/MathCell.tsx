import { formatCompactDisplayLatex } from '../math/formatDisplayLatex'
import { renderLatex } from '../math/renderLatex'
import {
  buildDisplayLatex,
  displayLatexForCell,
  lineUnitBudgetFromColumnPx,
} from '../math/wrapDisplayLatex'
import { estimateRenderUnitsForWrap } from '../math/renderUnits'

type MathCellProps = {
  latex: string
  className?: string
  displayMode?: boolean
  /** When true, merge consecutive θ-factors and render smaller type. */
  compact?: boolean
  /** Native tooltip; defaults to raw latex when display differs or wraps. */
  title?: string
  /** Up to 2 lines with display-only factor breaks. */
  maxLines?: 1 | 2
  /** Column min-width hint for when to wrap. */
  columnWidthPx?: number
}

export function MathCell({
  latex,
  className = '',
  displayMode = false,
  compact = false,
  title,
  maxLines = 1,
  columnWidthPx,
}: MathCellProps) {
  if (!latex.trim()) {
    return <span className={`text-slate-400 ${className}`}>—</span>
  }

  let lineUnitBudget = lineUnitBudgetFromColumnPx(columnWidthPx, compact)
  if (lineUnitBudget == null && maxLines > 1) {
    const display = displayLatexForCell(latex, compact)
    const total = estimateRenderUnitsForWrap(display, compact)
    lineUnitBudget = Math.max(6, Math.floor(total * 0.48))
  }
  const built = buildDisplayLatex(latex, {
    compact,
    maxLines,
    lineUnitBudget,
  })
  const displayLatex = built.displayLatex
  const useDisplayMode = displayMode || built.wrapped
  const html = renderLatex(displayLatex, useDisplayMode)
  const compactTransformed =
    compact && formatCompactDisplayLatex(latex) !== latex.trim()
  const tooltip =
    title ??
    (built.wrapped || compactTransformed ? latex : undefined)
  const externalKatexSize = /\[&_\.katex\]/i.test(className)
  const sizeClass =
    compact && !externalKatexSize
      ? 'text-[11px] leading-tight [&_.katex]:text-[11px]'
      : ''
  const widthClass = built.wrapped
    ? 'inline-block w-max max-w-full'
    : maxLines > 1
      ? 'inline-block w-max max-w-full'
      : 'inline-block max-w-full'
  const centerClass = built.wrapped
    ? '[&_.katex-display]:mx-auto [&_.katex-display]:text-center'
    : ''
  const widthStyle =
    columnWidthPx != null && maxLines > 1 && !built.wrapped
      ? { maxWidth: columnWidthPx }
      : undefined

  return (
    <span
      className={`${widthClass} ${centerClass} ${sizeClass} ${className}`.trim()}
      style={widthStyle}
      title={tooltip}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
