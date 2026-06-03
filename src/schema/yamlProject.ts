import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { CharacterTable } from '../types/characterTable'
import type { TableProject } from '../types/tableProject'
import {
  isProjectBundle,
  parseTableProject,
  projectToBundle,
} from './projectSchema'
import { parseCharacterTable } from './tableSchema'
import { parseTableYaml, tableToYaml } from './yamlTable'

export type ParsedYamlFile =
  | { kind: 'snapshot'; table: CharacterTable }
  | { kind: 'project'; project: TableProject }

export function parseYamlFile(text: string): ParsedYamlFile {
  const json = parseYaml(text)
  if (isProjectBundle(json)) {
    return { kind: 'project', project: parseTableProject(json) }
  }
  return { kind: 'snapshot', table: parseCharacterTable(json) }
}

export function parseProjectYaml(text: string): TableProject {
  const parsed = parseYamlFile(text)
  if (parsed.kind !== 'project') {
    throw new Error('YAML is a table snapshot, not a project bundle')
  }
  return parsed.project
}

export function projectToYaml(project: TableProject): string {
  return stringifyYaml(projectToBundle(project), {
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
  })
}

export { parseTableYaml, tableToYaml }
