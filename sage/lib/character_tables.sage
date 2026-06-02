# Character table expansion and checks (SageMath).
# Loaded as preamble by the app; TABLE is set via json.loads from TypeScript.

import json
import re

# Executed as Python in Jupyter (not Sage preparsing); import explicitly.
from sage.all import GF, CyclotomicField

def _json_safe(obj):
    """Convert Sage integers and other values to JSON-serializable Python types."""
    if obj is None or isinstance(obj, str):
        return obj
    if isinstance(obj, bool):
        return obj
    if type(obj) in (int, float):
        return obj
    # Sage Integer and similar numeric parents
    try:
        if hasattr(obj, "is_integer") and obj.is_integer():
            return int(obj)
    except (TypeError, ValueError, AttributeError):
        pass
    try:
        return int(obj)
    except (TypeError, ValueError):
        pass
    try:
        return float(obj)
    except (TypeError, ValueError):
        pass
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    return str(obj)


def sage_emit(check_id, q, ok, details=None):
    q_out = int(q)
    line = "CHECK id=%s q=%s ok=%s" % (check_id, q_out, ok)
    if details is not None:
        line += " details_json=" + json.dumps(_json_safe(details))
    print(line)


def strip_latex(s):
    return re.sub(r"\s", "", s).replace("\\cdot", "*")


def eval_q_polynomial_atom(s, q):
    s = strip_latex(s)
    if s == "1":
        return 1
    if s == "q":
        return q
    m = re.match(r"^q\^(\d+)$", s)
    if m:
        return q ** int(m.group(1))
    if s == "(q-1)":
        return q - 1
    if s == "(q-1)q":
        return (q - 1) * q
    m = re.match(r"^\(q-1\)\^(\d+)$", s)
    if m:
        return (q - 1) ** int(m.group(1))
    m = re.match(r"^\(q-1\)q\^(\d+)$", s)
    if m:
        return (q - 1) * (q ** int(m.group(1)))
    m = re.match(r"^\(q-1\)\^(\d+)q$", s)
    if m:
        return (q - 1) ** int(m.group(1)) * q
    m = re.match(r"^\(q\+1\)$", s)
    if m:
        return q + 1
    m = re.match(r"^\(q-1\)\^(\d+)\(q\+1\)$", s)
    if m:
        return (q - 1) ** int(m.group(1)) * (q + 1)
    raise ValueError("Unsupported q-polynomial: %s" % s)


def matching_close(s, open_idx):
    depth = 0
    for i in range(open_idx, len(s)):
        if s[i] == "(":
            depth += 1
        elif s[i] == ")":
            depth -= 1
            if depth == 0:
                return i
    return -1


def find_top_level_minus(s):
    depth = 0
    for i, ch in enumerate(s):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == "-" and depth == 0 and i > 0:
            return i
    return -1


def split_top_level_factors(s):
    factors = []
    i = 0
    while i < len(s):
        if s[i] == "(":
            close = matching_close(s, i)
            if close < 0:
                return None
            if close + 1 < len(s) and s[close + 1] == "(":
                factors.append(s[i : close + 1])
                i = close + 1
            else:
                factors.append(s[i:])
                i = len(s)
        else:
            nxt = s.find("(", i)
            chunk = s[i:nxt] if nxt >= 0 else s[i:]
            if chunk:
                factors.append(chunk)
            i = nxt if nxt >= 0 else len(s)
    return factors if len(factors) > 1 else None


def eval_q_polynomial(latex, q):
    q = int(q)
    s = strip_latex(latex.replace("{", "").replace("}", ""))
    if s.startswith("(") and matching_close(s, 0) == len(s) - 1:
        return eval_q_polynomial(s[1:-1], q)
    mi = find_top_level_minus(s)
    if mi >= 0:
        return eval_q_polynomial(s[:mi], q) - eval_q_polynomial(s[mi + 1 :], q)
    factors = split_top_level_factors(s)
    if factors:
        prod = 1
        for f in factors:
            prod *= eval_q_polynomial(f, q)
        return prod
    return int(eval_q_polynomial_atom(s, q))


