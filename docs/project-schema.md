# Project Bundle Format (YAML)

A **project bundle** stores multiple named table snapshots (stages), workflow metadata, and scaffolding for future transforms. Use it for local history and stage switching. To share a single table with collaborators, export a **snapshot** instead (see [table-schema.md](table-schema.md)).

## Shape

```yaml
version: 1
project:
  id: ut4-default
  title: UT4 reduction
  currentStage: reduced-full      # must match a key in stages
  stageOrder:                       # optional; UI order for stage selector
    - reduced-full
    - supercharacter
    - condensed
  transformLog: []                  # audit trail of automated transforms
  lineage: {}                       # header id provenance after split/combine
stages:
  reduced-full:
    group: UT_4(\mathbb{F}_q)
    groupOrder: q^{6}
    n: 4
    columns: [...]
    rows: [...]
    matrix: [...]
  supercharacter:
    group: UT_4(\mathbb{F}_q)
    columns: [...]
    rows: [...]
    matrix: [...]
```

## Stage names

Stage names are **arbitrary non-empty strings**. Examples: `main`, `reduced-full`, `UT3 supercharacter`, `after col merge`. There is no fixed list of stage types.

- **`stages`**: map from stage name → full character table (same schema as a snapshot)
- **`currentStage`**: which stage the app displays and edits
- **`stageOrder`**: controls dropdown order; if omitted, derived from map key order on import

## Undo (v1)

Undo is **stage-only**: switch `currentStage` to an earlier snapshot. Duplicate the current stage under a new name before experimenting (`Add stage` in the app). No transform replay or inverse operations.

## Import / export

| Action | Format |
|--------|--------|
| Export snapshot | Single table YAML (no `version` / `stages` wrapper) |
| Export project | Full bundle as above |
| Import | Auto-detect: bundle replaces workspace; snapshot updates current stage only |

## Transform log

`transformLog` records automated transforms. Each transform writes a **new stage** (the input stage is unchanged) so stage switching remains sufficient for undo.

### splitHeader (below-arc split)

Split one row or column header on a **below-arc label** into two children: assignments where the label is nonzero (that label moves to `arcs.above` on the nonzero child, so `{above: a, below: b}` becomes `{above: a, above: b}`), and assignments where the label is zero (remove that label from `arcs.below`; with no parent restriction, `label=0` is implied and not written). When the parent has a restriction, the zero branch may simplify it (e.g. `\neg(a=b=0)` with `b` split off becomes `a!=0`).

```yaml
transformLog:
  - op: splitHeader
    axis: columns
    sourceId: col-4
    belowLabel: b
    at: reduced-full
    resultStage: reduced-full-split-b
    children:
      - id: col-4-nz
        header:
          id: col-4-nz
          arcs:
            below:
              a: [1, 3]
            above:
              b: [2, 4]
          restriction: \neg(a=b=0)
          expansionCount: "80"
      - id: col-4-z
        header:
          id: col-4-z
          arcs:
            below:
              a: [1, 3]
          restriction: a!=0
          expansionCount: "16"
```

Other ops (`stripBelowArcs`, `sumOverLabels`, `combineHeaders`) are typed for future slices.

## Lineage

`lineage` maps header `id` → `{ parentIds?, childIds? }` after a split. Example: `col-4` gains `childIds: [col-4-nz, col-4-z]`. Not used for undo in v1.

## Parser

The app uses one entry point: `parseYamlFile(text)`. If the document has top-level `version`, `project`, and `stages`, it is parsed as a project bundle; otherwise as a single character table snapshot.
