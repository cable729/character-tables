export type ExpansionStatusRow = {
  q: number
  rowTotal: number
  colTotal: number
  passes: boolean
  declaredRowTotal: number
  declaredColTotal: number
  declaredPasses: boolean
  declaredMatchesEnumerated: boolean
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

  const failingDeclared =
    expansionStatus?.filter((row) => !row.declaredPasses) ?? []
  if (failingDeclared.length > 0) {
    const first = failingDeclared[0]!
    const headline = `${first.declaredRowTotal} row choices vs ${first.declaredColTotal} column choices`
    const detail =
      failingDeclared.length === 1
        ? `Declared Choices totals must match at q = ${first.q} before orthogonality checks can run.`
        : `Declared Choices mismatch at ${failingDeclared.map((row) => `q = ${row.q} (${row.declaredRowTotal} vs ${row.declaredColTotal})`).join('; ')}.`
    return {
      headline,
      detail,
      accent: 'warn',
      countsMismatch: true,
    }
  }

  const failingDeclaredVsEnumerated =
    expansionStatus?.filter((row) => !row.declaredMatchesEnumerated) ?? []
  if (failingDeclaredVsEnumerated.length > 0) {
    const first = failingDeclaredVsEnumerated[0]!
    const headline = `Choices disagree with arc enumeration at q = ${first.q}`
    const detail = `Enumerated ${first.rowTotal}×${first.colTotal}, declared ${first.declaredRowTotal}×${first.declaredColTotal}. Clear stale expansionCount overrides or fix arc patterns.`
    return {
      headline,
      detail,
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
