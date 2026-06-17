import { substituteCell } from '../src/expansion/substituteCell'
import { evalCellAtQ, makeAdditiveTheta } from '../src/expansion/evalCell'

const q = 2
const theta = makeAdditiveTheta(q)
const latex = '\\theta(\\alpha a)\\theta(\\beta b)\\theta(\\gamma c)'
const rowAssign = { '\\alpha': 0, '\\beta': 0, '\\gamma': 1 }
const colAssign = { b: 1, a: 1, c: 0 }

const sub = substituteCell(latex, rowAssign, colAssign)
const v = evalCellAtQ(latex, rowAssign, colAssign, q, theta)
console.log('substituted:', sub)
console.log('eval:', v.re, v.im)
