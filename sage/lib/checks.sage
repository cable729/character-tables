def run_theta_sum_check(check_id, q_values):
    ok_all = True
    for q in q_values:
        q = int(q)
        F = GF(q)
        K = CyclotomicField(q)
        zeta = K.gen()
        c = F.gen()
        if c == 0:
            c = F.one()
        total = sum(zeta ** _field_to_int(c * x) for x in F)
        ok = total == K.zero()
        sage_emit(check_id, q, ok, {"sum": str(total)})
        ok_all = ok_all and ok
    return ok_all


def run_conjugacy_check(table, check_id, q_values):
    if not table.get("groupOrder"):
        raise ValueError("groupOrder required")
    n = infer_n(table)
    ok_all = True
    for q in q_values:
        total = 0
        cols = []
        for col in table.get("columns", []):
            nj = expansion_count_at_q(col, n, q)
            cj = eval_q_polynomial(col.get("classSize") or "1", q)
            total += nj * cj
            cols.append({"nAtQ": nj, "sizeAtQ": cj})
        expected = eval_q_polynomial(table["groupOrder"], q)
        ok = total == expected
        sage_emit(
            check_id,
            q,
            ok,
            {"sumAtQ": total, "groupOrderAtQ": expected, "columns": cols},
        )
        ok_all = ok_all and ok
    return ok_all


def run_count_balance_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        rt = flat_expanded_row_count(table, q)
        ct = flat_expanded_col_count(table, q)
        ok = rt == ct
        sage_emit(check_id, q, ok, {"rowTotal": rt, "colTotal": ct})
        ok_all = ok_all and ok
    return ok_all


def _orthogonality_table_meta(table):
    m = table.get("matrix") or []
    cols = table.get("columns") or []
    col7 = cols[7] if len(cols) > 7 else {}
    above = (col7.get("arcs") or {}).get("above") or {}
    row = m[5] if len(m) > 5 else []
    return {
        "cell57": row[7] if len(row) > 7 else None,
        "col7b": above.get("b"),
    }


def run_row_orthogonality_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        exp = get_expanded_table(table, q)
        G = exp["groupOrder"]
        flat_rows = exp["flatRows"]
        row_values = exp["rowValues"]
        weights = exp["flatColWeights"]
        K = exp["K"]
        bad = []
        for i in range(len(flat_rows)):
            for k in range(len(flat_rows)):
                ip = weighted_dot(row_values[i], row_values[k], weights)
                expected = G if i == k else 0
                if i == k:
                    ok_pair = ip == K(expected)
                else:
                    ok_pair = ip == K.zero()
                if not ok_pair and len(bad) < 10:
                    bad.append(
                        {
                            "a": flat_rows[i]["key"],
                            "b": flat_rows[k]["key"],
                            "ip": str(ip),
                            "ipRe": str(ip),
                            "expected": int(G) if i == k else 0,
                        }
                    )
        ok = len(bad) == 0
        sage_emit(
            check_id,
            q,
            ok,
            {
                "badPairs": bad,
                "groupOrder": G,
                "tableMeta": _orthogonality_table_meta(table),
            },
        )
        ok_all = ok_all and ok
    return ok_all


def run_column_orthogonality_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        exp = get_expanded_table(table, q)
        G = exp["groupOrder"]
        flat_cols = exp["flatCols"]
        row_values = exp["rowValues"]
        K = exp["K"]
        bad = []
        n_cols = len(flat_cols)
        for j in range(n_cols):
            for k in range(n_cols):
                ip = column_dot(row_values, j, k)
                if j == k:
                    weight = flat_cols[j]["classWeight"]
                    expected = G // weight if weight else G
                    ok_pair = ip == K(expected)
                    expected_out = int(expected)
                else:
                    ok_pair = ip == K.zero()
                    expected_out = 0
                if not ok_pair and len(bad) < 10:
                    bad.append(
                        {
                            "a": flat_cols[j]["key"],
                            "b": flat_cols[k]["key"],
                            "ip": str(ip),
                            "ipRe": str(ip),
                            "expected": expected_out,
                        }
                    )
        ok = len(bad) == 0
        sage_emit(check_id, q, ok, {"badPairs": bad, "groupOrder": G})
        ok_all = ok_all and ok
    return ok_all


