import { parseTableYaml } from '../schema/yamlTable'
import ut3SupercharacterYaml from '../examples/ut3-supercharacter.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

export const ut3SupercharacterExample: CharacterTable =
  parseTableYaml(ut3SupercharacterYaml)

export { ut3SupercharacterYaml as ut3SupercharacterYaml }
