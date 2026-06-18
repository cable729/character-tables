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
    title: 'UT_4(\\mathbb{F}_q)',
    table: ut4Example,
    yaml: ut4Yaml,
  },
  {
    id: 'ut3',
    title: 'UT_3(\\mathbb{F}_q)',
    table: ut3Example,
    yaml: ut3Yaml,
  },
  {
    id: 'ut3-supercharacter',
    title: 'UT_3\\text{ supercharacter}',
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
