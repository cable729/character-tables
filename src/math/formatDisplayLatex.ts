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
