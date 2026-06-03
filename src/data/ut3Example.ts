import { parseTableYaml } from '../schema/yamlTable'
import ut3Yaml from '../examples/ut3-fq.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

export const ut3Example: CharacterTable = parseTableYaml(ut3Yaml)

export { ut3Yaml }
