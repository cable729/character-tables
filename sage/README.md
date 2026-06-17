# Sage check library

The app bundles split modules under [`lib/`](lib/) into one Jupyter execute call. TypeScript concatenates them via [`src/sage/sageLibModules.ts`](../src/sage/sageLibModules.ts); the monolithic [`lib/character_tables.sage`](lib/character_tables.sage) is regenerated for REPL use:

```bash
npm run bundle:sage
```

## Module layout

| File | Role |
|------|------|
| `_common.sage` | JSON emit helpers, `strip_latex` |
| `q_polynomial.sage` | Class-size / expansion-count polynomials |
| `diagram.sage` | Restrictions, assignment enumeration, header expansion |
| `eval_cells.sage` | θ/δ substitution, linear forms, `eval_cell_at_q` |
| `expanded_table.sage` | Full table expansion and caching |
| `checks.sage` | `run_*_check` entry points |

## Tests

**TypeScript** (always run with `npm test`):

- `src/expansion/substituteCell.test.ts` — θ inner parsing
- `src/expansion/evalCell.test.ts` — cell evaluation
- `src/expansion/orthogonality.test.ts` — expanded row orthogonality
- `src/sage/sageLibModules.test.ts` — bundle integrity

**Sage** (optional, needs Jupyter + Sage kernel):

```bash
JUPYTER_URL='http://localhost:8888/?token=…' npm run test:sage
```

Sage tests live in [`tests/test_eval.sage`](tests/test_eval.sage).

Check IDs and `CHECK id=... q=... ok=...` lines are parsed in [`src/checks/parseSageOutput.ts`](../src/checks/parseSageOutput.ts).

## REPL

```bash
sage
load('sage/lib/character_tables.sage')
# paste TABLE dict and call run_row_orthogonality_check(TABLE, "row-orthogonality", [2,3])
```
