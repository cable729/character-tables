import { expansionCountLatex, inferN } from '../diagram/utils'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { expansionCountAtQ } from '../expansion/expansionCount'
import type { CharacterTable } from '../types/characterTable'

export type ColumnContribution = {
  index: number
  nSymbolic: string
  classSize: string
  nAtQ: number
  sizeAtQ: number
  weightedAtQ: number
}

export type SymbolicColumnContribution = {
  index: number
  nSymbolic: string
  classSize: string
  weightedSymbolic: string
}

export type ConjugacyCheckBreakdown = {
  columns: ColumnContribution[]
  sumAtQ: number
  groupOrderAtQ: number
  passes: boolean
}

export type SymbolicConjugacyCheckBreakdown = {
  columns: SymbolicColumnContribution[]
  groupOrder: string
}

export const DEFAULT_CHECK_Q_VALUES = [2, 3, 5] as const

function hasTopLevelMinus(latex: string): boolean {
  const s = latex.replace(/\{/g, '').replace(/\}/g, '').replace(/\s/g, '')
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === '-' && depth === 0 && i > 0) return true
  }
  return false
}

export function weightedContributionLatex(
  nSymbolic: string,
  classSize: string,
): string {
  if (nSymbolic === '1') {
    return classSize
  }
  if (classSize === '1') {
    return nSymbolic
  }
  const nPart = hasTopLevelMinus(nSymbolic)
    ? `\\left(${nSymbolic}\\right)`
    : nSymbolic
  return `${nPart} \\cdot ${classSize}`
}

export function conjugacyCheckSymbolic(
  table: CharacterTable,
): SymbolicConjugacyCheckBreakdown {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required for conjugacy class checks')
  }

  const columns: SymbolicColumnContribution[] = table.columns.map(
    (col, index) => {
      const nSymbolic = expansionCountLatex(col)
      const classSize = col.classSize ?? '1'
      return {
        index,
        nSymbolic,
        classSize,
        weightedSymbolic: weightedContributionLatex(nSymbolic, classSize),
      }
    },
  )

  return {
    columns,
    groupOrder: table.groupOrder,
  }
}

export function conjugacyCheckAtQ(
  table: CharacterTable,
  q: number,
): ConjugacyCheckBreakdown {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required for conjugacy class checks')
  }

  const n = inferN(table)
  const columns: ColumnContribution[] = table.columns.map((col, index) => {
    const nAtQ = expansionCountAtQ(col, n, q)
    const classSize = col.classSize ?? '1'
    const sizeAtQ = evalQPolynomial(classSize, q)
    return {
      index,
      nSymbolic: expansionCountLatex(col),
      classSize,
      nAtQ,
      sizeAtQ,
      weightedAtQ: nAtQ * sizeAtQ,
    }
  })

  const sumAtQ = columns.reduce((sum, col) => sum + col.weightedAtQ, 0)
  const groupOrderAtQ = evalQPolynomial(table.groupOrder, q)

  return {
    columns,
    sumAtQ,
    groupOrderAtQ,
    passes: sumAtQ === groupOrderAtQ,
  }
}

export function buildSageConjugacyCheckCode(
  table: CharacterTable,
  qValues: readonly number[] = DEFAULT_CHECK_Q_VALUES,
): string {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required for conjugacy class checks')
  }

  const breakdowns = qValues.map((q) => conjugacyCheckAtQ(table, q))
  const nByQ = breakdowns.map((b) => b.columns.map((c) => c.nAtQ))
  const sizesByQ = breakdowns.map((b) => b.columns.map((c) => c.sizeAtQ))
  const groupOrders = breakdowns.map((b) => b.groupOrderAtQ)

  return `# Conjugacy class partition check: sum_j n_j |C_j| = |G|
q_values = [${qValues.join(', ')}]
n_j = ${JSON.stringify(nByQ)}
C_j = ${JSON.stringify(sizesByQ)}
group_orders = ${JSON.stringify(groupOrders)}

all_ok = True
for i, q in enumerate(q_values):
    total = sum(n * c for n, c in zip(n_j[i], C_j[i]))
    expected = group_orders[i]
    ok = total == expected
    all_ok = all_ok and ok
    print(f"q={q}: sum n_j|C_j| = {total}, |G| = {expected}, ok={ok}")

print(f"all_ok={all_ok}")
`
}

export function parseSageCheckAllOk(stdout: string): boolean | null {
  const match = /all_ok=(True|False)/.exec(stdout)
  if (!match) return null
  return match[1] === 'True'
}
