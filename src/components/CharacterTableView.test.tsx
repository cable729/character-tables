import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseTableYaml } from '../schema/yamlTable'
import ut3SuperYaml from '../examples/ut3-supercharacter.yaml?raw'
import ut3Yaml from '../examples/ut3-fq.yaml?raw'
import { CharacterTableView } from './CharacterTableView'

describe('CharacterTableView', () => {
  it('shows Choices column for character tables', () => {
    const table = parseTableYaml(ut3Yaml)
    const html = renderToStaticMarkup(<CharacterTableView table={table} />)
    expect(html).toContain('Choices')
    expect(html).toContain('|C|')
    expect(html).toContain('classes')
    expect(html).toContain('chars')
  })

  it('keeps separate |C| and class-count header rows (no diagram rowSpan on |C|)', () => {
    const table = parseTableYaml(ut3Yaml)
    const html = renderToStaticMarkup(<CharacterTableView table={table} />)
    const cSizeMatches = html.match(/\|C\|/g) ?? []
    expect(cSizeMatches.length).toBe(1)
    expect(html).toMatch(/>\s*3\s*<[\s\S]*classes/s)
  })

  it('omits Choices column for supercharacter tables', () => {
    const table = parseTableYaml(ut3SuperYaml)
    const html = renderToStaticMarkup(<CharacterTableView table={table} />)
    expect(html).not.toContain('Choices')
    expect(html).toContain('|K|')
    expect(html).toContain('superclasses')
  })
})