def run_degree_sum_check(table, check_id, q_values):
    ok_all = True
    n = infer_n(table)
    for q in q_values:
        F, chi = additive_theta(q)
        K = value_field(q)
        G = eval_q_polynomial(table["groupOrder"], q)
        col0_slices = expand_header(table["columns"][0], n, "h0", q)
        sum_sq = K.zero()
        for row_index, row_spec in enumerate(table.get("rows", [])):
            row_slices = expand_header(row_spec, n, "h%d" % row_index, q)
            latex = table["matrix"][row_index][0]
            for row_slice in row_slices:
                for col_slice in col0_slices:
                    z = eval_cell_at_q(
                        latex,
                        row_slice["assignment"],
                        col_slice["assignment"],
                        q,
                        F,
                        chi,
                        K,
                        row_header=row_spec,
                        col_header=table["columns"][0],
                        n=n,
                    )
                    sum_sq += z * z.conjugate()
        ok = sum_sq == K(G)
        sage_emit(
            check_id,
            q,
            ok,
            {"sumSq": str(sum_sq), "groupOrder": int(G)},
        )
        ok_all = ok_all and ok
    return ok_all


def run_trivial_orthogonality_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        exp = get_expanded_table(table, q)
        G = exp["groupOrder"]
        K = exp["K"]
        bad = []
        for row_index in range(len(table.get("rows", []))):
            total = K.zero()
            for i, fr in enumerate(exp["flatRows"]):
                if fr["rowIndex"] != row_index:
                    continue
                total += weighted_column_sum(
                    exp["rowValues"][i], exp["flatColWeights"]
                )
            if row_index == 0:
                ok_row = total == K(G)
            else:
                ok_row = total == K.zero()
            if not ok_row:
                bad.append(
                    {
                        "rowIndex": row_index,
                        "sum": str(total),
                        "sumRe": str(total),
                        "sumIm": 0,
                    }
                )
        ok = len(bad) == 0
        sage_emit(check_id, q, ok, {"badRows": bad, "groupOrder": G})
        ok_all = ok_all and ok
    return ok_all


def run_norm_identity_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        exp = get_expanded_table(table, q)
        G = exp["groupOrder"]
        K = exp["K"]
        bad = []
        for i, fr in enumerate(exp["flatRows"]):
            norm = weighted_norm_sq(exp["rowValues"][i], exp["flatColWeights"])
            if norm != K(G) and len(bad) < 10:
                bad.append({"key": fr["key"], "normSum": str(norm)})
        ok = len(bad) == 0
        sage_emit(check_id, q, ok, {"badRows": bad, "groupOrder": G})
        ok_all = ok_all and ok
    return ok_all


def run_duplicate_irrep_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        exp = get_expanded_table(table, q)
        flat_rows = exp["flatRows"]
        row_values = exp["rowValues"]
        weights = exp["flatColWeights"]
        K = exp["K"]
        dups = []
        for i in range(len(flat_rows)):
            for k in range(i + 1, len(flat_rows)):
                ip_aa = weighted_dot(row_values[i], row_values[i], weights)
                if ip_aa == K.zero():
                    continue
                ip_ab = weighted_dot(row_values[i], row_values[k], weights)
                ip_bb = weighted_dot(row_values[k], row_values[k], weights)
                cross_sq = ip_ab * ip_ab.conjugate()
                norm_prod = ip_aa * ip_bb
                if cross_sq == norm_prod and norm_prod != K.zero():
                    dups.append(
                        {"a": flat_rows[i]["key"], "b": flat_rows[k]["key"]}
                    )
                    if len(dups) >= 10:
                        break
            if len(dups) >= 10:
                break
        ok = len(dups) == 0
        sage_emit(check_id, q, ok, {"duplicatePairs": dups})
        ok_all = ok_all and ok
    return ok_all


