import { MathCell } from './MathCell'

const LATEX_HINT = /[\\_{^}]/

type LatexNameProps = {
  name: string
  className?: string
}

export function looksLikeLatex(name: string): boolean {
  return LATEX_HINT.test(name)
}

export function LatexName({ name, className = '' }: LatexNameProps) {
  if (!name.trim()) {
    return <span className={className}>—</span>
  }
  if (!looksLikeLatex(name)) {
    return <span className={className}>{name}</span>
  }
  return (
    <MathCell
      latex={name}
      className={`inline [&_.katex]:text-[0.95em] ${className}`.trim()}
    />
  )
}
