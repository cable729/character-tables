import { ut3Example } from '../src/data/ut3Example'
import { expandRowOrCol } from '../src/expansion/expandDiagram'
import { evalCellAtQ, makeAdditiveTheta } from '../src/expansion/evalCell'

const q = 3
const theta = makeAdditiveTheta(q)
const rows = ut3Example.rows.map((s, i) => expandRowOrCol(s, 3, i, q))

console.log('Row 1 slices:', JSON.stringify(rows[1].map((s) => s.assignment)))

for (const [rsi, rs] of rows[1].entries()) {
  const v = evalCellAtQ('\\theta(\\alpha a)', rs.assignment, { a: 1 }, q, theta)
  console.log(`1:${rsi} theta(a=1)`, rs.assignment, v.re.toFixed(4), v.im.toFixed(4))
}
