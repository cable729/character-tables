import { describe, expect, it } from 'vitest'
import {
  createCatalogFromProject,
  createProjectFromGroup,
  createProjectFromPreset,
  getActiveProject,
  removeProjectFromCatalog,
} from '../types/projectCatalog'
import {
  createProjectFromTable,
  getDisplayTable,
} from '../types/tableProject'
import { ut3Example } from '../data/ut3Example'
import {
  ut3SupercharacterExample,
  ut3SupercharacterFullExample,
} from '../data/ut3SupercharacterExample'
import { ut4Example } from '../data/ut4Example'
import { projectPresets } from '../data/projectPresets'

describe('project catalog', () => {
  it('creates a project from UT3 preset', () => {
    const preset = projectPresets.find((p) => p.id === 'ut3')!
    const { project, ui } = createProjectFromPreset(preset)
    expect(project.title).toBe('UT_3(\\mathbb{F}_q)')
    expect(getDisplayTable(getActiveProject(createCatalogFromProject(project, ui)))).toEqual(
      ut3Example,
    )
    expect(ui.compactMath).toBe(false)
  })

  it('creates UT3 supercharacter preset with 5×5 and 3×3 checkpoints', () => {
    const preset = projectPresets.find((p) => p.id === 'ut3-supercharacter')!
    const { project } = createProjectFromPreset(preset)
    expect(getDisplayTable(project)).toEqual(ut3SupercharacterFullExample)
    expect(project.checkpointOrder).toHaveLength(2)
    expect(project.checkpoints['cp-5×5 full']?.table).toEqual(
      ut3SupercharacterFullExample,
    )
    expect(project.checkpoints['cp-3×3 condensed']?.table).toEqual(
      ut3SupercharacterExample,
    )
    expect(project.checkpoints['cp-baseline']).toBeUndefined()
  })

  it('seeds a baseline checkpoint for presets without equivalent table', () => {
    const preset = projectPresets.find((p) => p.id === 'ut3')!
    const { project } = createProjectFromPreset(preset)
    expect(project.checkpoints['cp-baseline']?.isBaseline).toBe(true)
    expect(project.checkpoints['cp-baseline']?.table).toEqual(ut3Example)
  })

  it('supports multiple projects with active switching', () => {
    const ut4Project = createProjectFromTable(ut4Example, {
      id: 'ut4-a',
      title: 'UT_4 A',
    })
    let catalog = createCatalogFromProject(ut4Project)
    const { project: ut3Project, ui } = createProjectFromPreset(
      projectPresets.find((p) => p.id === 'ut3')!,
    )
    catalog = {
      activeProjectId: ut3Project.id,
      projects: [...catalog.projects, ut3Project],
      ui: {
        ...catalog.ui,
        [ut3Project.id]: ui,
      },
    }
    expect(catalog.projects).toHaveLength(2)
    expect(getActiveProject(catalog).title).toBe('UT_3(\\mathbb{F}_q)')
  })

  it('creates a project from group spec', () => {
    const { project } = createProjectFromGroup({ kind: 'ut_n', n: 5 })
    expect(project.title).toBe('UT_5(\\mathbb{F}_q)')
    expect(getDisplayTable(project).n).toBe(5)
    expect(getDisplayTable(project).groupSpec).toEqual({ kind: 'ut_n', n: 5 })
  })

  it('prevents deleting the last editable project', () => {
    const project = createProjectFromTable(ut4Example, { id: 'only' })
    const catalog = createCatalogFromProject(project)
    expect(() => removeProjectFromCatalog(catalog, project.id)).toThrow(
      /last editable project/,
    )
  })
})
