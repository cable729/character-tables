import type { CharacterTable, GroupSpec } from './characterTable'
import { createBlankTable } from '../groups/createBlankTable'
import { formatGroupLatex } from '../groups/groupSpec'
import {
  buildPresetProjects,
  createReadonlyPresetProject,
  isPresetProjectId,
} from '../data/presetProjects'
import {
  BASELINE_CHECKPOINT_ID,
  createCheckpoint,
} from './checkpoint'
import {
  createProjectFromTable,
  removeBaselineCheckpoint,
  resolveInitialActiveCheckpointId,
  tablesEqual,
  type TableProject,
} from './tableProject'
import { parseTableYaml } from '../schema/yamlTable'
import { emptyHistory } from './tableEditOp'

export type ProjectUiState = {
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

function defaultUiForProject(): ProjectUiState {
  return {
    compactMath: false,
  }
}

export function createCatalogFromProjects(
  projects: TableProject[],
  activeProjectId: string,
  ui?: Record<string, Partial<ProjectUiState>>,
): ProjectCatalog {
  const uiState: Record<string, ProjectUiState> = {}
  for (const project of projects) {
    uiState[project.id] = {
      ...defaultUiForProject(),
      ...ui?.[project.id],
    }
  }
  return { activeProjectId, projects, ui: uiState }
}

export function createCatalogFromProject(
  project: TableProject,
  ui?: Partial<ProjectUiState>,
): ProjectCatalog {
  const uiPatch: Record<string, Partial<ProjectUiState>> = {}
  if (ui) {
    uiPatch[project.id] = ui
  }
  return createCatalogFromProjects([project], project.id, uiPatch)
}

export function createDefaultCatalog(): ProjectCatalog {
  const presets = buildPresetProjects()
  const active = presets.find((p) => p.id === 'preset:ut4') ?? presets[0]!
  return createCatalogFromProjects(presets, active.id)
}

/** Merge git-shipped readonly presets into a persisted catalog. */
export function mergePresetProjects(catalog: ProjectCatalog): ProjectCatalog {
  const presetProjects = buildPresetProjects()
  const userProjects = catalog.projects.filter((p) => !p.readonly && !isPresetProjectId(p.id))
  const projects = [...presetProjects, ...userProjects]
  const activeProjectId = projects.some((p) => p.id === catalog.activeProjectId)
    ? catalog.activeProjectId
    : (projects.find((p) => p.id === 'preset:ut4')?.id ?? projects[0]!.id)
  const ui = { ...catalog.ui }
  for (const preset of presetProjects) {
    ui[preset.id] = {
      ...defaultUiForProject(),
      compactMath: ui[preset.id]?.compactMath ?? false,
    }
  }
  return { activeProjectId, projects, ui }
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
  return catalog.ui[project.id] ?? defaultUiForProject()
}

export function createProjectFromGroup(spec: GroupSpec): {
  project: TableProject
  ui: ProjectUiState
} {
  const table = createBlankTable(spec)
  const title = formatGroupLatex(spec)
  const project = createProjectFromTable(table, {
    id: `custom-${crypto.randomUUID()}`,
    title,
  })
  return {
    project,
    ui: defaultUiForProject(),
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
    project = {
      ...project,
      activeCheckpointId: resolveInitialActiveCheckpointId(project, preset.table),
    }
  }

  return {
    project,
    ui: defaultUiForProject(),
  }
}

export function duplicateProject(project: TableProject): {
  project: TableProject
  ui: ProjectUiState
} {
  const clone = structuredClone(project)
  clone.id = `${project.id.replace(/^preset:/, '')}-copy-${crypto.randomUUID()}`
  clone.title = `${project.title} (copy)`
  clone.readonly = false
  return {
    project: clone,
    ui: defaultUiForProject(),
  }
}

/** Copy a readonly preset into a new editable project at the current display table. */
export function copyReadonlyProject(
  source: TableProject,
  displayTable: CharacterTable,
): { project: TableProject; ui: ProjectUiState } {
  const activeCp = source.checkpoints[source.activeCheckpointId]
  const cpName = activeCp?.name ?? 'Original'
  const cp = createCheckpoint(cpName, structuredClone(displayTable), {
    id: BASELINE_CHECKPOINT_ID,
    isBaseline: true,
  })
  const project: TableProject = {
    id: `${source.id.replace(/^preset:/, '')}-${crypto.randomUUID()}`,
    title: source.title,
    readonly: false,
    activeCheckpointId: cp.id,
    dirtyTable: null,
    checkpoints: { [cp.id]: cp },
    checkpointOrder: [cp.id],
    history: emptyHistory(),
    historyByContext: {},
    transformLog: structuredClone(source.transformLog),
    lineage: structuredClone(source.lineage),
  }
  return {
    project,
    ui: defaultUiForProject(),
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
  if (isPresetProjectId(projectId)) {
    throw new Error('cannot delete a prepackaged project')
  }
  const editableProjects = catalog.projects.filter((p) => !p.readonly)
  if (editableProjects.length <= 1 && !isPresetProjectId(projectId)) {
    const remaining = catalog.projects.filter((p) => p.id !== projectId)
    if (remaining.every((p) => p.readonly)) {
      throw new Error('cannot delete the last editable project')
    }
  }
  const projects = catalog.projects.filter((p) => p.id !== projectId)
  const { [projectId]: _removed, ...ui } = catalog.ui
  const activeProjectId =
    catalog.activeProjectId === projectId
      ? (projects.find((p) => !p.readonly)?.id ??
        projects[0]?.id ??
        catalog.activeProjectId)
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

export { createReadonlyPresetProject }
