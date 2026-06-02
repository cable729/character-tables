import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { parseCharacterTable } from './tableSchema'
import type { CharacterTable } from '../types/characterTable'

/** Split a YAML flow-sequence interior on commas not inside `{}`, `()`, or `[]`. */
function splitFlowSequenceItems(body: string): string[] {
  const items: string[] = []
  let depth = 0
  let current = ''
  for (const char of body) {
    if (char === '{' || char === '(' || char === '[') {
      depth++
    } else if (char === '}' || char === ')' || char === ']') {
      depth = Math.max(0, depth - 1)
    } else if (char === ',' && depth === 0) {
      items.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.length > 0) {
    items.push(current)
  }
  return items
}

/**
 * Quote unquoted matrix flow-sequence items that contain `{` or `}`.
 * LaTeX subscripts like `\delta_{\alpha a = \beta b}` are invalid bare YAML scalars.
 */
export function protectMatrixLatexBraces(text: string): string {
  return text.replace(/^(\s+-\s*\[)(.+)(\]\s*)$/gm, (_line, start, body, end) => {
    const items = splitFlowSequenceItems(body)
    const fixed = items.map((item) => {
      const trimmed = item.trim()
      if (
        (trimmed.includes('{') || trimmed.includes('}')) &&
        !/^(['"]).*\1$/.test(trimmed)
      ) {
        return `'${trimmed.replace(/'/g, "''")}'`
      }
      return item
    })
    return `${start}${fixed.join(', ')}${end}`
  })
}

export function parseTableYaml(text: string): CharacterTable {
  return parseCharacterTable(parseYaml(protectMatrixLatexBraces(text)))
}

export function tableToYaml(table: CharacterTable): string {
  return stringifyYaml(table, {
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
  })
}
