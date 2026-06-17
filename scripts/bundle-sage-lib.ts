/**
 * Writes sage/lib/character_tables.sage from split modules (for Sage REPL load()).
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSageLibSource } from '../src/sage/sageLibModules'

const out = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../sage/lib/character_tables.sage',
)

const header = `# Character table expansion and checks (SageMath).
# AUTO-GENERATED from sage/lib/*.sage — run: npm run bundle:sage
# Loaded as preamble by the app; TABLE is set via json.loads from TypeScript.

`

writeFileSync(out, header + loadSageLibSource() + '\n')
console.log('Wrote', out)
