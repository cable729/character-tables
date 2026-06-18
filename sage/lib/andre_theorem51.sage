def _root_key(i, j):
    return "%d,%d" % (int(i), int(j))


def _parse_root_key(key):
    i, j = key.split(",")
    return int(i), int(j)


def _all_roots(n):
    n = int(n)
    roots = []
    for i in range(1, n + 1):
        for j in range(i + 1, n + 1):
            roots.append(_root_key(i, j))
    return roots


def _is_basic(D):
    rows = set()
    cols = set()
    for key in D:
        i, j = _parse_root_key(key)
        if i in rows or j in cols:
            return False
        rows.add(i)
        cols.add(j)
    return True


def _is_regular(i, j, Dprime):
    for k in range(i + 1, j):
        if _root_key(i, k) in Dprime or _root_key(k, j) in Dprime:
            return False
    return True


def _regular_roots(n, Dprime):
    return {
        key
        for key in _all_roots(n)
        if _is_regular(*_parse_root_key(key), Dprime)
    }


def _sc_star(D):
    S = set()
    for key in D:
        i, j = _parse_root_key(key)
        for a in range(i + 1, j):
            S.add(_root_key(a, j))
    return S


def _e_exponent(D, Dprime, n):
    R = _regular_roots(n, Dprime)
    return len(_sc_star(D) & R)


def _d_subset_r(D, Dprime):
    for key in D:
        if not _is_regular(*_parse_root_key(key), Dprime):
            return False
    return True


def _assignment_value(assignment, label):
    label = label.strip()
    candidates = [label]
    if label.startswith("\\"):
        candidates.append(label[1:])
    else:
        candidates.append("\\" + label)
    for c in candidates:
        if c in assignment:
            return assignment[c]
    norm = normalize_assignment(assignment)
    for c in candidates:
        nc = normalize_greek(c)
        if nc in norm:
            return norm[nc]
    return None


def basic_subset_from_header(header, assignment, n):
    diagram = header_to_diagram(header, n)
    active = {}
    for arc in diagram.get("arcs") or []:
        if arc.get("position") != "above":
            continue
        label = (arc.get("label") or "").strip()
        if not label:
            continue
        val = _assignment_value(assignment, label)
        if val is None or int(val) == 0:
            continue
        active[_root_key(arc["from"], arc["to"])] = int(val)
    for arc in diagram.get("arcs") or []:
        if arc.get("position") != "below":
            continue
        label = (arc.get("label") or "").strip()
        if not label:
            continue
        val = _assignment_value(assignment, label)
        if val is None:
            continue
        key = _root_key(arc["from"], arc["to"])
        for existing in list(active.keys()):
            ei, ej = _parse_root_key(existing)
            ki, kj = _parse_root_key(key)
            if ei == ki or ej == kj:
                del active[existing]
        active[key] = int(val)
    roots = set(active.keys())
    if not roots:
        return {"roots": roots, "phi": active}
    if not _is_basic(roots):
        return None
    return {"roots": roots, "phi": active}


def label_roots_from_header(header, n):
    """Map each arc label to its matrix coordinate (i, j)."""
    diagram = header_to_diagram(header, n)
    out = {}
    for arc in diagram.get("arcs") or []:
        label = (arc.get("label") or "").strip()
        if label:
            out[label] = (int(arc["from"]), int(arc["to"]))
    return out


def evaluate_andre_theorem51(
    row_header, row_assignment, col_header, col_assignment, n, q, F, chi, K
):
    """André (2001) Cor. 5.1 — character value on a class representative."""
    Ddata = basic_subset_from_header(row_header, row_assignment, n)
    Dprime_data = basic_subset_from_header(col_header, col_assignment, n)
    if not Ddata or not Dprime_data:
        return K.zero()
    D = Ddata["roots"]
    Dprime = Dprime_data["roots"]
    if not _d_subset_r(D, Dprime):
        return K.zero()
    e = _e_exponent(D, Dprime, n)
    product = K.one()
    for key in D:
        phi = Ddata["phi"].get(key, 0)
        x = Dprime_data["phi"].get(key, 0)
        product *= chi(F((phi * x) % int(q)))
    return K(int(q) ** e) * product


def evaluate_andre_from_label_maps(
    char_roots, char_values, class_roots, class_values, n, q, F, chi, K
):
    """
    André Cor. 5.1 from explicit label→(i,j) maps and slice values.
    Example: evaluate_andre_from_label_maps(
        {"\\\\alpha": (1,2), "\\\\beta": (2,3)},
        {"\\\\alpha": 1, "\\\\beta": 2},
        {"a": (1,2), "b": (2,3)},
        {"a": 2, "b": 1},
        4, q, F, chi, K)
    """

    def subset_from_maps(root_map, values):
        active = {}
        for label, pair in root_map.items():
            val = _assignment_value(values, label)
            if val is None:
                continue
            if int(val) == 0:
                continue
            active[_root_key(pair[0], pair[1])] = int(val)
        roots = set(active.keys())
        if roots and not _is_basic(roots):
            return None
        return {"roots": roots, "phi": active}

    Ddata = subset_from_maps(char_roots, char_values)
    Dprime_data = subset_from_maps(class_roots, class_values)
    if not Ddata or not Dprime_data:
        return K.zero()
    D = Ddata["roots"]
    Dprime = Dprime_data["roots"]
    if not _d_subset_r(D, Dprime):
        return K.zero()
    e = _e_exponent(D, Dprime, n)
    product = K.one()
    for key in D:
        phi = Ddata["phi"].get(key, 0)
        x = Dprime_data["phi"].get(key, 0)
        product *= chi(F((phi * x) % int(q)))
    return K(int(q) ** e) * product


def is_andre_cell(latex):
    if not latex:
        return False
    s = strip_latex(latex)
    return s in ("\\andre", "andre")
