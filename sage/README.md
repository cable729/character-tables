# Sage check library

The app bundles [`lib/character_tables.sage`](lib/character_tables.sage) into a single Jupyter execute call. TypeScript serializes the table as JSON and invokes runners such as `run_row_orthogonality_check(TABLE, "row-orthogonality", q_values)`.

To experiment outside the browser (with SageMath installed):

```bash
sage -python -c "
load('sage/lib/character_tables.sage')
# paste TABLE dict and call run_theta_sum_check('theta-sum', [2,3,5])
"
```

Check IDs and `CHECK id=... q=... ok=...` lines are parsed in [`src/checks/parseSageOutput.ts`](../src/checks/parseSageOutput.ts).
