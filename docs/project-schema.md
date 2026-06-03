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
  transformLog: []                  # audit trail; empty until transforms are implemented
  lineage: {}                       # header id provenance; empty until split/combine
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

## Transform log (future)

`transformLog` entries are typed but not executed in the foundation release. Example entry:

```yaml
transformLog:
  - op: combineHeaders
    axis: columns
    sourceIds: [col-1, col-2, col-3]
    resultId: col-merged
    method: identical
    at: supercharacter
    resultStage: condensed
```

When automated transforms are added, each should write a **new stage** (input stage unchanged) so stage switching remains sufficient for undo.

## Lineage (future)

`lineage` maps header `id` → `{ parentIds?, childIds? }` for split/combine provenance. Not used for undo in v1.

## Parser

The app uses one entry point: `parseYamlFile(text)`. If the document has top-level `version`, `project`, and `stages`, it is parsed as a project bundle; otherwise as a single character table snapshot.
