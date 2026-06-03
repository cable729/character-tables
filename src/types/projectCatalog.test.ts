import { describe, expect, it } from 'vitest'
import {
  createCatalogFromProject,
  createProjectFromPreset,
  getActiveProject,
  removeProjectFromCatalog,
} from '../types/projectCatalog'
import { createProjectFromTable } from '../types/tableProject'
import { ut3Example, ut3Yaml } from '../data/ut3Example'
import { ut4Example } from '../data/ut4Example'
import { projectPresets } from '../data/projectPresets'

describe('project catalog', () => {
  it('creates a project from UT3 preset', () => {
    const preset = projectPresets.find((p) => p.id === 'ut3')!
    const { project, ui } = createProjectFromPreset(preset)
    expect(project.title).toBe('UT₃(F_q)')
    expect(getActiveProject(createCatalogFromProject(project, ui)).stages.main).toEqual(
      ut3Example,
    )
    expect(ui.editorText).toBe(ut3Yaml.trim())
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

  it('prevents deleting the last project', () => {
    const project = createProjectFromTable(ut4Example, { id: 'only' })
    const catalog = createCatalogFromProject(project)
    expect(() => removeProjectFromCatalog(catalog, project.id)).toThrow(
      /last project/,
    )
  })
})
