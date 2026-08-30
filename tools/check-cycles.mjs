/**
 * Refuses to let a circular import back into src/.
 *
 * The one that prompted this file:
 *
 *   lib/payload -> @payload-config -> collections/Enquiries -> lib/notify
 *     -> lib/rate-limit -> lib/payload
 *
 * A limiter that needed a database client imported it from lib/payload, which
 * imports the Payload config, which imports the collections, which import the
 * notification hooks, which import the limiter. Every edge is reasonable on its
 * own and the loop is invisible from any single file.
 *
 * What makes this worth a permanent check is how it fails. Nothing warns at
 * build time. One binding in the loop is left uninitialised, and the error
 * surfaces in whichever module happens to touch it first — in production, after
 * minification, as:
 *
 *   getPosts failed: ReferenceError | Cannot access 'J' before initialization
 *
 * A single letter, in a function that has nothing to do with the change that
 * caused it. That is a bad afternoon, and it is entirely preventable by walking
 * the import graph, which takes milliseconds.
 *
 * Static imports only. A dynamic `await import()` is the accepted way to break a
 * cycle deliberately — it resolves when the function runs, by which time every
 * module is initialised — so it is not counted as an edge.
 *
 *   node tools/check-cycles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(tsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

/** An import specifier as a path under src/, or null if it leaves the project. */
function resolve(spec, fromFile) {
  let base;
  if (spec === '@payload-config') {
    base = path.join(src, 'payload.config');
  } else if (spec.startsWith('@/')) {
    base = path.join(src, spec.slice(2));
  } else if (spec.startsWith('./') || spec.startsWith('../')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null; // a package
  }

  // The specifier may already carry its extension (host-redirect.mjs does).
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of ['.ts', '.tsx', '.mjs', '.js']) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  for (const ext of ['.ts', '.tsx', '.mjs', '.js']) {
    const idx = path.join(base, `index${ext}`);
    if (fs.existsSync(idx)) return idx;
  }
  // A .mjs specifier whose file is written without the extension, or vice versa.
  const swapped = base.replace(/\.mjs$/, '');
  for (const ext of ['.ts', '.tsx', '.mjs']) {
    if (fs.existsSync(swapped + ext)) return swapped + ext;
  }
  return null;
}

/**
 * Static import specifiers only.
 *
 * `import type` is erased before anything runs and cannot form a runtime cycle,
 * so it is skipped — otherwise this would report loops that do not exist and
 * teach everyone to ignore it.
 */
function staticImports(file) {
  const source = fs.readFileSync(file, 'utf8');
  const out = [];
  for (const m of source.matchAll(/^[ \t]*import\s+([^;]*?)\s*from\s*'([^']+)'/gm)) {
    if (/^type[\s{]/.test(m[1].trim())) continue;
    const target = resolve(m[2], file);
    if (target) out.push(target);
  }
  for (const m of source.matchAll(/^[ \t]*export\s+(?:\*|\{[^}]*\})\s*from\s*'([^']+)'/gm)) {
    const target = resolve(m[1], file);
    if (target) out.push(target);
  }
  return out;
}

const files = walk(src);
const graph = new Map(files.map((f) => [f, staticImports(f)]));

/* Depth-first, tracking the path, so the report names the whole loop rather
   than just the file it noticed. */
const cycles = [];
const state = new Map(); // 'visiting' | 'done'

function visit(file, stack) {
  if (state.get(file) === 'visiting') {
    cycles.push([...stack.slice(stack.indexOf(file)), file]);
    return;
  }
  if (state.get(file) === 'done') return;
  state.set(file, 'visiting');
  for (const dep of graph.get(file) || []) visit(dep, [...stack, file]);
  state.set(file, 'done');
}

for (const f of files) visit(f, []);

const rel = (f) => path.relative(root, f);

/* Report each distinct loop once, however many entry points reach it. */
const seen = new Set();
const distinct = cycles.filter((c) => {
  const key = [...c.slice(0, -1)].map(rel).sort().join('|');
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (distinct.length === 0) {
  console.log(`No circular imports (${files.length} files, ${[...graph.values()].flat().length} edges).`);
  process.exit(0);
}

console.log(`${distinct.length} circular import${distinct.length === 1 ? '' : 's'}:\n`);
for (const cycle of distinct) {
  for (let i = 0; i < cycle.length; i++) {
    console.log(`  ${i === 0 ? '┌─' : i === cycle.length - 1 ? '└─' : '│ '} ${rel(cycle[i])}`);
  }
  console.log('');
}
console.log('Break the loop by making one edge a dynamic `await import()`, which');
console.log('resolves at call time, or by moving the shared value into its own module.');
process.exit(1);
