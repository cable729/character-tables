import { parseTableYaml } from '../schema/yamlTable'
import ut4Yaml from '../examples/ut4-fq.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

export const ut4Example: CharacterTable = parseTableYaml(ut4Yaml)

export { ut4Yaml }
