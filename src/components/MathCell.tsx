import { renderLatex } from '../math/renderLatex'

type MathCellProps = {
  latex: string
  className?: string
  displayMode?: boolean
}

export function MathCell({ latex, className = '', displayMode = false }: MathCellProps) {
  if (!latex.trim()) {
    return <span className={`text-slate-400 ${className}`}>—</span>
  }

  const html = renderLatex(latex, displayMode)

  return (
    <span
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
