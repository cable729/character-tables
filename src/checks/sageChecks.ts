import { buildSageCheckCode, buildSageThetaSumCode } from '../sage/checkBuilders'
import { defineSageCheck } from './defineSageCheck'

export const degreeSumCheck = defineSageCheck({
  id: 'degree-sum',
  title: 'Character degrees and ∑ dim² = |G|',
  description: String.raw`\text{For an irreducible } \chi, \quad \chi(1) = \dim(\chi). \text{ Moreover } \sum_{\chi \in \mathrm{Irr}(G)} \dim(\chi)^2 = |G|. \text{ After expansion, degrees are read from column } 0.`,
  formulaLatex: String.raw`\sum_{\chi \in \mathrm{Irr}} \chi(1)^2 = |G|`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('degree-sum', table, qValues),
})

export const duplicateIrrepCheck = defineSageCheck({
  id: 'duplicate-irrep',
  title: 'No duplicate irreducibles (Schur consequence)',
  description: String.raw`\text{Schur's lemma: non-isomorphic irreducibles are not proportional as class functions. We flag distinct expanded rows that are nearly proportional on all classes.}`,
  formulaLatex: String.raw`\nexists\ \lambda \in \mathbb{C}^\times:\ \chi_i = \lambda \chi_k \Rightarrow i = k`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('duplicate-irrep', table, qValues),
})

export const normIdentityCheck = defineSageCheck({
  id: 'norm-identity',
  title: 'Irreducible norm identity',
  description: String.raw`\text{Row orthogonality with } \chi = \psi \text{ gives } \langle \chi, \chi \rangle = 1, \text{ hence } \sum_{[g]} |[g]| \, |\chi(g)|^2 = |G| \text{ for each expanded irreducible.}`,
  formulaLatex: String.raw`\sum_j |C_j| \sum_{cs} |z_{i,j}|^2 = |G|`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('norm-identity', table, qValues),
})

export const trivialOrthogonalityCheck = defineSageCheck({
  id: 'trivial-orthogonality',
  title: 'Orthogonality with the trivial character',
  description: String.raw`\text{For a finite group, } \langle \chi, \mathbf{1} \rangle = \frac{1}{|G|} \sum_{g \in G} \chi(g). \text{ Non-trivial irreducibles are orthogonal to } \mathbf{1}, \text{ so the class-weighted sum over all expanded label choices must vanish. For the trivial row, the sum must equal } |G|.`,
  formulaLatex: String.raw`S_i = \sum_j |C_j| \sum_{rs,cs} z_{i,j}(rs,cs);\quad S_0 = |G|,\ S_i = 0\ (i \neq 0)`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('trivial-orthogonality', table, qValues),
})

export const thetaSumCheck = defineSageCheck({
  id: 'theta-sum',
  title: 'Additive character sum (root of unity)',
  description: String.raw`\text{For a nontrivial additive character } \theta \text{ on } \mathbb{F}_q \text{ and } c \neq 0, \quad \sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0. \text{ This verifies the } \theta \text{ implementation used in other checks.}`,
  formulaLatex: String.raw`\sum_{x \in \mathbb{F}_q} \theta(c \cdot x) = 0 \quad (c \neq 0)`,
  buildSageCode: (_table, qValues) => buildSageThetaSumCode(qValues),
})

export const rowOrthogonalityCheck = defineSageCheck({
  id: 'row-orthogonality',
  title: 'Row orthogonality (first orthogonality relation)',
  description: String.raw`\text{Irreducible characters satisfy } \langle \chi, \psi \rangle = \frac{1}{|G|} \sum_g \chi(g) \overline{\psi(g)}. \text{ On the fully expanded table, weighted inner products should be } |G| \cdot \delta_{ik}.`,
  formulaLatex: String.raw`\frac{1}{|G|}\sum_j |C_j| \sum_{rs,cs} z_{i,j}\overline{z_{k,j}} = \delta_{ik}`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('row-orthogonality', table, qValues),
})

export const columnOrthogonalityCheck = defineSageCheck({
  id: 'column-orthogonality',
  title: 'Column orthogonality (dual)',
  description: String.raw`\text{The dual orthogonality relation: } \sum_{\chi \in \mathrm{Irr}} \chi(g)\overline{\chi(h)} = \frac{|G|}{|C_g|}\,\delta_{gh} \text{ on the fully expanded class slices.}`,
  formulaLatex: String.raw`\sum_{\chi \in \mathrm{Irr}} \chi(g)\overline{\chi(h)} = \frac{|G|}{|C_g|}\,\delta_{gh}`,
  requiresGroupOrder: true,
  buildSageCode: (table, qValues) =>
    buildSageCheckCode('column-orthogonality', table, qValues),
})
