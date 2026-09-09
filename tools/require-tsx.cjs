/**
 * A fallback for build-preview.mjs when esbuild is not installable.
 *
 * The harness has now failed to run in three different environments for three
 * different reasons: an absolute esbuild path baked in from one sandbox, a
 * Linux VM holding macOS native binaries, and a sandbox whose npm registry is
 * blocked outright. Each time, the tests that would have caught a real bug did
 * not run, and twice the bug reached Rishabh instead.
 *
 * esbuild is a native binary and TypeScript is not, so this route works
 * wherever node does. It is slower and it does not type-check — tsc already
 * does that separately — but it never fails to install.
 *
 * It hooks require() rather than reimplementing module resolution: node still
 * finds the files, this only teaches it three things it does not know.
 *
 *   1. .ts and .tsx are JavaScript once transpiled, with the automatic JSX
 *      runtime, matching the esbuild path's `jsx: 'automatic'`.
 *   2. The `@/` alias, and the same stub redirections build-preview.mjs lists.
 *      Both lists live in ALIASES below so the two routes cannot diverge into
 *      passing and failing on the same code.
 *   3. A CSS import is not a module. esbuild is told `loader: { '.css':
 *      'empty' }`; here it resolves to an empty object.
 */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const here = __dirname;
const root = path.join(here, '..');

function loadTypeScript() {
  const candidates = [
    { paths: [root] },
    { paths: [path.join(process.env.HOME || '', '.npm-global/lib/node_modules')] },
    undefined,
  ];
  for (const opts of candidates) {
    try {
      return require(opts ? require.resolve('typescript', opts) : 'typescript');
    } catch {
      /* try the next one */
    }
  }
  throw new Error('neither esbuild nor typescript is available; one of them is needed to run the harness');
}

const ts = loadTypeScript();

/** Kept in the same shape as build-preview.mjs's `alias` map, deliberately. */
const ALIASES = {
  '@/lib/content': path.join(here, 'stubs', 'content.ts'),
  '@/actions/enquiry': path.join(here, 'stubs', 'enquiry.ts'),
  'next/image': path.join(here, 'stubs', 'next-image.tsx'),
  'next/navigation': path.join(here, 'stubs', 'next-navigation.ts'),
};

const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

function resolveFile(base) {
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/* In the temp directory, not in tools/: this is a build artefact of running the
   harness, and a stray untracked file in the repo is exactly the kind of thing
   that gets committed by accident. */
const EMPTY = path.join(require('node:os').tmpdir(), 'cognovea-empty-module.js');
if (!fs.existsSync(EMPTY)) fs.writeFileSync(EMPTY, 'module.exports = {};\n');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (/\.css$/.test(request)) return EMPTY;
  if (ALIASES[request]) return ALIASES[request];
  if (request.startsWith('@/')) {
    const hit = resolveFile(path.join(root, 'src', request.slice(2)));
    if (hit) return hit;
  }
  if (request.startsWith('.') && parent && parent.filename) {
    const hit = resolveFile(path.resolve(path.dirname(parent.filename), request));
    if (hit) return hit;
  }
  return originalResolve.call(this, request, parent, ...rest);
};

function compile(module_, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      /* The client components carry 'use client'. It is a no-op here — this
         renders to a string on the server — but TypeScript will otherwise
         hoist it away silently, which is fine, and warn about nothing. */
      isolatedModules: true,
    },
  });
  module_._compile(outputText, filename);
}

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;

module.exports = { root, ts };
