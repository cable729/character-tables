import common from '../../sage/lib/_common.sage?raw'
import checks from '../../sage/lib/checks.sage?raw'
import diagram from '../../sage/lib/diagram.sage?raw'
import evalCells from '../../sage/lib/eval_cells.sage?raw'
import expandedTable from '../../sage/lib/expanded_table.sage?raw'
import qPolynomial from '../../sage/lib/q_polynomial.sage?raw'

/** Sage library modules concatenated in dependency order for Jupyter execute. */
export const SAGE_LIB_MODULES = [
  '_common.sage',
  'q_polynomial.sage',
  'diagram.sage',
  'eval_cells.sage',
  'expanded_table.sage',
  'checks.sage',
] as const

const SAGE_LIB_SOURCES = [
  common,
  qPolynomial,
  diagram,
  evalCells,
  expandedTable,
  checks,
] as const

export function loadSageLibSource(): string {
  return SAGE_LIB_SOURCES.join('\n\n')
}

/** Short fingerprint of the bundled Sage sources (changes when lib modules change). */
export function sageLibRevision(): string {
  const src = loadSageLibSource()
  let hash = 0
  for (let i = 0; i < src.length; i++) {
    hash = (Math.imul(31, hash) + src.charCodeAt(i)) | 0
  }
  return `sage-lib-${(hash >>> 0).toString(16)}`
}
