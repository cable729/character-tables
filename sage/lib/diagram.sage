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
