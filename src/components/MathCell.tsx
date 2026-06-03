import { formatCompactDisplayLatex } from '../math/formatDisplayLatex'
import { renderLatex } from '../math/renderLatex'

type MathCellProps = {
  latex: string
  className?: string
  displayMode?: boolean
  /** When true, merge consecutive θ-factors and render smaller type. */
  compact?: boolean
  /** Native tooltip; defaults to raw latex when compact shortens display. */
  title?: string
}

export function MathCell({
  latex,
  className = '',
  displayMode = false,
  compact = false,
  title,
}: MathCellProps) {
  if (!latex.trim()) {
    return <span className={`text-slate-400 ${className}`}>—</span>
  }

  const displayLatex = compact ? formatCompactDisplayLatex(latex) : latex
  const html = renderLatex(displayLatex, displayMode)
  const tooltip =
    title ?? (compact && displayLatex !== latex ? latex : undefined)
  const externalKatexSize = /\[&_\.katex\]/i.test(className)
  const sizeClass =
    compact && !externalKatexSize
      ? 'text-[11px] leading-tight [&_.katex]:text-[11px]'
      : ''

  return (
    <span
      className={`inline-block max-w-full ${sizeClass} ${className}`.trim()}
      title={tooltip}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
