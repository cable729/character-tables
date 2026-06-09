import { describe, expect, it } from 'vitest'
import {
  createCatalogFromProject,
  createProjectFromGroup,
  createProjectFromPreset,
  getActiveProject,
  removeProjectFromCatalog,
} from '../types/projectCatalog'
import { createProjectFromTable } from '../types/tableProject'
import { ut3Example, ut3Yaml } from '../data/ut3Example'
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
    expect(project.title).toBe('UT₃(F_q)')
    expect(getActiveProject(createCatalogFromProject(project, ui)).workingTable).toEqual(
      ut3Example,
    )
    expect(ui.editorText).toBe(ut3Yaml.trim())
  })

  it('creates UT3 supercharacter preset with 5×5 and 3×3 checkpoints', () => {
    const preset = projectPresets.find((p) => p.id === 'ut3-supercharacter')!
    const { project } = createProjectFromPreset(preset)
    expect(project.workingTable).toEqual(ut3SupercharacterFullExample)
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
      title: 'UT₄ A',
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
    expect(getActiveProject(catalog).title).toBe('UT₃(F_q)')
  })

  it('creates a project from group spec', () => {
    const { project } = createProjectFromGroup({ kind: 'ut_n', n: 5 })
    expect(project.title).toBe('UT_5(\\mathbb{F}_q)')
    expect(project.workingTable.n).toBe(5)
    expect(project.workingTable.groupSpec).toEqual({ kind: 'ut_n', n: 5 })
  })

  it('prevents deleting the last project', () => {
    const project = createProjectFromTable(ut4Example, { id: 'only' })
    const catalog = createCatalogFromProject(project)
    expect(() => removeProjectFromCatalog(catalog, project.id)).toThrow(
      /last project/,
    )
  })
})
