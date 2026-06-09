import { describe, expect, it } from 'vitest'
import { createProjectFromTable } from '../types/tableProject'
import { parseTableProject, projectToBundle } from './projectSchema'
import { parseProjectYaml, parseYamlFile, projectToYaml } from './yamlProject'
import { parseTableYaml } from './yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'

describe('parseTableProject', () => {
  it('parses v2 project bundle', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table, {
      id: 'test',
      title: 'Test',
    })
    const yaml = projectToYaml(project)
    const parsed = parseProjectYaml(yaml)
    expect(parsed.id).toBe('test')
    expect(parsed.workingTable.columns[0]?.id).toBe('col-0')
    expect(parsed.checkpoints['cp-baseline']?.isBaseline).toBe(true)
    expect(parsed.historyByContext).toEqual({})
  })

  it('migrates v1 multi-stage bundle to checkpoints', () => {
    const table = parseTableYaml(ut4Yaml)
    const bundle = {
      version: 1 as const,
      project: {
        id: 'test',
        title: 'Test',
        currentStage: 'supercharacter',
        stageOrder: ['reduced-full', 'supercharacter'],
        transformLog: [],
        lineage: {},
      },
      stages: {
        'reduced-full': table,
        supercharacter: table,
      },
    }
    const parsed = parseTableProject(bundle)
    expect(parsed.workingTable).toEqual(table)
    expect(Object.keys(parsed.checkpoints)).toContain('cp-migrated-reduced-full')
    expect(parsed.checkpoints['cp-migrated-reduced-full']?.name).toBe(
      'reduced-full',
    )
  })

  it('normalizes stageOrder when stages are omitted from order (v1)', () => {
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
    expect(parsed.checkpoints['cp-migrated-a']).toBeDefined()
  })

  it('rejects v1 currentStage not in stages', () => {
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
  it('preserves splitHeader transform log entry', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    const withSplit = {
      ...project,
      transformLog: [
        {
          op: 'splitHeader' as const,
          axis: 'columns' as const,
          sourceId: 'col-4',
          belowLabel: 'b',
          at: 'working',
          children: [
            {
              id: 'col-4-nz',
              header: { id: 'col-4-nz', restriction: 'b!=0', expansionCount: '80' },
            },
            {
              id: 'col-4-z',
              header: {
                id: 'col-4-z',
                arcs: { below: { a: [1, 3] as [number, number] } },
                expansionCount: '16',
              },
            },
          ],
        },
      ],
    }
    const reparsed = parseTableProject(projectToBundle(withSplit))
    expect(reparsed.transformLog[0]).toMatchObject({
      op: 'splitHeader',
      belowLabel: 'b',
      children: expect.any(Array),
    })
    expect(
      reparsed.transformLog[0]?.op === 'splitHeader' &&
        reparsed.transformLog[0].children,
    ).toHaveLength(2)
  })

  it('preserves transform log and lineage', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    const withMeta = {
      ...project,
      transformLog: [
        {
          op: 'sumOverLabels' as const,
          at: 'working',
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

describe('v2 project shape', () => {
  it('createProjectFromTable wraps table in workingTable', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table)
    expect(project.workingTable).toStrictEqual(table)
    expect(project.transformLog).toEqual([])
  })

  it('round-trips historyByContext in v2 bundle', () => {
    const table = parseTableYaml(ut4Yaml)
    const project = createProjectFromTable(table, { id: 'hist', title: 'Hist' })
    const withHistory = {
      ...project,
      history: {
        past: [
          {
            op: 'setCell' as const,
            row: 0,
            col: 0,
            before: '1',
            after: '2',
          },
        ],
        future: [],
      },
      historyByContext: {
        working: {
          past: [
            {
              op: 'setCell' as const,
              row: 0,
              col: 0,
              before: '1',
              after: '2',
            },
          ],
          future: [],
        },
      },
    }
    const reparsed = parseTableProject(projectToBundle(withHistory))
    expect(reparsed.history.past).toHaveLength(1)
    expect(reparsed.historyByContext.working?.past).toHaveLength(1)
  })
})