def run_arc_pattern_check(table, check_id, q_values):
    ok_all = True
    n = infer_n(table)
    for q in q_values:
        F, chi = additive_theta(q)
        K = value_field(q)
        violations = []
        for row_index, row_spec in enumerate(table.get("rows", [])):
            row_slices = expand_header(row_spec, n, "h%d" % row_index, q)
            for col_index, col_spec in enumerate(table.get("columns", [])):
                latex = table["matrix"][row_index][col_index]
                if latex == "0":
                    continue
                col_diagram = header_to_diagram(col_spec, n)
                row_diagram = header_to_diagram(row_spec, n)
                col_above, _ = collect_labels(col_diagram)
                row_above, _ = collect_labels(row_diagram)
                if not col_above and not row_above:
                    continue
                col_slices = expand_header(col_spec, n, "h%d" % col_index, q)
                for row_slice in row_slices:
                    for col_slice in col_slices:
                        z = eval_cell_at_q(
                            latex,
                            row_slice["assignment"],
                            col_slice["assignment"],
                            q,
                            F,
                            chi,
                            K,
                            row_header=row_spec,
                            col_header=col_spec,
                            n=n,
                        )
                        if z == K.zero():
                            violations.append(
                                "[%d,%d] vanishes" % (row_index, col_index)
                            )
                            if len(violations) >= 5:
                                break
                    if len(violations) >= 5:
                        break
                if len(violations) >= 5:
                    break
            if len(violations) >= 5:
                break
        ok = len(violations) == 0
        sage_emit(check_id, q, ok, {"violations": violations})
        ok_all = ok_all and ok
    return ok_all


def run_superchar_superclass_sizes_check(table, check_id, q_values):
    if not table.get("groupOrder"):
        raise ValueError("groupOrder required")
    ok_all = True
    for q in q_values:
        total = 0
        cols = []
        for col in table.get("columns", []):
            kj = eval_q_polynomial(col.get("classSize") or "1", q)
            total += kj
            cols.append({"sizeAtQ": kj})
        expected = eval_q_polynomial(table["groupOrder"], q)
        ok = total == expected
        sage_emit(
            check_id,
            q,
            ok,
            {"sumAtQ": total, "groupOrderAtQ": expected, "columns": cols},
        )
        ok_all = ok_all and ok
    return ok_all


def run_superchar_orthogonal_basis_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        K = value_field(q)
        n_rows = len(table.get("rows", []))
        n_cols = len(table.get("columns", []))
        weights = [
            eval_q_polynomial(col.get("classSize") or "1", q)
            for col in table.get("columns", [])
        ]
        matrix = table.get("matrix") or []
        row_values = []
        for i in range(n_rows):
            values = []
            for j in range(n_cols):
                latex = matrix[i][j] if i < len(matrix) and j < len(matrix[i]) else "0"
                values.append(
                    eval_superchar_cell_at_q(latex, q, K)
                )
            row_values.append(values)
        bad = []
        for i in range(n_rows):
            for k in range(n_rows):
                ip = weighted_dot(row_values[i], row_values[k], weights)
                if i == k:
                    ok_pair = ip != K.zero()
                else:
                    ok_pair = ip == K.zero()
                if not ok_pair and len(bad) < 10:
                    bad.append(
                        {
                            "a": i,
                            "b": k,
                            "ip": str(ip),
                            "expected": "nonzero" if i == k else 0,
                        }
                    )
        ok = len(bad) == 0
        sage_emit(check_id, q, ok, {"badPairs": bad})
        ok_all = ok_all and ok
    return ok_all


def run_superchar_identity_regular_check(table, check_id, q_values):
    ok_all = True
    for q in q_values:
        G = eval_q_polynomial(table["groupOrder"], q)
        columns = table.get("columns", [])
        issues = []
        if columns:
            k0 = eval_q_polynomial(columns[0].get("classSize") or "1", q)
            if k0 != 1:
                issues.append("|K_0| = %s, expected 1" % k0)
        size_sum = sum(
            eval_q_polynomial(col.get("classSize") or "1", q) for col in columns
        )
        if size_sum != G:
            issues.append("Σ|K_j| = %s, |G| = %s" % (size_sum, G))
        ok = len(issues) == 0
        sage_emit(
            check_id,
            q,
            ok,
            {"issues": issues, "groupOrder": int(G), "sizeSum": int(size_sum)},
        )
        ok_all = ok_all and ok
    return ok_all
