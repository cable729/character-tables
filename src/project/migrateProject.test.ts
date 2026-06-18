import { describe, expect, it } from 'vitest'
import {
  createProjectFromTable,
  getDisplayTable,
} from '../types/tableProject'
import { migrateLegacyProject } from './migrateProject'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('migrateLegacyProject', () => {
  it('moves current stage to active checkpoint and others to checkpoints', () => {
    const table = parseTableYaml(ut4Yaml)
    const alt = structuredClone(table)
    alt.group = 'Alt'
    const legacy = {
      id: 'p1',
      title: 'Test',
      currentStage: 'main',
      stageOrder: ['main', 'alt'],
      stages: { main: table, alt },
      transformLog: [],
      lineage: {},
    }
    const migrated = migrateLegacyProject(legacy)
    expect(getDisplayTable(migrated)).toEqual(table)
    expect(migrated.checkpoints).toHaveProperty('cp-migrated-alt')
    expect(migrated.checkpoints['cp-migrated-alt']?.table.group).toBe('Alt')
    expect(migrated.history.past).toEqual([])
  })

  it('createProjectFromTable seeds baseline checkpoint', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    expect(getDisplayTable(project)).toEqual(table)
    expect(project.checkpoints['cp-baseline']?.isBaseline).toBe(true)
    expect(project.checkpoints['cp-baseline']?.table).toEqual(table)
    expect(project.activeCheckpointId).toBe('cp-baseline')
    expect(project.dirtyTable).toBeNull()
    expect(project.historyByContext).toEqual({})
  })
})
