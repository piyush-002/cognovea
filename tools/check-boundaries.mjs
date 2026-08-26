/**
 * Catches the RSC boundary bug class that a plain react-dom/server render cannot:
 * a Server Component importing a plain *function* (not a component) from a
 * 'use client' module. Next.js turns those exports into client references, and
 * calling one from the server throws at runtime:
 *
 *   "Attempted to call faqSchema() from the server but faqSchema is on the client."
 *
 * Rule enforced: a server module may import from a client module only
 *   - the default export,
 *   - named bindings that look like components (PascalCase),
 *   - `type` imports (erased at compile time).
 * Anything else is a value that will be called on the server. Move it to lib/.
 *
 * Run:  node tools/check-boundaries.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'src');

/** Every .ts/.tsx file under src/. */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

const files = walk(root);
const isClient = new Map(
  files.map((f) => [f, /^\s*(['"])use client\1/m.test(fs.readFileSync(f, 'utf8'))]),
);

/** Resolve an import specifier to a file on disk. */
function resolve(spec, from) {
  let base;
  if (spec.startsWith('@/')) base = path.join(root, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;

  for (const cand of [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

const IMPORT_RE = /import\s+([^;]*?)\s+from\s+['"]([^'"]+)['"]/gs;
let problems = 0;

for (const file of files) {
  if (isClient.get(file)) continue; // client -> client is fine
  const src = fs.readFileSync(file, 'utf8');

  for (const m of src.matchAll(IMPORT_RE)) {
    const [, clause, spec] = m;
    if (clause.trimStart().startsWith('type ')) continue; // whole import is type-only

    const target = resolve(spec, file);
    if (!target || !isClient.get(target)) continue;

    const braced = clause.match(/\{([^}]*)\}/);
    if (!braced) continue; // default import only — always fine

    for (const raw of braced[1].split(',')) {
      const name = raw.trim();
      if (!name || name.startsWith('type ')) continue;
      const local = name.split(/\s+as\s+/).pop().trim();
      if (/^[A-Z]/.test(local)) continue; // PascalCase: a component, renderable across the boundary

      problems++;
      console.error(
        `BOUNDARY  ${path.relative(process.cwd(), file)}\n` +
          `          imports value "${local}" from client module ${path.relative(process.cwd(), target)}\n` +
          `          A Server Component cannot call this. Move it into src/lib/.`,
      );
    }
  }
}

console.log(
  problems === 0
    ? `Server/client boundary clean (${files.length} files checked).`
    : `\n${problems} boundary violation(s).`,
);
process.exit(problems === 0 ? 0 : 1);
