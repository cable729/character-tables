# Character Table Format (YAML)

Tables are defined in **YAML** only. Each file describes one condensed character table in general **q**.

## Shape

```yaml
group: UT_4(\mathbb{F}_q)   # LaTeX — shown as the table heading
n: 4                         # optional; inferred from arc endpoints if omitted

columns:                     # indexed 0, 1, 2, …
  - classSize: 1             # |C| — conjugacy class size (LaTeX in q)
  - classSize: q^{2}
    arcs:
      above:
        a: [1, 2]            # a_{1,2} ≠ 0
        b: [2, 3]
      below: {}              # omit or leave empty
    restriction: \neg(a=c=0)

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

- **Outermost column header row**: conjugacy class size **|C|** per column (LaTeX in **q**, from `classSize` in YAML)
- **Second column header row**: number of conjugacy classes each condensed column expands to (symbolic in **q**, e.g. `(q-1)^{2}`, `q`, or `1` for identity)
- **Corner (second row, top-left)**: total number of **condensed** conjugacy classes (`columns.length`)
- **Outermost row header column**: number of irreducible characters each condensed row expands to (same symbolic formula)
- **Inner headers**: arc diagrams only (above/below arcs and optional restriction)
- **Above** arcs (drawn over the dots): the corresponding matrix entry must be **nonzero**
- **Below** arcs (drawn under the dots): label an entry that may be **zero or any field element**
- Both class columns and character rows may mix above and below arcs

## Examples

- [`src/examples/ut4-fq.yaml`](../src/examples/ut4-fq.yaml) — full UT₄ table
- [`src/examples/blank-ut-template.yaml`](../src/examples/blank-ut-template.yaml) — minimal template
