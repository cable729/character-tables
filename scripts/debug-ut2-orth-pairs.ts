import { parseTableYaml } from '../src/schema/yamlTable'
import ut2Yaml from '../src/examples/ut2-ut1-fq.yaml?raw'
import { rowOrthogonalityAtQ } from '../src/expansion/rowOrthogonality'
import { expandedRowCells } from '../src/expansion/expandedRowSum'
import { expandRowOrCol } from '../src/expansion/expandDiagram'
import { evalQPolynomial } from '../src/expansion/evalClassSize'
import {
  evalCellAtQ,
  evalCellContextFromTable,
  makeAdditiveTheta,
  complexMul,
  complexConj,
  complexAdd,
  type Complex,
} from '../src/expansion/evalCell'
import { iterateExpandedPairs } from '../src/expansion/iterateExpandedPairs'

const table = parseTableYaml(ut2Yaml)

console.log('=== YAML class sizes ===')
for (let c = 0; c < table.columns.length; c++) {
  const col = table.columns[c]
  console.log(`  Col ${c}: classSize=${col.classSize ?? '1'}, expansionCount=${col.expansionCount ?? '1'}`)
}

for (const q of [2, 3] as const) {
  console.log(`\n========== q=${q}, |G|=${q ** 5} ==========`)

  const result = rowOrthogonalityAtQ(table, q, 50)
  console.log(`Row orthogonality: ${result.bad.length === 0 ? 'PASS' : 'FAIL'}`)
  console.log(`  rows=${result.rowCount}, cols=${result.colCount}`)

  if (result.bad.length > 0) {
    console.log('  Bad pairs:')
    for (const b of result.bad) {
      console.log(`    <${b.a}, ${b.b}>: ip = ${b.ipRe.toFixed(4)} + ${b.ipIm.toFixed(4)}i (expected ${b.expected})`)
    }

    // For each bad pair involving row family 0, show column-family breakdown
    const theta = makeAdditiveTheta(q)
    const pairs = iterateExpandedPairs(table, q)
    const G = evalQPolynomial(table.groupOrder ?? '1', q)

    // Build expanded row data
    type RowData = {
      key: string
      rowIndex: number
      rowSliceIndex: number
      values: Complex[]
      weights: number[]
      colIndices: number[]
    }
    const rows: RowData[] = []
    for (const p of pairs) {
      const key = `${p.rowIndex}:${p.rowSliceIndex}`
      let row = rows.find((r) => r.key === key)
      if (!row) {
        row = { key, rowIndex: p.rowIndex, rowSliceIndex: p.rowSliceIndex, values: [], weights: [], colIndices: [] }
        rows.push(row)
      }
      row.values.push(
        evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta,
          evalCellContextFromTable(table, p.rowIndex, p.colIndex)),
      )
      row.weights.push(p.classWeight)
      row.colIndices.push(p.colIndex)
    }

    // For each unique bad pair of row families, pick one slice from each and break down
    const seenFamilyPairs = new Set<string>()
    for (const b of result.bad) {
      const [fi] = b.a.split(':').map(Number)
      const [fj] = b.b.split(':').map(Number)
      const fpKey = `${fi},${fj}`
      if (seenFamilyPairs.has(fpKey)) continue
      seenFamilyPairs.add(fpKey)

      const ri = rows.find((r) => r.key === b.a)!
      const rj = rows.find((r) => r.key === b.b)!

      console.log(`\n  --- Breakdown: row ${b.a} vs row ${b.b} ---`)

      // Group by column family
      const byColFamily = new Map<number, { re: number; im: number; count: number }>()
      for (let c = 0; c < ri.values.length; c++) {
        const w = ri.weights[c]
        const prod = complexMul(ri.values[c], complexConj(rj.values[c]))
        const colFam = ri.colIndices[c]
        let entry = byColFamily.get(colFam)
        if (!entry) {
          entry = { re: 0, im: 0, count: 0 }
          byColFamily.set(colFam, entry)
        }
        entry.re += w * prod.re
        entry.im += w * prod.im
        entry.count++
      }

      let totalRe = 0, totalIm = 0
      for (const [colIdx, v] of [...byColFamily.entries()].sort((a, b) => a[0] - b[0])) {
        totalRe += v.re
        totalIm += v.im
        const classSize = table.columns[colIdx].classSize ?? '1'
        const marker = Math.abs(v.re) < 0.01 && Math.abs(v.im) < 0.01 ? ' ✓' : ''
        console.log(`    col ${colIdx} (|C|=${classSize}, ${v.count} slices): ` +
          `Σ = ${v.re.toFixed(4)} + ${v.im.toFixed(4)}i` +
          `  matrix[${fi}][${colIdx}]="${table.matrix[fi]![colIdx]}"` +
          `  matrix[${fj}][${colIdx}]="${table.matrix[fj]![colIdx]}"${marker}`)
      }
      console.log(`    TOTAL: ${totalRe.toFixed(4)} + ${totalIm.toFixed(4)}i (expected ${fi === fj ? G : 0})`)
    }
  }
}
