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
    if s.startswith("-") and not s.startswith("(-"):
        return -eval_q_polynomial(s[1:], q)
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
