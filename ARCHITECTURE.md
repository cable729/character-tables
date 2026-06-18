# Architecture

Interactive workbench for condensed character tables over finite fields in general **q**. React + TypeScript frontend; Sage numeric checks run in a local Jupyter kernel.

## Domain model

| Concept | Location | Description |
|---------|----------|-------------|
| `CharacterTable` | `src/types/characterTable.ts` | Matrix + row/column `HeaderSpec` (arcs, restrictions, class sizes, expansion counts) |
| `Diagram` | derived in `src/diagram/utils.ts` | Render view: `n`, arcs, restriction — built from a header |
| `TableProject` | `src/types/tableProject.ts` | v2 project: `workingTable`, checkpoints, undo history, `transformLog`, `lineage` |
| `ProjectCatalog` | `src/types/projectCatalog.ts` | Multi-project UI wrapper with per-project editor prefs |

Example tables live as YAML in `src/examples/*.yaml`, loaded via thin wrappers in `src/data/`.

## Data flow

```
YAML / editor  →  parseCharacterTable  →  CharacterTable
                    ↓
              headerToDiagram  →  expandRowOrCol / enumerateAssignments
                    ↓
              evalCellAtQ, expansionCountAtQ  →  checks + display
                    ↓
              wrapDisplayLatex / MathCell  →  rendered table
```

**Expansion counting** has two paths that must agree for Sage checks:
1. **Enumerated** — count assignment labelings via `restrictions.ts`
2. **Declared** — sum explicit or inferred `expansionCount` polynomials

## State management

Two Zustand stores:

### `useTableStore` (`src/store/tableStore.ts`)

Composed from slices in `src/store/*Actions.ts`:

| Slice | Responsibility |
|-------|----------------|
| `catalogActions` | Project CRUD, UI prefs (`showEditor`, `compactMath`) |
| `historyActions` | `dispatchOp`, undo/redo, `setTable` |
| `checkpointActions` | Save/load checkpoints |
| `yamlActions` | YAML editor import/export |
| `tableEditActions` | Row/column edits, split/combine headers |

Only `catalog` is persisted to `localStorage` (`character-table-v7`). Active `table`/`project` are derived from the catalog's active project.

**Checkpoint semantics:** see `src/store/checkpointNavigation.test.ts` — viewing a checkpoint does not overwrite `workingTable`; undo is per-context.

### `useJupyterStore` (`src/store/jupyterStore.ts`)

Jupyter connection lifecycle and `executeSage` / `cancelSageExecution`. Not persisted.

## Header transforms

| Operation | Entry | Table mutation |
|-----------|-------|----------------|
| Split below label | `applySplitBelowLabel` → `applyTransformToTable` | `transforms/splitHeader.ts` |
| Combine headers | `applyCombineHeaders` → `applyTransformToTable` | `tableOps/combineHeaders.ts` |

Shared arc helpers: `src/diagram/arcUtils.ts`. Canonicalization: `src/headers/canonicalize.ts`.

## Checks

Plugin registry in `src/checks/registry.ts`. Each `TableCheck` has `runLocal` (browser) and optional `buildSageCode` (kernel).

- **Structural** — run in browser via `useStructuralCheckResults` in Sage panel
- **Sage numeric** — bundled into one kernel script via `buildCombinedSageCode`
- **Supercharacter** — separate check set from `supercharacterChecks.ts`

Sage library inlined from `sage/lib/character_tables.sage` via `src/sage/codegen.ts`.

## UI structure

```
App
├── Header (undo/redo, compact, YAML, help, settings, new table)
├── EditableCharacterTableView (src/components/characterTable/)
│   └── DiagramEditorDialog, CombineHeadersDialog, SplitHeaderDialog
├── TableEditorPanel (optional YAML split)
├── SettingsDrawer (project, group, table type, checkpoints, Jupyter)
├── HelpDialog (cell notation + getting started)
└── SageChecksPanel (src/components/sageChecks/) — "Character Table Checks"
```

## Key modules for agents

| Task | Start here |
|------|------------|
| Table editing / undo | `src/store/historyActions.ts`, `src/tableOps/applyOp.ts` |
| LaTeX / q-polynomials | `src/expansion/qPolynomial.ts`, `src/expansion/evalClassSize.ts` |
| Cell evaluation (θ, δ) | `src/expansion/evalCell.ts` |
| Display wrapping | `src/math/wrapDisplayLatex.ts` |
| Schema / YAML | `src/schema/tableSchema.ts`, `src/schema/yamlTable.ts` |
| Sage checks UI | `src/components/sageChecks/` |
| Benchmarks | `npm run benchmark:sage:by-q`, `scripts/lib/sage-bench.ts` |

## Verification

```bash
npm run lint && npm run test && npm run build
```

CI runs these on every push/PR (`.github/workflows/ci.yml`).
