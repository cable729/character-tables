import { parseTableYaml } from '../schema/yamlTable'
import ut2Yaml from '../examples/ut2-ut1-fq.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

export const ut2Example: CharacterTable = parseTableYaml(ut2Yaml)

export { ut2Yaml }
