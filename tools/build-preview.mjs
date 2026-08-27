/**
 * Bundles tools/render.tsx (and everything it imports) with esbuild using the
 * automatic JSX runtime, then runs it. This is only the local verification
 * harness. See tools/render.tsx for why it exists.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require(
  require.resolve('esbuild', { paths: ['/home/claude/.npm-global/lib/node_modules/tsx'] }),
);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

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
    '@/actions/enquiry': path.join(here, 'stubs', 'enquiry.ts'),
  },
  logLevel: 'info',
});

console.log('bundled ok');
