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
  throw new Error('esbuild not found. Run `npm install` first.');
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const esbuild = loadEsbuild();

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
