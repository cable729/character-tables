# Sage unit tests for cell evaluation and θ parsing.
# Run via: npm run test:sage  (requires Jupyter + Sage kernel)

import json

_failures = []


def _check(name, cond, msg=""):
    if not cond:
        _failures.append({"name": name, "msg": msg})
        print("SAGE_TEST_FAIL %s %s" % (name, msg), flush=True)
    else:
        print("SAGE_TEST_OK %s" % name, flush=True)


# Mirrors src/expansion/thetaTestVectors.ts — keep in sync when adding cases.

def test_normalize_theta_inner_products():
    _check("norm_2_1", normalize_theta_inner_products("2 1") == "2*1")
    _check("norm_1_1", normalize_theta_inner_products("1 1") == "1*1")
    _check("norm_11", normalize_theta_inner_products("11") == "1*1")
    _check("norm_0_1", normalize_theta_inner_products("0 1") == "0*1")


def test_substitute_cell_alpha_a():
    row = {"\\alpha": 2}
    col = {"a": 1}
    sub = substitute_cell("\\theta(\\alpha a)", row, col)
    _check("subst_alpha_a", sub == "\\theta(2*1)", sub)


def test_substitute_cell_distinct_alpha():
    s1 = substitute_cell("\\theta(\\alpha a)", {"\\alpha": 1}, {"a": 1})
    s2 = substitute_cell("\\theta(\\alpha a)", {"\\alpha": 2}, {"a": 1})
    _check("subst_distinct", s1 != s2, "%s vs %s" % (s1, s2))


def test_eval_linear_form_products():
    _check("elf_2_1", eval_linear_form("2*1", {"a": 1}) == 2)
    _check("elf_1_2", eval_linear_form("1*2", {"a": 2}) == 2)
    _check("elf_21_bad", eval_linear_form("21", {"a": 1}) == 21)
    _check("elf_alpha_a", eval_linear_form("alpha*a", {"alpha": 2, "a": 1}) == 2)


def test_eval_cell_theta_field_elt():
    q = 3
    F, chi = additive_theta(q)
    K = value_field(q)
    z1 = eval_cell_at_q("\\theta(\\alpha a)", {"\\alpha": 1}, {"a": 1}, q, F, chi, K)
    z2 = eval_cell_at_q("\\theta(\\alpha a)", {"\\alpha": 2}, {"a": 1}, q, F, chi, K)
    _check("eval_distinct", z1 != z2, "%s vs %s" % (z1, z2))
    zeta = K.gen()
    _check("eval_alpha1", z1 == zeta, str(z1))
    _check("eval_alpha2", z2 == zeta ** 2, str(z2))


def test_parenthetical_theta_forms():
    """Test theta expressions with nested parens: θ(β(a+b)), θ((α+β)a)."""
    q = 3
    F, chi = additive_theta(q)
    K = value_field(q)
    zeta = K.gen()

    # substitute_cell: β(a+b) with β=1, a=1, b=1 → should produce 1*(1+1) or equivalent
    sub1 = substitute_cell("\\theta(\\beta(a+b))", {"\\beta": 1}, {"a": 1, "b": 1})
    _check("subst_beta_a_plus_b", "\\theta(" in sub1, sub1)
    # The inner should evaluate to 2 (1*(1+1) = 2), giving θ(2) = ζ₃²
    z1 = eval_cell_at_q("\\theta(\\beta(a+b))", {"\\beta": 1}, {"a": 1, "b": 1}, q, F, chi, K)
    _check("eval_beta_a_plus_b", z1 == zeta**2, "got %s, expected zeta^2=%s" % (z1, zeta**2))

    # substitute_cell: (α+β)a with α=1, β=1, a=1 → should produce (1+1)*1 or equivalent
    sub2 = substitute_cell("\\theta((\\alpha + \\beta)a)", {"\\alpha": 1, "\\beta": 1}, {"a": 1})
    _check("subst_alpha_plus_beta_a", "\\theta(" in sub2, sub2)
    # The inner should evaluate to 2 ((1+1)*1 = 2), giving θ(2) = ζ₃²
    z2 = eval_cell_at_q("\\theta((\\alpha + \\beta)a)", {"\\alpha": 1, "\\beta": 1}, {"a": 1}, q, F, chi, K)
    _check("eval_alpha_plus_beta_a", z2 == zeta**2, "got %s, expected zeta^2=%s" % (z2, zeta**2))

    # θ(2βa) with β=1, a=1 → 2*1*1 = 2, θ(2) = ζ₃²
    z3 = eval_cell_at_q("\\theta(2\\beta a)", {"\\beta": 1}, {"a": 1}, q, F, chi, K)
    _check("eval_2_beta_a", z3 == zeta**2, "got %s, expected zeta^2=%s" % (z3, zeta**2))

    # θ([βa-γb,γa]) bracket with β=1,γ=1,a=1,b=0 → θ([1,1])
    z4 = eval_cell_at_q(
        "\\theta([\\beta a-\\gamma b,\\gamma a])",
        {"\\beta": 1, "\\gamma": 1},
        {"a": 1, "b": 0},
        q, F, chi, K,
    )
    # [1,1] means sum_{t in F_3} θ(1*t + 1*t^2)
    manual = sum(chi(F((t + t**2) % q)) for t in range(q))
    _check("eval_bracket_beta_gamma", z4 == manual, "got %s, expected %s" % (z4, manual))


def test_ut3_row_orthogonality():
    table = {
        "groupOrder": "q^{3}",
        "n": 3,
        "columns": [
            {"classSize": "1"},
            {"classSize": "q", "arcs": {"above": {"a": [1, 2]}}},
            {"classSize": "q", "arcs": {"above": {"b": [2, 3]}}},
            {"classSize": "q", "arcs": {"above": {"a": [1, 2], "b": [2, 3]}}},
            {"classSize": "1", "arcs": {"above": {"c": [1, 3]}}},
        ],
        "rows": [
            {},
            {"arcs": {"above": {"\\alpha": [1, 2]}}},
            {"arcs": {"above": {"\\beta": [2, 3]}}},
            {"arcs": {"above": {"\\alpha": [1, 2], "\\beta": [2, 3]}}},
            {"arcs": {"above": {"\\gamma": [1, 3]}}},
        ],
        "matrix": [
            ["1", "1", "1", "1", "1"],
            ["1", "\\theta(\\alpha a)", "1", "\\theta(\\alpha a)", "1"],
            ["1", "1", "\\theta(\\beta b)", "\\theta(\\beta b)", "1"],
            ["1", "\\theta(\\alpha a)", "\\theta(\\beta b)", "\\theta(\\alpha a)\\theta(\\beta b)", "1"],
            ["q", "0", "0", "0", "q\\theta(\\gamma c)"],
        ],
    }
    for q in [2, 3]:
        ok = run_row_orthogonality_check(table, "row-orthogonality", [q])
        _check("ut3_orth_q%s" % q, ok)


def run_all():
    test_normalize_theta_inner_products()
    test_substitute_cell_alpha_a()
    test_substitute_cell_distinct_alpha()
    test_eval_linear_form_products()
    test_eval_cell_theta_field_elt()
    test_parenthetical_theta_forms()
    test_ut3_row_orthogonality()
    print(
        "SAGE_TEST_SUMMARY ok=%s fail=%s"
        % (len(_failures) == 0, len(_failures)),
        flush=True,
    )
    if _failures:
        print("SAGE_TEST_FAILURES " + json.dumps(_failures), flush=True)
    return len(_failures) == 0


run_all()