def normalize_restriction(latex):
    return (
        latex.replace("\\neg", "not")
        .replace("\\neq", "!=")
        .replace("\\ne", "!=")
        .replace("≠", "!=")
        .replace("\\cdot", "*")
        .replace("{", "")
        .replace("}", "")
        .replace(" ", "")
        .strip()
    )


def parse_equality_chain(expr):
    parts = expr.split("=")
    if len(parts) < 2:
        return None
    result = []
    for part in parts:
        if re.match(r"^\d+$", part):
            result.append(int(part))
        elif part:
            result.append(part)
        else:
            return None
    return result


def satisfies_restriction(restriction_latex, assignment):
    if not restriction_latex:
        return True
    expr = normalize_restriction(restriction_latex)
    if expr.startswith("not(") and expr.endswith(")"):
        inner = expr[4:-1]
        chain = parse_equality_chain(inner)
        if chain:
            last = chain[-1]
            if isinstance(last, int):
                labels = chain[:-1]
                return not all(assignment.get(lb) == last for lb in labels)
            return not all(
                isinstance(lb, str) and assignment.get(lb) == 0 for lb in chain
            )
    m = re.match(r"^(.+)!=(.+)=0$", expr)
    if m:
        left, right = m.group(1), m.group(2)
        return assignment.get(left) != assignment.get(right) and assignment.get(right) == 0
    m = re.match(r"^(.+)!=(.+)$", expr)
    if m:
        return assignment.get(m.group(1)) != assignment.get(m.group(2))
    chain = parse_equality_chain(expr)
    if chain and isinstance(chain[-1], int):
        target = chain[-1]
        return all(assignment.get(lb) == target for lb in chain[:-1])
    return True


def header_to_diagram(spec, n):
    arcs = []
    for pos_key, pos in [("above", "above"), ("below", "below")]:
        for label, pairs in (spec.get("arcs") or {}).get(pos_key, {}).items():
            if not pairs:
                continue
            if pairs and isinstance(pairs[0], int):
                pair_list = [pairs]
            else:
                pair_list = pairs
            for fr, to in pair_list:
                arcs.append({"label": label, "position": pos, "from": fr, "to": to})
    return {
        "n": n,
        "arcs": arcs,
        "restriction": spec.get("restriction"),
    }


def collect_labels(diagram):
    above = []
    below = []
    seen_a = set()
    seen_b = set()
    for arc in diagram.get("arcs") or []:
        lb = arc["label"]
        if arc["position"] == "above" and lb not in seen_a:
            seen_a.add(lb)
            above.append(lb)
        elif arc["position"] == "below" and lb not in seen_b:
            seen_b.add(lb)
            below.append(lb)
    return above, below


def enumerate_assignments(above_labels, below_labels, q, restriction_latex=None):
    q = int(q)
    all_labels = list(above_labels) + list(below_labels)
    value_lists = []
    for lb in above_labels:
        value_lists.append(list(range(1, q)))
    for lb in below_labels:
        value_lists.append(list(range(q)))
    if not all_labels:
        return [{}]
    results = []

    def recurse(idx, current):
        if idx == len(all_labels):
            if satisfies_restriction(restriction_latex, current):
                results.append(dict(current))
            return
        for val in value_lists[idx]:
            current[all_labels[idx]] = val
            recurse(idx + 1, current)

    recurse(0, {})
    return results


def expand_header(spec, n, prefix, q):
    diagram = header_to_diagram(spec, n)
    above, below = collect_labels(diagram)
    assignments = enumerate_assignments(
        above, below, q, diagram.get("restriction")
    )
    if not assignments:
        return [{"id": prefix + "_empty", "assignment": {}}]
    slices = []
    for i, assignment in enumerate(assignments):
        slices.append({"id": "%s_%d" % (prefix, i), "assignment": assignment})
    return slices


