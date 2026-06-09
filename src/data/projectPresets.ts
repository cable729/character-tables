import { ut3Example, ut3Yaml } from './ut3Example'
import {
  ut3SupercharacterFullExample,
  ut3SupercharacterFullYaml,
  ut3SupercharacterYaml,
} from './ut3SupercharacterExample'
import { ut4Example, ut4Yaml } from './ut4Example'
import type { ProjectPreset } from '../types/projectCatalog'

export const projectPresets: ProjectPreset[] = [
  {
    id: 'ut4',
    title: 'UT₄(F_q)',
    table: ut4Example,
    yaml: ut4Yaml,
  },
  {
    id: 'ut3',
    title: 'UT₃(F_q)',
    table: ut3Example,
    yaml: ut3Yaml,
  },
  {
    id: 'ut3-supercharacter',
    title: 'UT₃ supercharacter',
    table: ut3SupercharacterFullExample,
    yaml: ut3SupercharacterFullYaml,
    checkpoints: [
      {
        name: '5×5 full',
        yaml: ut3SupercharacterFullYaml,
      },
      {
        name: '3×3 condensed',
        yaml: ut3SupercharacterYaml,
      },
    ],
  },
]

export function getPresetById(id: string): ProjectPreset | undefined {
  return projectPresets.find((p) => p.id === id)
}
