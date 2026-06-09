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

  it('unions arcs for distinct row diagrams 1–3', () => {
    const table = parseTableYaml(ut3FullYaml)
    const headers = [table.rows[1]!, table.rows[2]!, table.rows[3]!]
    const result = mergeSupercharacterHeaders(headers, 3)
    expect(result.status).toBe('ok')
    expect(result.status === 'ok' && result.header.arcs?.above).toBeTruthy()
  })
})
