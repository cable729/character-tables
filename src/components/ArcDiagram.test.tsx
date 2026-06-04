import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArcDiagram } from './ArcDiagram'
import { classDiagrams } from '../stories/diagramFixtures'

describe('ArcDiagram', () => {
  it('renders arc labels by default', () => {
    const html = renderToStaticMarkup(
      <ArcDiagram diagram={classDiagrams[1]!.diagram} width={120} />,
    )
    expect(html).toContain('foreignObject')
  })

  it('omits arc labels when showArcLabels is false', () => {
    const html = renderToStaticMarkup(
      <ArcDiagram
        diagram={classDiagrams[1]!.diagram}
        width={120}
        showArcLabels={false}
        showRestriction={false}
      />,
    )
    expect(html).not.toContain('foreignObject')
    expect(html).toMatch(/<path d="M /)
  })
})
