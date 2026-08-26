"""
Verify conjugacy class sizes for UT_2^{(1)}(F_q).

UT_2^{(1)} = 4x4 upper unitriangular matrices where the two 2x2 blocks
along the diagonal are equal:  position [1,2] = position [3,4].

So the 6 upper-triangular positions (x12, x13, x14, x23, x24, x34)
are constrained by x12 = x34.  That gives 5 free parameters => |G| = q^5.
"""

import json

def run_verification(q):
    F = GF(q)
    MS = MatrixSpace(F, 4, 4)

    elements = []
    for x12 in F:
        for x13 in F:
            for x14 in F:
                for x23 in F:
                    for x24 in F:
                        M = copy(MS.identity_matrix())
                        M[0,1] = x12
                        M[0,2] = x13
                        M[0,3] = x14
                        M[1,2] = x23
                        M[1,3] = x24
                        M[2,3] = x12   # [3,4] = [1,2]
                        elements.append(M)

    print("q=%d: |G| = %d (expected q^5 = %d)" % (q, len(elements), q^5))
    assert len(elements) == q^5

    # Verify closure
    elem_set = set(tuple(M.list()) for M in elements)
    sample = min(200, len(elements))
    closure_ok = True
    for i in range(sample):
        for j in range(sample):
            prod = elements[i] * elements[j]
            if tuple(prod.list()) not in elem_set:
                closure_ok = False
                break
        if not closure_ok:
            break
    print("  Closure check (sample %dx%d): %s" % (sample, sample, "OK" if closure_ok else "FAIL"))
    if not closure_ok:
        print("  ERROR: group not closed under multiplication!")
        return False

    # Compute conjugacy classes
    classes = []
    classified = set()
    for g in elements:
        key = tuple(g.list())
        if key in classified:
            continue
        cls = set()
        for h in elements:
            conj = h.inverse() * g * h
            cls.add(tuple(conj.list()))
        for c in cls:
            classified.add(c)
        rep = g
        classes.append({
            "size": len(cls),
            "rep": {
                "[1,2]": str(rep[0,1]),
                "[1,3]": str(rep[0,2]),
                "[1,4]": str(rep[0,3]),
                "[2,3]": str(rep[1,2]),
                "[2,4]": str(rep[1,3]),
                "[3,4]": str(rep[2,3]),
            },
        })

    classes.sort(key=lambda c: (c["size"], str(c["rep"])))

    size_counts = {}
    for c in classes:
        s = c["size"]
        size_counts[s] = size_counts.get(s, 0) + 1

    print("  Found %d conjugacy classes" % len(classes))
    print("  Class size distribution:")
    for s in sorted(size_counts.keys()):
        print("    |C| = %d: %d classes (%d elements)" % (s, size_counts[s], s * size_counts[s]))

    # YAML column families
    yaml_families = [
        {"col": 0, "classSize": 1, "count": 1, "desc": "identity"},
        {"col": 1, "classSize": 1, "count": q^2 - 1, "desc": "¬(a=b=0), |C|=1"},
        {"col": 2, "classSize": q^2, "count": q*(q-1), "desc": "a≠b, |C|=q^2"},
        {"col": 3, "classSize": 1, "count": q^2*(q-1), "desc": "a above [2,3]≠0, |C|=1"},
        {"col": 4, "classSize": q^2, "count": q^2*(q-1), "desc": "a above [1,2]≠0, |C|=q^2"},
    ]

    print("\n  YAML declares:")
    yaml_total_classes = 0
    yaml_total_elements = 0
    for fam in yaml_families:
        total = fam["classSize"] * fam["count"]
        yaml_total_classes += fam["count"]
        yaml_total_elements += total
        print("    Col %d: %d classes of size %d = %d elements  (%s)" % (
            fam["col"], fam["count"], fam["classSize"], total, fam["desc"]))
    print("    Total: %d classes, %d elements" % (yaml_total_classes, yaml_total_elements))

    print("\n  Actual (computed):")
    actual_total = 0
    for s in sorted(size_counts.keys()):
        total = s * size_counts[s]
        actual_total += total
        print("    %d classes of size %d = %d elements" % (size_counts[s], s, total))
    print("    Total: %d classes, %d elements" % (len(classes), actual_total))

    yaml_size_counts = {}
    for fam in yaml_families:
        s = fam["classSize"]
        yaml_size_counts[s] = yaml_size_counts.get(s, 0) + fam["count"]

    match = yaml_size_counts == size_counts
    print("\n  SIZE DISTRIBUTION MATCH: %s" % match)
    if not match:
        print("  YAML: %s" % dict(sorted(yaml_size_counts.items())))
        print("  Actual: %s" % dict(sorted(size_counts.items())))

    # Show all classes with representatives
    print("\n  All conjugacy classes:")
    for i, c in enumerate(classes):
        print("    class %d: size=%d  rep=%s" % (i, c["size"], c["rep"]))

    return match


print("=" * 60)
print("Verifying conjugacy class sizes for UT_2^{(1)}(F_q)")
print("(constraint: position [1,2] = position [3,4])")
print("=" * 60)

all_ok = True
for q in [2, 3]:
    print("\n--- q = %d ---" % q)
    ok = run_verification(q)
    all_ok = all_ok and ok

print("\n" + "=" * 60)
if all_ok:
    print("ALL CHECKS PASSED")
else:
    print("SOME CHECKS FAILED - class sizes may be wrong")
print("=" * 60)
