# Project Bundle Format (YAML v2)

A **project bundle** stores the editable working table, named **checkpoints** (saved snapshots), undo history, and transform metadata. Use it for local persistence and sharing multi-checkpoint work. To share a single table, export a **snapshot** instead (see [table-schema.md](table-schema.md)).

Legacy v1 bundles with `stages` / `currentStage` are migrated on import via `migrateLegacyProject`.

## Shape

```yaml
version: 2
project:
  id: ut4-default
  title: UT₄ reduction
  activeCheckpointId: null          # null = editing working copy; else view a checkpoint
  checkpointOrder:
    - cp-baseline
    - cp-condensed
  transformLog: []                  # splitHeader / combineHeaders audit trail
  lineage: {}                       # header id provenance after split/combine
  workingTable:                     # live editable table (same schema as a snapshot)
    group: UT_4(\mathbb{F}_q)
    groupOrder: q^{6}
    n: 4
    columns: [...]
    rows: [...]
    matrix: [...]
checkpoints:
  cp-baseline:
    id: cp-baseline
    name: Original
    isBaseline: true
    parentId: null
    table: { ... }                  # full CharacterTable snapshot
    createdAt: "2026-06-01T12:00:00.000Z"
  cp-condensed:
    id: cp-condensed
    name: Condensed
    table: { ... }
history:
  past: []                          # undo stack (per active context)
  future: []
historyByContext:
  working: { past: [], future: [] }
  cp-condensed: { past: [], future: [] }
```

## Working copy vs checkpoints

- **`workingTable`**: the live editable table. Undo/redo applies here when no checkpoint is selected.
- **`checkpoints`**: named snapshots. Selecting a checkpoint **views** its table without overwriting `workingTable`.
- **`activeCheckpointId`**: when set, the UI shows that checkpoint's table. Editing while viewing a checkpoint stashes the prior working copy as "Previous working copy" and forks edits onto a new working branch.
- Undo is **per context** (working vs each checkpoint id) and is disabled while viewing a checkpoint until you return to the working copy or fork.

## Import / export

| Action | Format |
|--------|--------|
| Export snapshot | Single table YAML (no `version` / `project` wrapper) |
| Export project | Full v2 bundle as above |
| Import | Auto-detect: bundle replaces catalog project; snapshot updates working table |

## Transform log

`transformLog` records `splitHeader` and `combineHeaders` steps. Both go through `applyTransformToTable` in `src/transforms/applyTransform.ts`.

### splitHeader (below-arc split)

Split one row or column header on a **below-arc label** into two children. Each child is **canonicalized** after the split ([`canonicalizeHeader`](../src/headers/canonicalize.ts)):

- Promote `below L` + `L!=0` to `above L` (equivalent diagrams).
- Drop restrictions that no longer change the assignment set.
- Infer symbolic `expansionCount` (`(q-1)`, `(q-1)q`, `q^2-1`, …).

### combineHeaders

Merge adjacent row or column headers. Character tables require identical specs; supercharacter tables union arc diagrams (with optional row-sum matrix combine).

## Lineage

`lineage` maps header `id` → `{ parentIds?, childIds? }` after split/combine. Used for provenance display, not undo.

## Parser

`parseYamlProject` in `src/schema/yamlProject.ts` handles v2 bundles. v1 stage bundles are upgraded via `migrateCatalogProject` in `src/project/migrateProject.ts`.
