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


def test_eval_andre_cell():
    q = 3
    F, chi = additive_theta(q)
    K = value_field(q)
    row_header = {"arcs": {"below": {"\\alpha": [1, 3]}}}
    col_header = {}
    z = eval_cell_at_q(
        "\\andre",
        {"\\alpha": 1},
        {},
        q,
        F,
        chi,
        K,
        row_header=row_header,
        col_header=col_header,
        n=4,
    )
    _check("andre_q3", z == K(3), str(z))


def run_all():
    test_normalize_theta_inner_products()
    test_substitute_cell_alpha_a()
    test_substitute_cell_distinct_alpha()
    test_eval_linear_form_products()
    test_eval_cell_theta_field_elt()
    test_eval_andre_cell()
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
