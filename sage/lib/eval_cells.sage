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


def normalize_theta_inner_products(inner):
    """After label substitution, make products explicit (e.g. '2 1' -> '2*1')."""
    inner = re.sub(r"(\d)\s+(\d)", r"\1*\2", inner)
    inner = re.sub(r"(\d)\s+([a-zA-Z])", r"\1*\2", inner)
    inner = re.sub(r"([a-zA-Z])\s+(\d)", r"\1*\2", inner)
    inner = re.sub(r"(\d)([a-zA-Z])", r"\1*\2", inner)
    inner = re.sub(r"([a-zA-Z])(\d)", r"\1*\2", inner)
    inner = re.sub(r"(\d)(\d)", r"\1*\2", inner)
    return inner


def substitute_cell(latex, row_assignment, col_assignment):
    if not latex:
        return latex
    result = latex
    combined = dict(col_assignment)
    combined.update(row_assignment)

    def expand_theta_inner(inner):
        inner = normalize_greek(inner)
        norm_combined = normalize_assignment(combined)
        for label in sorted(norm_combined.keys(), key=len, reverse=True):
            inner = inner.replace(label, str(norm_combined[label]))
        return normalize_theta_inner_products(inner)

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


def looks_like_q_polynomial(latex):
    if not latex or "\\theta" in latex or "\\delta" in latex:
        return False
    s = strip_latex(latex.replace("{", "").replace("}", ""))
    return re.match(r"^[\d\sq\^\+\-\(\)\*]*$", s) is not None


def eval_superchar_cell_at_q(latex, q, K):
    """Evaluate a condensed supercharacter cell (polynomial in q only)."""
    if not latex or latex == "0":
        return K.zero()
    if latex == "1":
        return K.one()
    if not looks_like_q_polynomial(latex):
        raise ValueError("supercharacter cell is not a q-polynomial: %s" % latex)
    s = strip_latex(latex.replace("{", "").replace("}", "")).replace(" ", "")
    if s == "q(q-1)":
        return K((q - 1) * q)
    if s.startswith("-"):
        return -eval_superchar_cell_at_q(s[1:], q, K)
    return K(eval_q_polynomial(s, q))


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
