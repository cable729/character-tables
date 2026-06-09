import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import { mergeSupercharacterHeaders } from './mergeHeaders'
import ut3FullYaml from '../examples/ut3-supercharacter-full.yaml?raw'

describe('mergeSupercharacterHeaders', () => {
  it('merges identical headers', () => {
    const table = parseTableYaml(ut3FullYaml)
    const h = table.rows[0]!
    const result = mergeSupercharacterHeaders([h, h], 3)
    expect(result.status).toBe('ok')
  })

  it('combines distinct row diagrams 1–3 into below arcs', () => {
    const table = parseTableYaml(ut3FullYaml)
    const headers = [table.rows[1]!, table.rows[2]!, table.rows[3]!]
    const result = mergeSupercharacterHeaders(headers, 3)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') {
      return
    }
    expect(result.header.arcs?.below).toBeTruthy()
    expect(result.header.arcs?.above).toBeUndefined()
    const belowPairs = Object.values(result.header.arcs!.below!).map(
      (p) => `${p[0]},${p[1]}`,
    )
    expect(belowPairs.sort()).toEqual(['1,2', '2,3'])
  })
})
