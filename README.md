# Character Tables

Interactive workbench for **condensed character tables** over finite fields in general **q**.

## Quickstart

```bash
npm install
npm run dev
```

Click **Load UT₄ example** if the table looks wrong (clears stale saved data).

## Format

Tables are **YAML** files — see [docs/table-schema.md](docs/table-schema.md).

```yaml
group: UT_4(\mathbb{F}_q)
n: 4
columns:
  - {}
  - arcs:
      above: { a: [1, 2], b: [2, 3] }
rows:
  - {}
  - arcs:
      above: { \alpha: [1, 2] }
matrix:
  - [1, 1]
  - [q, 0]
```

Examples live in `src/examples/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Expansion engine tests |
