import { beforeEach, describe, expect, it } from 'vitest'
import {
  ut3SupercharacterExample,
  ut3SupercharacterFullExample,
} from '../data/ut3SupercharacterExample'
import { projectPresets } from '../data/projectPresets'
import { createProjectFromPreset } from '../types/projectCatalog'
import { getWorkingTable } from '../types/tableProject'
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
        table: getWorkingTable(project),
        editorText: ui.editorText,
        showEditor: ui.showEditor,
        compactMath: ui.compactMath,
        canUndo: false,
        canRedo: false,
      },
    })
  })

  it('switches to a checkpoint without overwriting the working copy', () => {
    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID)

    const { project, table } = useTableStore.getState()
    expect(project.activeCheckpointId).toBe(CONDENSED_CP_ID)
    expect(table).toEqual(ut3SupercharacterExample)
    expect(project.workingTable).toEqual(ut3SupercharacterFullExample)
  })

  it('restores the working copy from the checkpoint dropdown', () => {
    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID)
    useTableStore.getState().loadCheckpoint(null)

    const { project, table } = useTableStore.getState()
    expect(project.activeCheckpointId).toBeNull()
    expect(table).toEqual(ut3SupercharacterFullExample)
    expect(project.workingTable).toEqual(ut3SupercharacterFullExample)
  })

  it('preserves working-copy undo stack across checkpoint view switches', () => {
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

    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID)
    expect(useTableStore.getState().canUndo).toBe(false)

    useTableStore.getState().loadCheckpoint(null)
    expect(useTableStore.getState().canUndo).toBe(true)

    useTableStore.getState().undo()
    expect(useTableStore.getState().table.matrix[0]![0]).toBe(before)
  })

  it('can return to pristine 5×5 via checkpoint after editing working copy', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'edited',
    })

    useTableStore.getState().loadCheckpoint(FULL_CP_ID)
    expect(useTableStore.getState().table).toEqual(ut3SupercharacterFullExample)
  })

  it('stashes working copy before fork-on-edit from checkpoint view', () => {
    const { table, dispatchOp } = useTableStore.getState()
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: table.matrix[0]![0]!,
      after: 'edited',
    })

    useTableStore.getState().loadCheckpoint(CONDENSED_CP_ID)
    const condensed = useTableStore.getState().table
    dispatchOp({
      op: 'setCell',
      row: 0,
      col: 0,
      before: condensed.matrix[0]![0]!,
      after: 'fork-edit',
    })

    const { project } = useTableStore.getState()
    const stash = Object.values(project.checkpoints).find(
      (cp) => cp.name === 'Previous working copy',
    )
    expect(stash?.table.matrix[0]![0]).toBe('edited')
    expect(project.activeCheckpointId).toBeNull()
    expect(useTableStore.getState().table.matrix[0]![0]).toBe('fork-edit')
  })
})
