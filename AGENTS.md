# AGENTS.md

## Cursor Cloud specific instructions

### What this is
`character-tables` is a **static front-end only** (Vite 8 + React 19 + TypeScript). There is **no backend in this repo**. Standard commands live in `package.json` and `README.md`.

- Dev server: `npm run dev` → http://localhost:5173
- Lint: `npm run lint` · Build: `npm run build` (`tsc -b && vite build`) · Tests: `npm run test`
- Storybook (optional): `npm run storybook` → :6006

### Non-obvious caveats
- **Tests run in a real browser.** `npm run test` (vitest) has two projects: a `node` project and a `storybook` project that launches **Playwright Chromium** (`vitest.config.ts`). The Chromium browser binary must be installed (`npx playwright install chromium`, handled by the startup update script). If browser launch fails with missing system libraries, run `npx playwright install-deps chromium` (needs apt/sudo; intentionally kept out of the update script).
- **Full end-to-end math checks need an external SageMath + Jupyter kernel that is NOT in this repo.** Numeric/symbolic checks (orthogonality, θ-sums, degrees) only execute against a user-supplied local Jupyter server on `:8888` (see `docs/jupyter-setup.md`). The app loads and runs **in-browser structural checks** (e.g. trivial row/column) without it; those Sage-dependent badges stay blocked/"need Sage" until a kernel is connected. The status bar shows e.g. `Sage checks: 1 of 1 passed; 10 need Sage`. This is expected without a kernel — not a setup failure.
- The Jupyter connection URL/token is pasted at runtime via the app's **Server settings** and stored in `localStorage` (`character-tables-jupyter-connection`); nothing is committed.
- `GITHUB_PAGES=true` is a build-time-only env var (sets the Pages base path); it is not needed for local dev.

### Pre-existing failures (as of environment setup — not caused by the environment)
On a clean `main`, `npm run lint`, `npm run build`, and `npm run test` each report pre-existing failures in the source/tests (TypeScript/ESLint errors and ~12 vitest assertion mismatches). These are code-level issues in the repo, not environment problems; do not assume your changes caused them — check `git stash`/clean tree if unsure.
