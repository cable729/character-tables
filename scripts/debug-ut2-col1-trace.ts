import { parseTableYaml } from '../src/schema/yamlTable'
import ut2Yaml from '../src/examples/ut2-ut1-fq.yaml?raw'
import {
  evalCellAtQ,
  evalCellContextFromTable,
  makeAdditiveTheta,
} from '../src/expansion/evalCell'
import { substituteCell } from '../src/expansion/substituteCell'
import { iterateExpandedPairs } from '../src/expansion/iterateExpandedPairs'

const table = parseTableYaml(ut2Yaml)
const q = 2
const theta = makeAdditiveTheta(q)

console.log('=== Tracing row 3 at col 1 for q=2 ===')
console.log(`matrix[3][1] = "${table.matrix[3]![1]}"`)

const pairs = iterateExpandedPairs(table, q)
const row3col1 = pairs.filter(p => p.rowIndex === 3 && p.colIndex === 1)

console.log(`\nFound ${row3col1.length} (row3, col1) expanded cells`)
console.log(`Row 3 expansion count: ${table.rows[3].expansionCount} = ${q * (q - 1)} for q=${q}`)
console.log(`Col 1 expansion count: ${table.columns[1].expansionCount} = ${q * q - 1} for q=${q}`)
console.log(`Expected: ${q * (q - 1)} row slices × ${q * q - 1} col slices = ${q * (q - 1) * (q * q - 1)} pairs`)

for (const p of row3col1) {
  const cellLatex = p.cellLatex
  const substituted = substituteCell(cellLatex, p.rowAssignment, p.colAssignment)
  const value = evalCellAtQ(cellLatex, p.rowAssignment, p.colAssignment, q, theta,
    evalCellContextFromTable(table, p.rowIndex, p.colIndex))

  console.log(`\n  rowSlice=${p.rowSliceIndex} colSlice=${p.colSliceIndex}`)
  console.log(`    rowAssign: ${JSON.stringify(p.rowAssignment)}`)
  console.log(`    colAssign: ${JSON.stringify(p.colAssignment)}`)
  console.log(`    latex: "${cellLatex}"`)
  console.log(`    substituted: "${substituted}"`)
  console.log(`    value: ${value.re.toFixed(4)} + ${value.im.toFixed(4)}i`)
  console.log(`    classWeight: ${p.classWeight}`)
  console.log(`    weighted: ${(p.classWeight * value.re).toFixed(4)}`)
}

console.log('\n=== Tracing row 2 at col 1 for q=2 ===')
console.log(`matrix[2][1] = "${table.matrix[2]![1]}"`)

const row2col1 = pairs.filter(p => p.rowIndex === 2 && p.colIndex === 1)
console.log(`Found ${row2col1.length} (row2, col1) expanded cells`)

for (const p of row2col1) {
  const cellLatex = p.cellLatex
  const substituted = substituteCell(cellLatex, p.rowAssignment, p.colAssignment)
  const value = evalCellAtQ(cellLatex, p.rowAssignment, p.colAssignment, q, theta,
    evalCellContextFromTable(table, p.rowIndex, p.colIndex))

  console.log(`\n  rowSlice=${p.rowSliceIndex} colSlice=${p.colSliceIndex}`)
  console.log(`    rowAssign: ${JSON.stringify(p.rowAssignment)}`)
  console.log(`    colAssign: ${JSON.stringify(p.colAssignment)}`)
  console.log(`    substituted: "${substituted}"`)
  console.log(`    value: ${value.re.toFixed(4)} + ${value.im.toFixed(4)}i`)
  console.log(`    classWeight: ${p.classWeight}`)
}

// Also check: how many row-0 col-1 pairs?
const row0col1 = pairs.filter(p => p.rowIndex === 0 && p.colIndex === 1)
console.log(`\n=== Row 0 at col 1: ${row0col1.length} pairs ===`)
for (const p of row0col1) {
  const value = evalCellAtQ(p.cellLatex, p.rowAssignment, p.colAssignment, q, theta,
    evalCellContextFromTable(table, p.rowIndex, p.colIndex))
  console.log(`  colSlice=${p.colSliceIndex}: colAssign=${JSON.stringify(p.colAssignment)} → value=${value.re.toFixed(2)} weight=${p.classWeight}`)
}
