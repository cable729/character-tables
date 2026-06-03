import { describe, expect, it } from 'vitest'
import { createProjectFromTable } from '../types/tableProject'
import { parseTableProject, projectToBundle } from './projectSchema'
import { parseProjectYaml, parseYamlFile, projectToYaml } from './yamlProject'
import { parseTableYaml } from './yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('parseTableProject', () => {
  it('parses a multi-stage project bundle', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table, {
      id: 'test',
      title: 'Test',
      stageName: 'reduced-full',
    })
    const yaml = projectToYaml({
      ...project,
      stageOrder: ['reduced-full', 'supercharacter'],
      stages: {
        'reduced-full': table,
        supercharacter: table,
      },
      currentStage: 'supercharacter',
    })
    const parsed = parseProjectYaml(yaml)
    expect(parsed.id).toBe('test')
    expect(parsed.currentStage).toBe('supercharacter')
    expect(parsed.stageOrder).toEqual(['reduced-full', 'supercharacter'])
    expect(Object.keys(parsed.stages)).toHaveLength(2)
    expect(parsed.stages['reduced-full']?.columns[0]?.id).toBe('col-0')
  })

  it('normalizes stageOrder when stages are omitted from order', () => {
    const table = parseTableYaml(ut4Yaml)
    const bundle = {
      version: 1 as const,
      project: {
        id: 'p1',
        title: 'P',
        currentStage: 'b',
        stageOrder: ['a'],
        transformLog: [],
        lineage: {},
      },
      stages: {
        a: table,
        b: table,
      },
    }
    const parsed = parseTableProject(bundle)
    expect(parsed.stageOrder).toEqual(['a', 'b'])
  })

  it('rejects currentStage not in stages', () => {
    const table = parseTableYaml(ut4Yaml)
    expect(() =>
      parseTableProject({
        version: 1,
        project: {
          id: 'p1',
          title: 'P',
          currentStage: 'missing',
          transformLog: [],
          lineage: {},
        },
        stages: { main: table },
      }),
    ).toThrow(/currentStage/)
  })
})

describe('parseYamlFile auto-detect', () => {
  it('detects snapshot vs project', () => {
    const snapshot = parseYamlFile(ut4Yaml)
    expect(snapshot.kind).toBe('snapshot')

    const project = createProjectFromTable(parseTableYaml(ut4Yaml))
    const projectParsed = parseYamlFile(projectToYaml(project))
    expect(projectParsed.kind).toBe('project')
  })
})

describe('projectToBundle round-trip', () => {
  it('preserves transform log and lineage', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    const withMeta = {
      ...project,
      transformLog: [
        {
          op: 'sumOverLabels' as const,
          at: 'main',
          resultStage: 'super',
        },
      ],
      lineage: { 'col-0': { childIds: ['col-1'] } },
    }
    const bundle = projectToBundle(withMeta)
    const reparsed = parseTableProject(bundle)
    expect(reparsed.transformLog).toHaveLength(1)
    expect(reparsed.lineage['col-0']?.childIds).toEqual(['col-1'])
  })
})

describe('v5 migration shape', () => {
  it('createProjectFromTable wraps a table in main stage', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    expect(project.currentStage).toBe('main')
    expect(project.stageOrder).toEqual(['main'])
    expect(project.stages.main).toBe(table)
    expect(project.transformLog).toEqual([])
  })
})
