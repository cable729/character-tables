import { parseTableYaml } from '../schema/yamlTable'
import blankYaml from '../examples/blank-ut-template.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

export const blankExample: CharacterTable = parseTableYaml(blankYaml)

export { blankYaml }
