# Agent guide

Read [ARCHITECTURE.md](ARCHITECTURE.md) first for domain model, data flow, and module map.

## Before changing code

1. Run `npm run test` to establish baseline.
2. Identify whether your change touches **working table**, **checkpoint view**, or **catalog** — checkpoint/undo semantics are subtle (`src/store/checkpointNavigation.test.ts`).
3. Character vs supercharacter tables follow different validation paths (`tableType` in schema).

## Common pitfalls

- **`setTable` clears undo history**; prefer `dispatchOp` for edits that should be undoable.
- **Two table render paths were merged** — production uses `EditableCharacterTableView` only (under `src/components/characterTable/`).
- **Expansion counts** must match between enumerated assignments and declared `expansionCount` fields before Sage checks run.
- **Combine vs split** both go through `applyTransformToTable`; both log to `transformLog`.
- **`ut3SupercharacterCondensedExample`** is the 3×3 condensed table; **`ut3SupercharacterFullExample`** is the 5×5 working preset.

## Finishing work

```bash
npm run lint && npm run test && npm run build
```

Do not re-add Storybook unless explicitly requested — it was removed to shrink the dependency surface.

## Docs

- [docs/table-schema.md](docs/table-schema.md) — character table YAML
- [docs/project-schema.md](docs/project-schema.md) — v2 project bundles
- [docs/jupyter-setup.md](docs/jupyter-setup.md) — local Sage kernel
