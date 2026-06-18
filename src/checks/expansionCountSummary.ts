export type ExpansionStatusRow = {
  q: number
  rowTotal: number
  colTotal: number
  passes: boolean
}

export type ExpansionCountGuidance = {
  headline: string
  detail: string
  accent: 'warn' | 'fail'
  /** Expanded counts are imbalanced — orthogonality headline should not take priority. */
  countsMismatch: boolean
}

export function summarizeExpansionCountGuidance(args: {
  expansionStatus: ExpansionStatusRow[] | null
  hasExpansionCountIssues: boolean
}): ExpansionCountGuidance | null {
  const { expansionStatus, hasExpansionCountIssues } = args

  if (hasExpansionCountIssues) {
    return {
      headline: 'Expansion counts incomplete',
      detail:
        'Add expansionCount on restricted headers before expanded row/column balance can be checked.',
      accent: 'warn',
      countsMismatch: true,
    }
  }

  const failingExpanded = expansionStatus?.filter((row) => !row.passes) ?? []
  if (failingExpanded.length > 0) {
    const first = failingExpanded[0]!
    const headline = `${first.rowTotal} characters vs ${first.colTotal} classes`
    const detail =
      failingExpanded.length === 1
        ? `Expanded slice counts must match at q = ${first.q} before orthogonality checks can run.`
        : `Expanded slice counts mismatch at ${failingExpanded.map((row) => `q = ${row.q} (${row.rowTotal} vs ${row.colTotal})`).join('; ')}.`
    return {
      headline,
      detail,
      accent: 'warn',
      countsMismatch: true,
    }
  }

  return null
}
