import { describe, expect, it } from 'vitest'
import { createProjectFromTable } from '../types/tableProject'
import { migrateLegacyProject } from './migrateProject'
import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('migrateLegacyProject', () => {
  it('moves current stage to workingTable and others to checkpoints', () => {
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
    expect(migrated.workingTable).toEqual(table)
    expect(migrated.checkpoints).toHaveProperty('cp-migrated-alt')
    expect(migrated.checkpoints['cp-migrated-alt']?.table.group).toBe('Alt')
    expect(migrated.history.past).toEqual([])
  })

  it('createProjectFromTable uses workingTable shape', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    expect(project.workingTable).toEqual(table)
    expect(project.checkpoints).toEqual({})
    expect(project.activeCheckpointId).toBeNull()
  })
})
