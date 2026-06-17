import { inferN } from '../diagram/utils'
import {
  expansionCountAtQ,
  expansionCountLatex,
} from '../expansion/expansionCountDisplay'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { buildSageCheckCode } from '../sage/checkBuilders'
import type { CharacterTable } from '../types/characterTable'
import { defineSageCheck } from './defineSageCheck'

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

export const conjugacyClassCheck = defineSageCheck({
  id: 'conjugacy',
  title: 'Conjugacy class sizes are correct',
  description: String.raw`\text{Each condensed column } j \text{ represents } n_j \text{ conjugacy classes, each of size } |C_j|. \text{ The partition identity } \sum_j n_j |C_j| = |G| \text{ says the column headers account for every element of } G. \text{ This check does not use character values.}`,
  formulaLatex: String.raw`\sum_j n_j |C_j| = |G|`,
  tier: 'symbolic',
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('conjugacy', table, qValues),
})

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

/** Superclass partition: each column is one superclass K_j with size |K_j|. */
export function superclassSizesCheckSymbolic(
  table: CharacterTable,
): SymbolicConjugacyCheckBreakdown {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required for superclass size checks')
  }

  const columns: SymbolicColumnContribution[] = table.columns.map(
    (col, index) => {
      const classSize = col.classSize ?? '1'
      return {
        index,
        nSymbolic: '1',
        classSize,
        weightedSymbolic: classSize,
      }
    },
  )

  return {
    columns,
    groupOrder: table.groupOrder,
  }
}

export function superclassSizesCheckAtQ(
  table: CharacterTable,
  q: number,
): ConjugacyCheckBreakdown {
  if (!table.groupOrder) {
    throw new Error('table.groupOrder is required for superclass size checks')
  }

  const columns: ColumnContribution[] = table.columns.map((col, index) => {
    const classSize = col.classSize ?? '1'
    const sizeAtQ = evalQPolynomial(classSize, q)
    return {
      index,
      nSymbolic: '1',
      classSize,
      nAtQ: 1,
      sizeAtQ,
      weightedAtQ: sizeAtQ,
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

