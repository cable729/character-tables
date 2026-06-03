const THETA_RUN = /(?:\\theta\([^)]*\))+/g

function extractThetaArgs(run: string): string[] {
  const args: string[] = []
  const re = /\\theta\(([^)]*)\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(run)) !== null) {
    args.push(match[1]!)
  }
  return args
}

/**
 * Shorten display LaTeX by merging consecutive θ-factors into one θ with comma-separated args.
 * Does not change stored matrix strings or Sage substitution.
 */
export function formatDisplayLatex(latex: string): string {
  const trimmed = latex.trim()
  if (!trimmed) {
    return latex
  }

  return trimmed.replace(THETA_RUN, (run) => {
    const args = extractThetaArgs(run)
    if (args.length < 2) {
      return run
    }
    return `\\theta\\!\\left(${args.join(', ')}\\right)`
  })
}

/**
 * Display-only: remove spaces around `=` (LaTeX commands like `\neq` unchanged).
 */
export function tightenEqualitySpacing(latex: string): string {
  return latex.replace(/\s*=\s*/g, '=')
}

/**
 * Display-only: pull KaTeX relation equals together with `\mkern` (YAML may already omit spaces).
 */
export function kernEqualityInMath(latex: string): string {
  let result = ''
  let i = 0
  while (i < latex.length) {
    if (latex[i] === '\\') {
      const cmd = latex.slice(i).match(/^\\[a-zA-Z]+/)
      if (cmd) {
        result += cmd[0]
        i += cmd[0].length
        continue
      }
    }
    if (latex[i] === '=') {
      result += '\\mkern{-2mu}=\\mkern{-2mu}'
      i++
      continue
    }
    result += latex[i]
    i++
  }
  return result
}

/** Compact display transforms (θ merge, tight equals, relation kerns). */
export function formatCompactDisplayLatex(latex: string): string {
  const merged = formatDisplayLatex(latex)
  const spaced = tightenEqualitySpacing(merged)
  return kernEqualityInMath(spaced)
}
