import { parseTableYaml } from '../schema/yamlTable'
import ut3SupercharacterYaml from '../examples/ut3-supercharacter.yaml?raw'
import ut3SupercharacterFullYaml from '../examples/ut3-supercharacter-full.yaml?raw'
import type { CharacterTable } from '../types/characterTable'

/** Default UT₃ supercharacter preset: full 5×5 table. */
export const ut3SupercharacterFullExample: CharacterTable = parseTableYaml(
  ut3SupercharacterFullYaml,
)

/** Condensed 3×3 after row/column merges (checkpoint reference). */
export const ut3SupercharacterExample: CharacterTable =
  parseTableYaml(ut3SupercharacterYaml)

export {
  ut3SupercharacterFullYaml,
  ut3SupercharacterYaml as ut3SupercharacterYaml,
}