def infer_n(table):
    if table.get("n") is not None and table["n"] >= 1:
        return table["n"]
    mx = 1
    for spec in table.get("columns", []) + table.get("rows", []):
        for pos in ["above", "below"]:
            for pairs in (spec.get("arcs") or {}).get(pos, {}).values():
                if not pairs:
                    continue
                if isinstance(pairs[0], int):
                    pair_list = [pairs]
                else:
                    pair_list = pairs
                for fr, to in pair_list:
                    mx = max(mx, fr, to)
    return mx


def expansion_count_at_q(spec, n, q):
    if spec.get("restriction") and not spec.get("expansionCount"):
        raise ValueError("expansionCount required when restriction is set")
    if spec.get("expansionCount"):
        return eval_q_polynomial(spec["expansionCount"], q)
    diagram = header_to_diagram(spec, n)
    above, below = collect_labels(diagram)
    if not above and not below:
        return 1
    return len(
        enumerate_assignments(above, below, q, diagram.get("restriction"))
    )


def normalize_greek(expr):
    return expr.replace("\\", "")


def normalize_assignment(assignment):
    return {normalize_greek(k): v for k, v in assignment.items()}


def eval_linear_form(expr, assignment):
    s = normalize_greek(strip_latex(expr))
    if re.match(r"^\d+$", s):
        return int(s)
    parts = re.split(r"(?=[+-])|(?<=[+-])", s)
    parts = [p for p in parts if p]
    if len(parts) <= 1:
        return eval_product(s, assignment)
    total = 0
    sign = 1
    for part in parts if len(parts) > 1 else [s]:
        if part == "+":
            sign = 1
            continue
        if part == "-":
            sign = -1
            continue
        total += sign * eval_product(part.lstrip("+-"), assignment)
        sign = 1
    return total


def eval_product(expr, assignment):
    s = strip_latex(expr)
    if re.match(r"^\d+$", s):
        return int(s)
    if "*" in s:
        prod = 1
        for part in s.split("*"):
            prod *= eval_product(part, assignment)
        return prod
    labels = sorted(assignment.keys(), key=len, reverse=True)
    remaining = s
    product = 1
    matched = False
    while remaining:
        found = False
        for label in labels:
            if remaining.startswith(label):
                product *= assignment[label]
                remaining = remaining[len(label) :]
                found = True
                matched = True
                break
        if not found:
            m = re.match(r"^(\d+)", remaining)
            if m:
                product *= int(m.group(1))
                remaining = remaining[len(m.group(1)) :]
                matched = True
            else:
                break
    if not matched and re.match(r"^\d+$", s):
        return int(s)
    return product


def substitute_cell(latex, row_assignment, col_assignment):
    if not latex:
        return latex
    result = latex
    combined = dict(col_assignment)
    combined.update(row_assignment)

    def expand_theta_inner(inner):
        inner = normalize_greek(inner)
        for label in sorted(combined.keys(), key=len, reverse=True):
            inner = inner.replace(label, str(combined[label]))
        return inner

    result = re.sub(
        r"\\theta\(([^)]+)\)",
        lambda m: "\\theta(%s)" % expand_theta_inner(m.group(1)),
        result,
    )
    for label in sorted(combined.keys(), key=len, reverse=True):
        val = str(combined[label])
        result = re.sub(
            r"(?<!\\)(?<![a-zA-Z])%s(?![a-zA-Z])" % re.escape(label),
            val,
            result,
        )
    return result


def _field_to_int(x):
    return int(x)


class _CyclotomicAdditiveCharacter:
    """Nontrivial additive character theta(x) = zeta_q^x on F_q."""

    def __init__(self, F, K):
        self._F = F
        self._zeta = K.gen()

    def __call__(self, x):
        return self._zeta ** _field_to_int(x)


