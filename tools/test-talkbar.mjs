/**
 * The Talkbar widget renders what the CSP expects, and nothing when unconfigured.
 *
 * Two failures this is here to catch, both silent:
 *
 *   1. The component and the policy disagree. The CSP names the widget's host
 *      explicitly; if the <script src> ever points somewhere else, the browser
 *      refuses it and the page still serves perfectly. Nothing fails except the
 *      widget, in someone else's browser.
 *
 *   2. It renders with a credential missing. A script tag carrying an undefined
 *      app id is worse than no script tag: it loads, fails to authenticate, and
 *      looks like a Talkbar outage rather than a configuration mistake.
 *
 *   node tools/test-talkbar.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);

let ts;
let React;
let renderToStaticMarkup;
try {
  ts = require('typescript');
  React = require('react');
  ({ renderToStaticMarkup } = require('react-dom/server'));
} catch {
  console.log('SKIP  typescript/react are not installed here. Run `npm install` first.');
  process.exit(0);
}

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

/**
 * The component reads process.env at module scope, which is how Next inlines
 * NEXT_PUBLIC_ values at build time. So the environment has to be set before it
 * is evaluated, and each case needs a fresh evaluation.
 */
function render(env) {
  const before = { ...process.env };
  Object.assign(process.env, env);
  try {
    const code = ts.transpileModule(
      fs.readFileSync(path.join(root, 'src/components/Talkbar.tsx'), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText;
    const load = (k) => {
      if (k === 'react') return React;
      if (k === 'react/jsx-runtime') return require('react/jsx-runtime');
      // next/script renders a real <script> for these purposes; the strategy is
      // asserted separately from the source, since it is not in the markup.
      if (k === 'next/script') return { __esModule: true, default: (p) => React.createElement('script', p) };
      throw new Error(`unexpected import: ${k}`);
    };
    const m = { exports: {} };
    new Function('exports', 'require', 'module', code)(m.exports, load, m);
    return renderToStaticMarkup(React.createElement(m.exports.default));
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in before)) delete process.env[k];
    Object.assign(process.env, before);
  }
}

const APP = 'test-app-id';
const KEY = 'test-publishable-key';
const CONFIGURED = {
  NEXT_PUBLIC_TALKBAR_APP_ID: APP,
  NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY: KEY,
};

const on = render(CONFIGURED);
const off = render({ NEXT_PUBLIC_TALKBAR_APP_ID: '', NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY: '' });
const halfA = render({ NEXT_PUBLIC_TALKBAR_APP_ID: APP, NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY: '' });
const halfB = render({ NEXT_PUBLIC_TALKBAR_APP_ID: '', NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY: KEY });

ok('configured, it renders a script tag', /<script/.test(on), on.slice(0, 120));
ok('it carries the app id', on.includes(`data-app-id="${APP}"`));
ok('it carries the key in the attribute Talkbar reads', on.includes(`data-api-key="${KEY}"`));

ok('unconfigured, it renders nothing at all', off === '');
ok('with only the app id, it renders nothing', halfA === '', 'a half-configured widget looks like a Talkbar outage');
ok('with only the key, it renders nothing', halfB === '');
ok('no "undefined" ever reaches the markup', !/undefined/.test(on + off + halfA + halfB));

/* --- the component and the policy must name the same host ----------------- */
const { TALKBAR_UI } = await import(`file://${path.join(root, 'src/lib/csp.mjs')}`);
const srcAttr = on.match(/src="([^"]+)"/)?.[1] ?? '';
ok('the script has a src', Boolean(srcAttr));
ok(
  'the script host is the one the CSP allows',
  srcAttr.startsWith(TALKBAR_UI + '/'),
  `script loads ${srcAttr}, CSP allows ${TALKBAR_UI} — a mismatch is refused by the browser and silent everywhere else`,
);

/* --- loading strategy ----------------------------------------------------- */
const source = fs.readFileSync(path.join(root, 'src/components/Talkbar.tsx'), 'utf8');
ok(
  'it does not block first paint',
  /strategy="afterInteractive"|strategy="lazyOnload"/.test(source),
  'a beforeInteractive third-party script sits in front of the page rendering',
);

/* --- it is actually mounted ----------------------------------------------- */
const layout = fs.readFileSync(path.join(root, 'src/app/(frontend)/layout.tsx'), 'utf8');
ok('the root layout renders it', /<Talkbar\s*\/>/.test(layout));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
