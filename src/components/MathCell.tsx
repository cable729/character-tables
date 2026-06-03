import { formatDisplayLatex } from '../math/formatDisplayLatex'
import { renderLatex } from '../math/renderLatex'

type MathCellProps = {
  latex: string
  className?: string
  displayMode?: boolean
  /** When true, merge consecutive θ-factors for display only. */
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

  const displayLatex = compact ? formatDisplayLatex(latex) : latex
  const html = renderLatex(displayLatex, displayMode)
  const tooltip = title ?? (compact && displayLatex !== latex ? latex : undefined)

  return (
    <span
      className={`inline-block max-w-full ${className}`}
      title={tooltip}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
