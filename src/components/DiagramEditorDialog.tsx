import { useMemo, useState } from 'react'
import type { CharacterTable, Diagram, HeaderSpec } from '../types/characterTable'
import {
  headerFromDiagram,
  headerToDiagram,
  inferN,
} from '../diagram/utils'
import {
  displayExpansionCountLatex,
  mergeExpansionCountAfterEdit,
} from '../expansion/expansionCountDisplay'
import { isExpansionCountMissing } from '../schema/expansionCountValidation'
import { isSupercharacterTable } from '../schema/tableSchema'
import { EditableArcDiagram } from './EditableArcDiagram'
import { Modal } from './Modal'

export type DiagramEditorTarget =
  | { kind: 'column'; index: number }
  | { kind: 'row'; index: number }

type DiagramEditorDialogProps = {
  table: CharacterTable
  target: DiagramEditorTarget
  onSave: (
    updates: Array<{ axis: 'rows' | 'columns'; index: number; header: HeaderSpec }>,
  ) => string | null
  onCancel: () => void
}

function cloneHeader(h: HeaderSpec): HeaderSpec {
  return structuredClone(h)
}

function headersEqual(a: HeaderSpec, b: HeaderSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function mergeHeaderFromDiagram(spec: HeaderSpec, diagram: Diagram): HeaderSpec {
  return headerFromDiagram(
    {
      ...spec,
      expansionCount: spec.expansionCount,
      classSize: spec.classSize,
      id: spec.id,
    },
    diagram,
  )
}

export function DiagramEditorDialog({
  table,
  target,
  onSave,
  onCancel,
}: DiagramEditorDialogProps) {
  const n = inferN(table)
  const superTable = isSupercharacterTable(table)
  const isRow = target.kind === 'row'
  const index = target.index

  const initial = useMemo(() => {
    const spec = cloneHeader(
      isRow ? (table.rows[index] ?? {}) : (table.columns[index] ?? {}),
    )
    return {
      header: spec,
      diagram: headerToDiagram(spec, n),
      expansionCountDraft: displayExpansionCountLatex(spec),
    }
  }, [table, target, n, isRow, index])

  const [header, setHeader] = useState(initial.header)
  const [diagram, setDiagram] = useState(initial.diagram)
  const [expansionCountDraft, setExpansionCountDraft] = useState(
    initial.expansionCountDraft,
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  const title = isRow
    ? `Edit row ${index} diagram`
    : `Edit column ${index} diagram`

  const handleDiagramChange = (next: Diagram) => {
    setDiagram(next)
    setHeader((h) => ({
      ...h,
      restriction: next.restriction,
    }))
    setSaveError(null)
  }

  const handleSave = () => {
    setSaveError(null)
    let after = mergeHeaderFromDiagram(header, diagram)
    after = mergeExpansionCountAfterEdit(after, expansionCountDraft)

    const before = isRow ? table.rows[index]! : table.columns[index]!
    if (!superTable && isExpansionCountMissing(after)) {
      setSaveError(
        'Set expansionCount (LaTeX) when a restriction is present, then save again.',
      )
      return
    }
    if (headersEqual(before, after)) {
      onCancel()
      return
    }

    const err = onSave([
      { axis: isRow ? 'rows' : 'columns', index, header: after },
    ])
    if (err) {
      setSaveError(err)
    }
  }

  const headerForValidation = {
    ...header,
    restriction: diagram.restriction,
  }

  return (
    <Modal
      open
      onClose={onCancel}
      panelClassName="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white p-0 shadow-xl"
    >
        <div className="border-b border-slate-200 px-4 py-3">
          <h2
            id="diagram-editor-title"
            className="text-base font-semibold text-slate-900"
          >
            {title}
          </h2>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <EditableArcDiagram
            diagram={diagram}
            onDiagramChange={handleDiagramChange}
            showArcLabels
            showExpansionCountField={!superTable}
            expansionCount={expansionCountDraft}
            onExpansionCountChange={(value) => {
              setExpansionCountDraft(value)
              setSaveError(null)
            }}
          />
          {!superTable && isExpansionCountMissing(headerForValidation) && (
            <p className="mt-2 text-xs text-amber-700">
              Set expansionCount when a restriction is present.
            </p>
          )}
          {saveError && (
            <p className="mt-2 text-xs text-red-700">{saveError}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
    </Modal>
  )
}
