import type { CharacterTable, GroupSpec } from './characterTable'
import { createBlankTable } from '../groups/createBlankTable'
import { formatGroupLatex } from '../groups/groupSpec'
import { createCheckpoint } from './checkpoint'
import {
  createProjectFromTable,
  getWorkingTable,
  removeBaselineCheckpoint,
  tablesEqual,
  type TableProject,
} from './tableProject'
import { parseTableYaml } from '../schema/yamlTable'
import { tableToYaml } from '../schema/yamlProject'

export type ProjectUiState = {
  editorText: string
  showEditor: boolean
  compactMath: boolean
}

export type ProjectCatalog = {
  activeProjectId: string
  projects: TableProject[]
  ui: Record<string, ProjectUiState>
}

export type ProjectPresetCheckpoint = {
  name: string
  yaml: string
}

export type ProjectPreset = {
  id: string
  title: string
  table: CharacterTable
  yaml: string
  checkpoints?: ProjectPresetCheckpoint[]
}

function defaultUiForProject(project: TableProject, yaml?: string): ProjectUiState {
  return {
    editorText: yaml?.trim() ?? tableToYaml(getWorkingTable(project)),
    showEditor: false,
    compactMath: false,
  }
}

export function createCatalogFromProject(
  project: TableProject,
  ui?: Partial<ProjectUiState>,
): ProjectCatalog {
  const editorText =
    ui?.editorText ?? tableToYaml(getWorkingTable(project))
  return {
    activeProjectId: project.id,
    projects: [project],
    ui: {
      [project.id]: {
        editorText,
        showEditor: ui?.showEditor ?? false,
        compactMath: ui?.compactMath ?? false,
      },
    },
  }
}

export function getActiveProject(catalog: ProjectCatalog): TableProject {
  const project = catalog.projects.find((p) => p.id === catalog.activeProjectId)
  if (!project) {
    if (catalog.projects.length === 0) {
      throw new Error('project catalog is empty')
    }
    return catalog.projects[0]!
  }
  return project
}

export function getActiveUi(catalog: ProjectCatalog): ProjectUiState {
  const project = getActiveProject(catalog)
  return (
    catalog.ui[project.id] ?? defaultUiForProject(project)
  )
}

export function createProjectFromGroup(spec: GroupSpec): {
  project: TableProject
  ui: ProjectUiState
} {
  const table = createBlankTable(spec)
  const title = formatGroupLatex(spec)
  const yaml = tableToYaml(table)
  const project = createProjectFromTable(table, {
    id: `custom-${crypto.randomUUID()}`,
    title,
  })
  return {
    project,
    ui: defaultUiForProject(project, yaml),
  }
}

export function createProjectFromPreset(preset: ProjectPreset): {
  project: TableProject
  ui: ProjectUiState
} {
  let project = createProjectFromTable(preset.table, {
    id: `${preset.id}-${crypto.randomUUID()}`,
    title: preset.title,
  })

  if (preset.checkpoints?.length) {
    const checkpoints: TableProject['checkpoints'] = {}
    const checkpointOrder: string[] = []
    for (const spec of preset.checkpoints) {
      const table = parseTableYaml(spec.yaml)
      const cp = createCheckpoint(spec.name, table, { id: `cp-${spec.name}` })
      checkpoints[cp.id] = cp
      checkpointOrder.push(cp.id)
    }
    project = {
      ...project,
      checkpoints: { ...project.checkpoints, ...checkpoints },
      checkpointOrder: [...project.checkpointOrder, ...checkpointOrder],
    }
    const hasEquivalentBaseline = preset.checkpoints.some((spec) =>
      tablesEqual(parseTableYaml(spec.yaml), preset.table),
    )
    if (hasEquivalentBaseline) {
      project = removeBaselineCheckpoint(project)
    }
  }

  return {
    project,
    ui: defaultUiForProject(project, preset.yaml),
  }
}


export function duplicateProject(project: TableProject): {
  project: TableProject
  ui: ProjectUiState
} {
  const clone = structuredClone(project)
  clone.id = `${project.id}-copy-${crypto.randomUUID()}`
  clone.title = `${project.title} (copy)`
  return {
    project: clone,
    ui: defaultUiForProject(clone),
  }
}

export function updateActiveProjectInCatalog(
  catalog: ProjectCatalog,
  project: TableProject,
): ProjectCatalog {
  return {
    ...catalog,
    projects: catalog.projects.map((p) =>
      p.id === project.id ? project : p,
    ),
  }
}

export function setActiveProjectInCatalog(
  catalog: ProjectCatalog,
  projectId: string,
): ProjectCatalog {
  if (!catalog.projects.some((p) => p.id === projectId)) {
    throw new Error(`project "${projectId}" not found`)
  }
  return { ...catalog, activeProjectId: projectId }
}

export function addProjectToCatalog(
  catalog: ProjectCatalog,
  project: TableProject,
  ui: ProjectUiState,
): ProjectCatalog {
  return {
    activeProjectId: project.id,
    projects: [...catalog.projects, project],
    ui: { ...catalog.ui, [project.id]: ui },
  }
}

export function removeProjectFromCatalog(
  catalog: ProjectCatalog,
  projectId: string,
): ProjectCatalog {
  if (catalog.projects.length <= 1) {
    throw new Error('cannot delete the last project')
  }
  const projects = catalog.projects.filter((p) => p.id !== projectId)
  const { [projectId]: _removed, ...ui } = catalog.ui
  const activeProjectId =
    catalog.activeProjectId === projectId
      ? projects[0]!.id
      : catalog.activeProjectId
  return { activeProjectId, projects, ui }
}

export function renameProjectInCatalog(
  catalog: ProjectCatalog,
  projectId: string,
  title: string,
): ProjectCatalog {
  const trimmed = title.trim()
  if (!trimmed) {
    throw new Error('project title cannot be empty')
  }
  return {
    ...catalog,
    projects: catalog.projects.map((p) =>
      p.id === projectId ? { ...p, title: trimmed } : p,
    ),
  }
}

export function saveActiveUiInCatalog(
  catalog: ProjectCatalog,
  patch: Partial<ProjectUiState>,
): ProjectCatalog {
  const project = getActiveProject(catalog)
  const current = getActiveUi(catalog)
  return {
    ...catalog,
    ui: {
      ...catalog.ui,
      [project.id]: { ...current, ...patch },
    },
  }
}