def additive_theta(q):
    q = int(q)
    F = GF(q)
    K = CyclotomicField(q)
    return F, _CyclotomicAdditiveCharacter(F, K)


def value_field(q):
    return CyclotomicField(q)


def eval_delta(lhs, rhs, row_assignment, col_assignment):
    combined = normalize_assignment(dict(col_assignment))
    combined.update(normalize_assignment(row_assignment))
    lv = eval_linear_form(lhs, combined)
    rv = eval_linear_form(rhs, combined)
    return 1 if lv == rv else 0


def split_factors(latex):
    s = strip_latex(latex)
    if not s:
        return []
    factors = []
    i = 0
    while i < len(s):
        if s.startswith("\\delta_", i):
            close = s.find("}", i)
            if close < 0:
                raise ValueError("Unclosed delta")
            factors.append(s[i : close + 1])
            i = close + 1
            continue
        if s.startswith("\\theta(", i):
            close = s.find(")", i)
            if close < 0:
                raise ValueError("Unclosed theta")
            factors.append(s[i : close + 1])
            i = close + 1
            continue
        if s[i] == "*":
            i += 1
            continue
        if s[i] == "(":
            depth = 0
            j = i
            while j < len(s):
                if s[j] == "(":
                    depth += 1
                elif s[j] == ")":
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
                j += 1
            factors.append(s[i:j])
            i = j
            continue
        specials = [x for x in [s.find("\\delta_", i), s.find("\\theta(", i), s.find("(", i), s.find("*", i)] if x >= 0]
        end = min(specials) if specials else len(s)
        chunk = s[i:end]
        if chunk:
            factors.append(chunk)
        i = end if end > i else i + 1
    return factors


def is_q_poly_atom(factor):
    t = factor.replace("{", "").replace("}", "")
    return t == "1" or t == "q" or re.match(r"^q\^\d+$", t) or t.startswith("(q")


def eval_cell_at_q(latex, row_assignment, col_assignment, q, F, chi, K):
    if not latex or latex == "0":
        return K.zero()
    if latex == "1":
        return K.one()
    combined = normalize_assignment(dict(col_assignment))
    combined.update(normalize_assignment(row_assignment))

    def replace_deltas(s):
        def repl(m):
            inner = normalize_greek(m.group(1).replace(" ", ""))
            eq = inner.split("=")
            if len(eq) != 2:
                raise ValueError("bad delta")
            return str(eval_delta(eq[0], eq[1], row_assignment, col_assignment))

        return re.sub(r"\\delta_\{([^}]+)\}", repl, s)

    substituted = substitute_cell(replace_deltas(latex), row_assignment, col_assignment)
    substituted = re.sub(r"q(\d)", r"q*\1", substituted)
    product = K.one()
    for factor in split_factors(substituted):
        if factor in ("", "1"):
            continue
        if factor == "0":
            return K.zero()
        m = re.match(r"\\theta\(([^)]+)\)", factor)
        if m:
            inner = m.group(1)
            field_elt = eval_linear_form(inner, combined) % q
            product *= chi(F(field_elt))
            continue
        if is_q_poly_atom(factor):
            product *= K(eval_q_polynomial(factor, q))
            continue
        if re.match(r"^\d+$", factor):
            product *= K(int(factor))
            continue
        linear = eval_linear_form(factor, combined)
        product *= K(linear)
    return product


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
    row_values = []
    matrix = table.get("matrix") or []
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
                    )
                )
            row_values.append(values)
    group_order = eval_q_polynomial(table["groupOrder"], q) if table.get("groupOrder") else None
    return {
        "q": q,
        "groupOrder": group_order,
        "flatRows": flat_rows,
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
                            "expected": expected,
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
                    )
                    sum_sq += z * z.conjugate()
        ok = sum_sq == K(G)
        sage_emit(
            check_id,
            q,
            ok,
            {"sumSq": str(sum_sq), "groupOrder": G},
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
                bad.append({"rowIndex": row_index, "sum": str(total)})
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
