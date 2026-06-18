import { beforeEach, describe, expect, it } from 'vitest'
import {
  ut3SupercharacterExample,
  ut3SupercharacterFullExample,
} from '../data/ut3SupercharacterExample'
import { projectPresets } from '../data/projectPresets'
import { createProjectFromPreset } from '../types/projectCatalog'
import {
  getDisplayTable,
  isProjectDirty,
} from '../types/tableProject'
import { useTableStore } from './tableStore'

const CONDENSED_CP_ID = 'cp-3×3 condensed'
const FULL_CP_ID = 'cp-5×5 full'

describe('checkpoint navigation', () => {
  beforeEach(() => {
    const preset = projectPresets.find((p) => p.id === 'ut3-supercharacter')!
    const { project, ui } = createProjectFromPreset(preset)
    useTableStore.setState({
      catalog: {
        activeProjectId: project.id,
        projects: [project],
        ui: { [project.id]: ui },
      },
      editorError: null,
      ...{
        project,
        table: getDisplayTable(project),
        isDirty: isProjectDirty(project),
        editorText: ui.editorText,
        showEditor: ui.showEditor,
        compactMath: ui.compactMath,
        canUndo: false,
        canRedo: false,
      },
    })
  })

  it('switches to a checkpoint and discards unsaved edits', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'edited',
    })
    expect(useTableStore.getState().isDirty).toBe(true)

    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID, { discardDirty: true })

    const { project, table: nextTable } = useTableStore.getState()
    expect(project.activeCheckpointId).toBe(CONDENSED_CP_ID)
    expect(nextTable).toEqual(ut3SupercharacterExample)
    expect(useTableStore.getState().isDirty).toBe(false)
  })

  it('marks checkpoint dirty on edit and clears on save', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'edited',
    })
    expect(useTableStore.getState().isDirty).toBe(true)

    useTableStore.getState().saveActiveCheckpoint()
    const { project, table: saved } = useTableStore.getState()
    expect(useTableStore.getState().isDirty).toBe(false)
    expect(saved.matrix[0]![0]).toBe('edited')
    expect(project.checkpoints[project.activeCheckpointId]!.table.matrix[0]![0]).toBe(
      'edited',
    )
  })

  it('preserves undo stack per checkpoint context', () => {
    const { table, dispatchOp } = useTableStore.getState()
    const before = table.matrix[0]![0]!
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before,
      after: 'edited',
    })
    expect(useTableStore.getState().canUndo).toBe(true)

    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID, { discardDirty: true })
    expect(useTableStore.getState().canUndo).toBe(false)

    useTableStore.getState().loadCheckpoint(FULL_CP_ID, { discardDirty: true })
    expect(useTableStore.getState().canUndo).toBe(true)

    useTableStore.getState().undo()
    expect(useTableStore.getState().table.matrix[0]![0]).toBe(before)
  })

  it('can return to pristine 5×5 via checkpoint after editing', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'edited',
    })

    useTableStore.getState().loadCheckpoint(FULL_CP_ID, { discardDirty: true })
    expect(useTableStore.getState().table).toEqual(ut3SupercharacterFullExample)
  })

  it('save as creates a new checkpoint and clears dirty state', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'fork-edit',
    })

    useTableStore.getState().saveCheckpointAs('Edited full')
    const { project } = useTableStore.getState()
    const cp = Object.values(project.checkpoints).find(
      (entry) => entry.name === 'Edited full',
    )
    expect(cp?.table.matrix[0]![0]).toBe('fork-edit')
    expect(useTableStore.getState().isDirty).toBe(false)
  })

  it('renames a checkpoint', () => {
    useTableStore.getState().renameCheckpoint(FULL_CP_ID, 'Renamed full')
    const { project } = useTableStore.getState()
    expect(project.checkpoints[FULL_CP_ID]!.name).toBe('Renamed full')
  })
})
