import { substituteCell } from '../src/expansion/substituteCell'
import { evalCellAtQ, makeAdditiveTheta } from '../src/expansion/evalCell'

const q = 3
const theta = makeAdditiveTheta(q)
const latex = '\\theta(\\alpha a)'

for (const rowAssign of [{ '\\alpha': 1 }, { '\\alpha': 2 }]) {
  const colAssign = { a: 1 }
  const sub = substituteCell(latex, rowAssign, colAssign)
  const v = evalCellAtQ(latex, rowAssign, colAssign, q, theta)
  console.log(rowAssign, 'substituted:', sub, 'eval:', v.re, v.im)
}
