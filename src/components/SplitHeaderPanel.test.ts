import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import { applyTransformToTable, buildSplitHeaderStep } from '../transforms/applyTransform'
import { formatHeaderOption, headersWithBelow } from '../components/SplitHeaderPanel'

describe('headersWithBelow', () => {
  it('uses current column index after splits, not original id number', () => {
    let table = parseTableYaml(ut4Yaml)

    const step = buildSplitHeaderStep(table, {
      axis: 'columns',
      sourceId: 'col-3',
      belowLabel: 'b',
      at: 'main',
    })
    ;({ table } = applyTransformToTable(table, step))

    const col4 = headersWithBelow(table.columns).find((c) => c.index === 5)
    expect(col4).toBeDefined()
    expect(col4!.id).toBe('col-4')
  })

  it('formats options by index only', () => {
    const table = parseTableYaml(ut4Yaml)
    const candidate = headersWithBelow(table.columns)[0]!
    expect(formatHeaderOption('columns', candidate)).toBe(
      'Col 1 (below: a, c)',
    )
  })
})
