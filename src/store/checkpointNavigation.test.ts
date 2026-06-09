import { beforeEach, describe, expect, it } from 'vitest'
import {
  ut3SupercharacterExample,
  ut3SupercharacterFullExample,
} from '../data/ut3SupercharacterExample'
import { projectPresets } from '../data/projectPresets'
import { createProjectFromPreset } from '../types/projectCatalog'
import { getWorkingTable } from '../types/tableProject'
import { useTableStore } from './tableStore'

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
    const cpId = useTableStore.getState().project.checkpointOrder[0]!
    useTableStore.getState().loadCheckpoint(cpId)

    const { project, table } = useTableStore.getState()
    expect(project.activeCheckpointId).toBe(cpId)
    expect(table).toEqual(ut3SupercharacterExample)
    expect(project.workingTable).toEqual(ut3SupercharacterFullExample)
  })

  it('restores the working copy from the checkpoint dropdown', () => {
    const cpId = useTableStore.getState().project.checkpointOrder[0]!
    useTableStore.getState().loadCheckpoint(cpId)
    useTableStore.getState().loadCheckpoint(null)

    const { project, table } = useTableStore.getState()
    expect(project.activeCheckpointId).toBeNull()
    expect(table).toEqual(ut3SupercharacterFullExample)
    expect(project.workingTable).toEqual(ut3SupercharacterFullExample)
  })
})
