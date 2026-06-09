import { describe, expect, it } from 'vitest'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { addQPolynomialLatex } from '../expansion/qPolynomial'
import { superclassSizesCheckAtQ } from '../checks/conjugacyClassOrderCheck'
import { parseTableYaml } from '../schema/yamlTable'
import ut3FullYaml from './ut3-supercharacter-full.yaml?raw'

describe('UT3 5×5 superclass sizes', () => {
  const table = parseTableYaml(ut3FullYaml)
  const sizes = table.columns.map((c) => c.classSize!)

  it('partitions |G| = q^3 at q=2,3,5', () => {
    for (const q of [2, 3, 5]) {
      const sum = sizes.reduce((a, s) => a + evalQPolynomial(s, q), 0)
      expect(sum).toBe(q ** 3)
      expect(superclassSizesCheckAtQ(table, q).passes).toBe(true)
    }
  })

  it('assigns sizes by arc pattern', () => {
    expect(sizes).toEqual([
      '1',
      'q(q - 1)',
      'q(q - 1)',
      'q(q-1)^2',
      'q - 1',
    ])
  })

  it('merges middle three columns to q^3 - q', () => {
    const merged = addQPolynomialLatex(
      addQPolynomialLatex(sizes[1]!, sizes[2]!),
      sizes[3]!,
    )
    expect(merged).toBe('q^{3} - q')
  })
})
