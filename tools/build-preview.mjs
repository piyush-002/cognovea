/**
 * Bundles tools/render.tsx (and everything it imports) with esbuild using the
 * automatic JSX runtime, then runs it. This is only the local verification
 * harness. See tools/render.tsx for why it exists.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
/* Resolve esbuild from the project first.
   This used to point at a single absolute path inside one particular sandbox,
   which meant the harness ran in exactly one environment and failed everywhere
   else with a confusing MODULE_NOT_FOUND. The repo has esbuild via Next, so ask
   for it there; the old path stays as a fallback for that sandbox. */
function loadEsbuild() {
  const candidates = [
    { paths: [path.join(here, '..')] },
    { paths: ['/home/claude/.npm-global/lib/node_modules/tsx'] },
    undefined,
  ];
  for (const opts of candidates) {
    try {
      return require(opts ? require.resolve('esbuild', opts) : 'esbuild');
    } catch {
      /* try the next one */
    }
  }
  return null;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const esbuild = loadEsbuild();

/* esbuild is a native binary, and this harness has now been unrunnable in
   three environments because of that: an absolute path baked in from one
   sandbox, a Linux VM carrying macOS binaries, and a sandbox with the npm
   registry blocked. Each time the harness silently did not run, and twice a
   bug it would have caught reached Rishabh.

   tools/require-tsx.cjs is the same harness driven by TypeScript's
   transpiler, which is pure JavaScript and therefore always available. It is
   slower and produces no bundle to screenshot, but it renders every case and
   fails on exactly the same things. */
if (!esbuild) {
  console.log('esbuild unavailable; rendering via the TypeScript transpiler instead');
  const require_ = createRequire(import.meta.url);
  require_('./require-tsx.cjs');
  require_('./render.tsx');
  process.exit(0);
}

await esbuild.build({
  entryPoints: [path.join(here, 'render.tsx')],
  outfile: path.join(root, '.preview-bundle.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'node:*'],
  alias: {
    '@': path.join(root, 'src'),
    // Payload-backed modules are stubbed: the harness has no database and npm
    // cannot install Payload here. See tools/stubs/content.ts.
    '@/lib/content': path.join(here, 'stubs', 'content.ts'),
    'next/image': path.join(here, 'stubs', 'next-image.tsx'),
    // Without this every case fails identically: usePathname() returns null
    // outside a Next request and Nav's first startsWith throws.
    'next/navigation': path.join(here, 'stubs', 'next-navigation.ts'),
    '@/actions/enquiry': path.join(here, 'stubs', 'enquiry.ts'),
  },
  logLevel: 'info',
});

console.log('bundled ok');
