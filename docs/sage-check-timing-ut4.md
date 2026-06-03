# Sage check timing — UT₄ example

Benchmark run: 2026-06-02. Each cell is one isolated Jupyter execute (warm kernel after library load).

## Table under test

- **Group:** UT_4(\mathbb{F}_q)
- **Order:** q^{6}
- **Condensed size:** 4×4 (6 rows × 8 columns)
- **Source:** `src/examples/ut4-fq.yaml`

```yaml
group: UT_4(\mathbb{F}_q)
groupOrder: q^{6}

n: 4

# Canonical column order (Andre-style condensed classes)
columns:
  - classSize: 1
  - classSize: q^{3}
    expansionCount: (q^2-1)(q-1)
    arcs:
      below:
        a: [1, 2]
        c: [3, 4]
      above:
        b: [2, 3]
    restriction: \neg(a=c=0)
  - classSize: q^{2}
    arcs:
      below:
        a: [1, 3]
      above:
        b: [3, 4]
  - classSize: q^{2}
    arcs:
      below:
        b: [2, 4]
      above:
        a: [1, 2]
  - classSize: q
    expansionCount: q^{2} - 1
    arcs:
      below:
        a: [1, 3]
        b: [2, 4]
    restriction: \neg(a=b=0)
  - classSize: 1
    arcs:
      above:
        a: [1, 4]
  - classSize: q^{2}
    arcs:
      below:
        a: [1, 4]
      above:
        b: [2, 3]
  - classSize: q^{2}
    arcs:
      below:
        c: [1, 3]
      above:
        a: [1, 2]
        b: [3, 4]

rows:
  - {}
  - arcs:
      below:
        \alpha: [1, 2]
        \beta: [2, 3]
        \gamma: [3, 4]
    expansionCount: q^{3} - 1
    restriction: \neg(\alpha=\beta=\gamma=0)
  - arcs:
      below:
        \beta: [3, 4]
      above:
        \alpha: [1, 3]
  - arcs:
      below:
        \alpha: [1, 2]
      above:
        \beta: [2, 4]
  - arcs:
      above:
        \alpha: [1, 4]
      below:
        \beta: [2, 3]
  - arcs:
      below:
        \gamma: [1, 2]
      above:
        \alpha: [1, 3]
        \beta: [2, 4]

matrix:
  - [1, 1, 1, 1, 1, 1, 1, 1]
  - [1, \theta(\alpha a)\theta(\beta b)\theta(\gamma c), \theta(\gamma b), \theta(\alpha a), 1, 1, \theta(\beta a), \theta(\alpha a)\theta(\beta b)]
  - [q, 0, q\theta(\alpha a)\theta(\beta b), 0, q\theta(\alpha a), q, 0, 0]
  - [q, 0, 0, q\theta(\alpha a)\theta(\beta b), q\theta(\beta b), q, 0, 0]
  - [q^2, 0, 0, 0, 0, q^2\theta(\alpha a)\theta(\beta b), q\theta(\alpha a)\theta(\beta b), 0]
  - [q, 0, 0, 0, q\theta(\alpha a)\theta(\beta b), q, 0, 'q\delta_{\alpha a = \beta b}\theta(\alpha a)\theta(\gamma b)']
```

## Setup

- **q values:** 2, 3, 5 (each check run with a single `[q]` list)
- **Kernel:** sagemath
- **Warm-up** (load `character_tables.sage` + TABLE): 63ms

## Timing by check and q

| Check | q=2 | q=3 | q=5 |
| --- | --- | --- | --- |
| **conjugacy** — Conjugacy class sizes are correct | 63ms ✓ | 64ms ✓ | 95ms ✓ |
| **expanded-count-balance** — Expanded row and column counts match | 98ms ✓ | 93ms ✓ | 64ms ✓ |
| **trivial-orthogonality** — Orthogonality with the trivial character | 108ms ✗ | 125ms ✗ | 1.7s ✗ |
| **theta-sum** — Additive character sum (root of unity) | 96ms ✓ | 64ms ✓ | 70ms ✓ |
| **row-orthogonality** — Row orthogonality (first orthogonality relation) | 102ms ✗ | 1.1s ✗ | 5.1m ✗ |
| **column-orthogonality** — Column orthogonality (dual) | 101ms ✗ | 1.0s ✗ | 4.0m ✗ |
| **degree-sum** — Character degrees and ∑ dim² = |G| | 64ms ✓ | 98ms ✓ | 85ms ✓ |
| **duplicate-irrep** — No duplicate irreducibles (Schur consequence) | 108ms ✗ | 183ms ✗ | 4.0s ✗ |
| **norm-identity** — Irreducible norm identity | 70ms ✓ | 135ms ✗ | 2.4s ✗ |
| **arc-patterns** — Arc, zero, and δ pattern checks | 70ms ✓ | 114ms ✗ | 1.2s ✗ |
| **Sequential total** | 880ms | 3.0s | 9.2m |

Legend: time + ✓ (pass) or ✗ (fail). `blocked` = check not runnable for this table/q.

## Takeaways

| Tier | Checks | q=2 | q=3 | q=5 |
| --- | --- | --- | --- | --- |
| Always fast | `conjugacy`, `expanded-count-balance`, `theta-sum`, `degree-sum` | <100ms each | <100ms each | <100ms each |
| Moderate | `trivial-orthogonality`, `arc-patterns`, `norm-identity`, `duplicate-irrep` | ~100ms | ~100–200ms | 1–4s |
| Expensive | `row-orthogonality`, `column-orthogonality` | ~100ms | ~1s | **~4–5 min each** |

- **q=2 and q=3** are fine for interactive full checks (sequential total ~1s and ~3s).
- **q=5** is dominated by orthogonality (~9 min for row+column alone); avoid unless you need that spot-check.
- **App controls** (Sage checks panel): pick which q to run (checkboxes), Quick vs All checks, and read the live UT₄ timing estimate.
- **q=2 only, all checks**: ~880ms combined on UT₄.
- **q=2 + q=3, all checks**: ~1s + ~3s sequential total.
- **q=5, all checks**: q=5 dominates (~9 min); use while not actively editing.
- Running all three q in **one** execute per check (earlier run) made orthogonality ~4 min each because expansion work is shared across q; per-q isolation above shows where cost actually lands.

## Notes

- Times are one isolated Jupyter execute per cell (warm kernel after library load).
- The app bundles checks in one run and reuses `_EXPANDED_CACHE`, so combined full mode is usually faster than the column totals above.
- Several expanded-character checks fail on this table at some q; timing is independent of pass/fail.
