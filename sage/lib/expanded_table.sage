def build_expanded_table(table, q):
    q = int(q)
    n = infer_n(table)
    F, chi = additive_theta(q)
    K = value_field(q)
    row_expansions = [
        expand_header(spec, n, "h%d" % idx, q)
        for idx, spec in enumerate(table.get("rows", []))
    ]
    col_expansions = [
        expand_header(spec, n, "h%d" % idx, q)
        for idx, spec in enumerate(table.get("columns", []))
    ]
    flat_col_weights = []
    flat_col_meta = []
    for col_index, col_slices in enumerate(col_expansions):
        spec = table["columns"][col_index]
        weight = eval_q_polynomial(spec.get("classSize") or "1", q)
        for col_slice in col_slices:
            flat_col_weights.append(weight)
            flat_col_meta.append((col_index, col_slice))
    flat_rows = []
    flat_cols = []
    row_values = []
    matrix = table.get("matrix") or []
    for col_index, col_slice in flat_col_meta:
        col_slice_index = len(
            [c for c in flat_cols if c["colIndex"] == col_index]
        )
        flat_cols.append(
            {
                "key": "%d:%d" % (col_index, col_slice_index),
                "colIndex": col_index,
                "colSliceIndex": col_slice_index,
                "classWeight": flat_col_weights[len(flat_cols)],
            }
        )
    for row_index, row_slices in enumerate(row_expansions):
        for row_slice_index, row_slice in enumerate(row_slices):
            flat_rows.append(
                {
                    "key": "%d:%d" % (row_index, row_slice_index),
                    "rowIndex": row_index,
                    "rowSliceIndex": row_slice_index,
                }
            )
            values = []
            for col_index, col_slice in flat_col_meta:
                if (
                    row_index < len(matrix)
                    and col_index < len(matrix[row_index])
                ):
                    latex = matrix[row_index][col_index]
                else:
                    latex = "0"
                values.append(
                    eval_cell_at_q(
                        latex,
                        row_slice["assignment"],
                        col_slice["assignment"],
                        q,
                        F,
                        chi,
                        K,
                        row_header=table["rows"][row_index],
                        col_header=table["columns"][col_index],
                        n=n,
                    )
                )
            row_values.append(values)
    group_order = eval_q_polynomial(table["groupOrder"], q) if table.get("groupOrder") else None
    return {
        "q": q,
        "groupOrder": group_order,
        "flatRows": flat_rows,
        "flatCols": flat_cols,
        "flatColWeights": flat_col_weights,
        "rowValues": row_values,
        "K": K,
    }


_EXPANDED_CACHE = {}


def get_expanded_table(table, q):
    """Build expanded table once per q per kernel execute (shared across checks)."""
    q = int(q)
    if q not in _EXPANDED_CACHE:
        print("SAGE_PROGRESS expanding table at q=%s" % q, flush=True)
        _EXPANDED_CACHE[q] = build_expanded_table(table, q)
    return _EXPANDED_CACHE[q]


def weighted_dot(a, b, weights):
    return sum(weights[i] * a[i] * b[i].conjugate() for i in range(len(weights)))


def weighted_column_sum(values, weights):
    return sum(weights[i] * values[i] for i in range(len(values)))


def weighted_norm_sq(values, weights):
    return sum(
        weights[i] * values[i] * values[i].conjugate()
        for i in range(len(weights))
    )


def column_dot(row_values, col_a, col_b):
    return sum(
        row_values[i][col_a] * row_values[i][col_b].conjugate()
        for i in range(len(row_values))
    )


def flat_expanded_row_count(table, q):
    n = infer_n(table)
    return sum(
        len(expand_header(spec, n, "h%d" % i, q))
        for i, spec in enumerate(table.get("rows", []))
    )


def flat_expanded_col_count(table, q):
    n = infer_n(table)
    return sum(
        len(expand_header(spec, n, "h%d" % i, q))
        for i, spec in enumerate(table.get("columns", []))
    )

