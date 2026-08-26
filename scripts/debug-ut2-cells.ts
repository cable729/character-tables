import { parseTableYaml } from '../src/schema/yamlTable'
import ut2Yaml from '../src/examples/ut2-ut1-fq.yaml?raw'
import { expandedRowCells } from '../src/expansion/expandedRowSum'
import { expandRowOrCol } from '../src/expansion/expandDiagram'

const table = parseTableYaml(ut2Yaml)

for (const q of [2, 3] as const) {
  console.log(`\n========== q=${q}, |G|=${q ** 5} ==========`)
  const n = table.n ?? 4
  const rowSlices = table.rows.map((r, i) => expandRowOrCol(r, n, i, q))

  for (let ri = 1; ri < table.rows.length; ri++) {
    for (let rsi = 0; rsi < Math.min(rowSlices[ri].length, 2); rsi++) {
      const cells = expandedRowCells(table, q, ri, rsi)
      const assign = rowSlices[ri][rsi].assignment

      // Group by column family
      const byColFamily = new Map<number, { re: number; count: number; classSize: string; latex: string }>()
      for (const c of cells) {
        const colIdx = parseInt(c.colKey.split(':')[0])
        let entry = byColFamily.get(colIdx)
        if (!entry) {
          entry = { re: 0, count: 0, classSize: table.columns[colIdx].classSize ?? '1', latex: table.matrix[ri]![colIdx]! }
          byColFamily.set(colIdx, entry)
        }
        entry.re += c.re * c.classWeight
        entry.count++
      }

      let total = 0
      for (const [, v] of byColFamily) total += v.re

      if (Math.abs(total) < 0.01) continue

      const assignStr = Object.entries(assign).map(([k, v]) => `${k.replace('\\', '')}=${v}`).join(',')
      console.log(`\n  Row ${ri}:${rsi} (${assignStr}) — weighted sum = ${total.toFixed(1)} (expect 0)`)
      console.log(`  matrix[${ri}] = ${JSON.stringify(table.matrix[ri])}`)
      for (const [colIdx, v] of [...byColFamily.entries()].sort((a, b) => a[0] - b[0])) {
        const marker = Math.abs(v.re) > 0.01 ? '' : ' ✓'
        console.log(`    col ${colIdx} (|C|=${v.classSize}, ${v.count} slices): Σ w·val = ${v.re.toFixed(2)}  latex="${v.latex}"${marker}`)
      }
    }
  }
}
