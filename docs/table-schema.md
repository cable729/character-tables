# Character Table Format (YAML)

Tables are defined in **YAML** only. Each file describes one condensed character table in general **q**.

## Shape

```yaml
group: UT_4(\mathbb{F}_q)   # LaTeX — shown as the table heading
groupOrder: q^{6}            # |G| — LaTeX in q; used for Sage conjugacy checks
n: 4                         # optional; inferred from arc endpoints if omitted

columns:                     # indexed 0, 1, 2, …
  - id: col-0                # optional; auto-assigned as col-{n} on parse if omitted
  - classSize: 1             # |C| — conjugacy class size (LaTeX in q)
  - classSize: q^{2}
    arcs:
      above:
        a: [1, 2]            # a_{1,2} ≠ 0
        b: [2, 3]
      below: {}              # omit or leave empty
    restriction: \neg(a=c=0)
    expansionCount: (q^2-1)(q-1)   # manual n_j when restriction applies

rows:                        # characters — same arc format
  - {}
  - arcs:
      above:
        \alpha: [1, 2]
        \beta: [2, 3]

matrix:                      # matrix[row][col], LaTeX strings
  - [1, 1, 1]
  - [q, 0, "\\theta(\\alpha a)"]
```

`groupOrder` is optional but required for the Sage checks panel. It uses the same LaTeX-in-**q** subset as `classSize` (`1`, `q`, `q^{k}`, `(q-1)`, `(q-1)q`, and subtractive forms like `(q-1)q^{2} - q`). The app verifies \(\sum_j n_j |C_j| = |G|\) by expanding each condensed column into \(n_j\) classes of size \(|C_j|\).

When a header has a `restriction`, you **must** set **`expansionCount`** to the closed-form class count \(n_j\) in **q** (e.g. `(q^2-1)(q-1)`). Without it, the table shows a warning and Sage checks are blocked. Unrestricted headers still infer \(n_j\) from arcs.

## Header ids

Each column and row header may include an optional **`id`** (non-empty string). If omitted, the app assigns `col-0`, `col-1`, … and `row-0`, `row-1`, … on parse. Ids must be unique within columns and within rows. They are stable across edits and used for future split/combine transforms.

## Arc dictionary

```yaml
arcs:
  above:                     # entry must be nonzero → (q-1) per label
    a: [1, 2]
    b: [2, 3]
  below:                     # entry unrestricted → q per label
    x: [1, 4]
```

Same label on two arcs:

```yaml
above:
  c: [[2, 3], [1, 3]]
```

## Display conventions

- **Matrix LaTeX** is stored explicitly (e.g. separate `\theta(\alpha a)` factors). The app’s **Compact math** toggle only changes display: merged θ-factors, smaller KaTeX, and smaller arc diagrams; YAML, Sage checks, and cell substitution still use the stored form.
- **Outermost column header row**: conjugacy class size **|C|** per column (LaTeX in **q**, from `classSize` in YAML)
- **Second column header row**: number of conjugacy classes each condensed column expands to (`expansionCount` when set, otherwise inferred from arcs for unrestricted headers)
- **Corner (second row, top-left)**: total number of **condensed** conjugacy classes (`columns.length`)
- **Outermost row header column**: number of irreducible characters each condensed row expands to (same symbolic formula)
- **Inner headers**: arc diagrams only (above/below arcs and optional restriction)
- **Above** arcs (drawn over the dots): the corresponding matrix entry must be **nonzero**
- **Below** arcs (drawn under the dots): label an entry that may be **zero or any field element**
- Both class columns and character rows may mix above and below arcs

## Examples

- [`src/examples/ut4-fq.yaml`](../src/examples/ut4-fq.yaml) — full UT₄ table
- [`src/examples/blank-ut-template.yaml`](../src/examples/blank-ut-template.yaml) — minimal template

For multi-stage local workflows (named snapshots, project export), see [project-schema.md](project-schema.md).
