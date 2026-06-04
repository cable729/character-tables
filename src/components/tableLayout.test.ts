import { describe, expect, it } from 'vitest'
import { parseTableYaml } from '../schema/yamlTable'
import ut3SuperYaml from '../examples/ut3-supercharacter.yaml?raw'
import ut3Yaml from '../examples/ut3-fq.yaml?raw'
import { tableLayoutFlags } from './tableLayout'

describe('tableLayoutFlags', () => {
  it('enables choices and labels for character tables', () => {
    const table = parseTableYaml(ut3Yaml)
    const flags = tableLayoutFlags(table)
    expect(flags.superTable).toBe(false)
    expect(flags.showChoicesColumn).toBe(true)
    expect(flags.showArcLabels).toBe(true)
    expect(flags.showRestriction).toBe(true)
    expect(flags.cornerLabels).toEqual({ row: 'chars', col: 'classes' })
    expect(flags.diagramStickyLeft).toBe('var(--expansion-col-w)')
    expect(flags.innerHeaderTopPx).toBe(56)
  })

  it('hides choices and labels for supercharacter tables', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const flags = tableLayoutFlags(table)
    expect(flags.superTable).toBe(true)
    expect(flags.showChoicesColumn).toBe(false)
    expect(flags.showArcLabels).toBe(false)
    expect(flags.showRestriction).toBe(false)
    expect(flags.cornerLabels).toEqual({
      row: 'superchars',
      col: 'superclasses',
    })
    expect(flags.diagramStickyLeft).toBe(0)
    expect(flags.innerHeaderTopPx).toBe(28)
  })
})
