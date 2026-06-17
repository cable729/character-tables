import { useMemo } from 'react'
import type { CharacterTable } from '../../types/characterTable'
import {
  computeSharedDiagramBand,
  diagramHeaderRowMinHeightPx,
  getDiagramMetrics,
  standardHeaderDiagramWidthPx,
} from '../../diagram/arcGeometry'
import { headerToDiagram, inferN } from '../../diagram/utils'
import {
  findExpansionCountIssues,
  type ExpansionCountIssue,
} from '../../schema/expansionCountValidation'
import { tableLayoutFlags, type TableLayoutFlags } from '../tableLayout'
import {
  dataColumnMinWidths,
  stickyColumnWidths,
  type StickyColumnWidths,
} from '../tableColumnWidths'
import type { Diagram } from '../../types/characterTable'
import { headerPad } from './layoutConstants'

export type CharacterTableLayout = {
  n: number
  layout: TableLayoutFlags
  sticky: StickyColumnWidths
  columnMinWidths: (number | undefined)[]
  sizeLabel: string
  familyLabel: string
  stickyLeft: string | number
  innerTop: number
  hPad: string
  headerDiagramWidth: number
  columnDiagrams: Diagram[]
  columnSharedBand: ReturnType<typeof computeSharedDiagramBand>
  diagramHeaderRowMinHeight: number
  expansionCountIssues: ExpansionCountIssue[]
}

export function useCharacterTableLayout(
  table: CharacterTable,
  compactMath: boolean,
): CharacterTableLayout {
  const n = inferN(table)
  const layout = tableLayoutFlags(table)
  const expansionCountIssues = layout.showChoicesColumn
    ? findExpansionCountIssues(table)
    : []
  const columnMinWidths = dataColumnMinWidths(table, compactMath)
  const sticky = stickyColumnWidths(table, n, compactMath, {
    includeExpansionColumn: layout.showChoicesColumn,
  })
  const sizeLabel = layout.superTable ? '|K|' : '|C| per choice'
  const familyLabel = layout.cornerLabels.col
  const stickyLeft = layout.diagramStickyLeft
  const innerTop = layout.innerHeaderTopPx
  const hPad = headerPad(compactMath)
  const headerDiagramWidth = standardHeaderDiagramWidthPx(n, compactMath)
  const columnDiagrams = useMemo(
    () => table.columns.map((col) => headerToDiagram(col, n)),
    [table.columns, n],
  )
  const columnSharedBand = useMemo(() => {
    const metrics = getDiagramMetrics(compactMath)
    return computeSharedDiagramBand(
      columnDiagrams,
      headerDiagramWidth,
      metrics,
      layout.showArcLabels,
    )
  }, [
    columnDiagrams,
    headerDiagramWidth,
    compactMath,
    layout.showArcLabels,
  ])
  const diagramHeaderRowMinHeight = diagramHeaderRowMinHeightPx(
    columnSharedBand,
    columnDiagrams,
    headerDiagramWidth,
    getDiagramMetrics(compactMath),
    layout.showArcLabels,
    (d) => Boolean(d.restriction?.trim()),
    compactMath,
  )

  return {
    n,
    layout,
    sticky,
    columnMinWidths,
    sizeLabel,
    familyLabel,
    stickyLeft,
    innerTop,
    hPad,
    headerDiagramWidth,
    columnDiagrams,
    columnSharedBand,
    diagramHeaderRowMinHeight,
    expansionCountIssues,
  }
}
