import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  runSupercharCountCheck,
  runSupercharIdentityRegularStructural,
} from '../checks/supercharacterChecks'
import { superclassSizesCheckAtQ } from '../checks/conjugacyClassOrderCheck'
import { evalQPolynomial } from '../expansion/evalClassSize'
import { getActiveChecks, getChecksPartition } from '../checks/registry'
import { isSupercharacterTable, parseCharacterTable } from '../schema/tableSchema'
import { parseTableYaml } from '../schema/yamlTable'

const here = dirname(fileURLToPath(import.meta.url))
const ut3SuperYaml = readFileSync(
  join(here, 'ut3-supercharacter.yaml'),
  'utf8',
)

describe('supercharacter table type', () => {
  it('parses tableType from YAML', () => {
    const table = parseTableYaml(ut3SuperYaml)
    expect(isSupercharacterTable(table)).toBe(true)
    expect(table.tableType).toBe('supercharacter')
  })

  it('defaults to character table type', () => {
    const table = parseCharacterTable({
      group: 'G',
      columns: [{}],
      rows: [{}],
      matrix: [['1']],
    })
    expect(isSupercharacterTable(table)).toBe(false)
  })

  it('loads UT3 supercharacter example as square 3×3', () => {
    const table = parseTableYaml(ut3SuperYaml)
    expect(table.rows).toHaveLength(3)
    expect(table.columns).toHaveLength(3)
    expect(table.matrix).toHaveLength(3)
    expect(table.matrix.every((row) => row.length === 3)).toBe(true)
  })

  it('passes superchar-count check locally', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const result = runSupercharCountCheck(table, [2, 3, 5])
    expect(result.passes).toBe(true)
  })

  it('passes superclass sizes partition check at test q', () => {
    const table = parseTableYaml(ut3SuperYaml)
    for (const q of [2, 3, 5]) {
      expect(superclassSizesCheckAtQ(table, q).passes).toBe(true)
    }
  })

  it('has pairwise orthogonal supercharacters at q=3 (weighted by |K_j|)', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const q = 3
    const weights = table.columns.map((col) =>
      evalQPolynomial(col.classSize!, q),
    )
    const rows = table.matrix.map((row) =>
      row.map((cell) => {
        const s = cell.replace(/\s/g, '')
        if (s === '0') return 0
        if (s === '1') return 1
        if (s === '-1') return -1
        if (s === 'q(q-1)') return (q - 1) * q
        if (s.startsWith('-')) return -evalQPolynomial(s.slice(1), q)
        return evalQPolynomial(s, q)
      }),
    )
    function dot(i: number, k: number): number {
      return weights.reduce(
        (sum, w, j) => sum + w * rows[i]![j]! * rows[k]![j]!,
        0,
      )
    }
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 3; k++) {
        if (i === k) {
          expect(dot(i, k)).toBeGreaterThan(0)
        } else {
          expect(dot(i, k)).toBe(0)
        }
      }
    }
  })

  it('passes identity superclass structural check', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const result = runSupercharIdentityRegularStructural(table)
    expect(result.passes).toBe(true)
  })

  it('uses only supercharacter checks when tableType is supercharacter', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const checks = getActiveChecks(table)
    expect(checks).toHaveLength(4)
    expect(checks.map((c) => c.id)).toEqual([
      'superchar-count',
      'superchar-superclass-sizes',
      'superchar-orthogonal-basis',
      'superchar-identity-regular',
    ])
  })

  it('enables all supercharacter checks for valid UT3 table', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const { enabled, disabled } = getChecksPartition(table, [2, 3])
    expect(disabled).toHaveLength(0)
    expect(enabled).toHaveLength(4)
  })
})
