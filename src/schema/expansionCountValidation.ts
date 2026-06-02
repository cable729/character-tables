import type { CharacterTable, HeaderSpec } from '../types/characterTable'

export type ExpansionCountIssue = {
  target: 'column' | 'row'
  index: number
  restriction: string
}

export function isExpansionCountMissing(spec: HeaderSpec): boolean {
  return Boolean(spec.restriction?.trim()) && !spec.expansionCount?.trim()
}

export function findExpansionCountIssues(
  table: CharacterTable,
): ExpansionCountIssue[] {
  const issues: ExpansionCountIssue[] = []

  table.columns.forEach((col, index) => {
    if (isExpansionCountMissing(col)) {
      issues.push({
        target: 'column',
        index,
        restriction: col.restriction!,
      })
    }
  })

  table.rows.forEach((row, index) => {
    if (isExpansionCountMissing(row)) {
      issues.push({
        target: 'row',
        index,
        restriction: row.restriction!,
      })
    }
  })

  return issues
}

export function formatExpansionCountIssue(issue: ExpansionCountIssue): string {
  return `${issue.target} ${issue.index + 1}: restriction set but expansionCount is missing`
}

export function validateExpansionCounts(table: CharacterTable): void {
  const issues = findExpansionCountIssues(table)
  if (issues.length > 0) {
    throw new Error(
      `expansionCount is required whenever restriction is set (${issues.map(formatExpansionCountIssue).join('; ')})`,
    )
  }
}
