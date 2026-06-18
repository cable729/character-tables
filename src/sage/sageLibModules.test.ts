import { describe, expect, it } from 'vitest'
import { loadSageLibSource, SAGE_LIB_MODULES, sageLibRevision } from './sageLibModules'

describe('Sage library bundle', () => {
  it('lists modules in dependency order', () => {
    expect(SAGE_LIB_MODULES).toEqual([
      '_common.sage',
      'q_polynomial.sage',
      'diagram.sage',
      'andre_theorem51.sage',
      'eval_cells.sage',
      'expanded_table.sage',
      'checks.sage',
    ])
  })

  it('bundles all eval and check entry points', () => {
    const src = loadSageLibSource()
    expect(src).toContain('def substitute_cell')
    expect(src).toContain('def normalize_theta_inner_products')
    expect(src).toContain('def evaluate_andre_theorem51')
    expect(src).toContain('def eval_cell_at_q')
    expect(src).toContain('def run_row_orthogonality_check')
    expect(src).toContain('def build_expanded_table')
  })

  it('includes θ inner normalization before eval_linear_form uses stripped args', () => {
    const src = loadSageLibSource()
    expect(src).toContain('normalize_theta_inner_products')
    expect(src.indexOf('normalize_theta_inner_products')).toBeLessThan(
      src.indexOf('def eval_cell_at_q'),
    )
  })

  it('exposes a stable revision fingerprint', () => {
    expect(sageLibRevision()).toMatch(/^sage-lib-[0-9a-f]+$/)
  })
})
