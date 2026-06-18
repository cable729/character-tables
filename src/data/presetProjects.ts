import { parseTableYaml } from '../schema/yamlTable'
import { createCheckpoint } from '../types/checkpoint'
import {
  createProjectFromTable,
  removeBaselineCheckpoint,
  resolveInitialActiveCheckpointId,
  tablesEqual,
  type TableProject,
} from '../types/tableProject'
import type { ProjectPreset } from '../types/projectCatalog'
import { projectPresets } from './projectPresets'

export const PRESET_PROJECT_ID_PREFIX = 'preset:'

export function presetProjectId(presetId: string): string {
  return `${PRESET_PROJECT_ID_PREFIX}${presetId}`
}

export function isPresetProjectId(projectId: string): boolean {
  return projectId.startsWith(PRESET_PROJECT_ID_PREFIX)
}

export function createReadonlyPresetProject(preset: ProjectPreset): TableProject {
  let project = createProjectFromTable(preset.table, {
    id: presetProjectId(preset.id),
    title: preset.title,
    readonly: true,
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
    ...project,
    activeCheckpointId: resolveInitialActiveCheckpointId(project, preset.table),
    dirtyTable: null,
    readonly: true,
  }
}

export function buildPresetProjects(): TableProject[] {
  return projectPresets.map(createReadonlyPresetProject)
}
