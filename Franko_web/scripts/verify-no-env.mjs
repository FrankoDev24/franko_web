// Guardrail ensuring no `.env` file is ever packaged into deployable artifacts
// (`public/` or `dist/`). Invoked during `postbuild` and `verify:no-env`.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const checkedDirs = ['public', 'dist'];
const violations = [];

for (const dir of checkedDirs) {
  const fullDir = path.join(root, dir);
  if (!existsSync(fullDir)) continue;
  for (const entry of readdirSync(fullDir)) {
    if (entry === '.env' || (entry.startsWith('.env.') && entry !== '.env.example')) {
      violations.push(path.join(dir, entry));
    }
  }
}

if (violations.length > 0) {
  console.error(
    `Refusing to deploy with .env files inside build/static output: ${violations.join(', ')}`
  );
  process.exit(1);
}

console.log('Verified deploy output contains no .env files.');
