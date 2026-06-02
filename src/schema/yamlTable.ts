import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { parseCharacterTable } from './tableSchema'
import type { CharacterTable } from '../types/characterTable'

export function parseTableYaml(text: string): CharacterTable {
  return parseCharacterTable(parseYaml(text))
}

export function tableToYaml(table: CharacterTable): string {
  return stringifyYaml(table, {
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
  })
}
