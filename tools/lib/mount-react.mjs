/**
 * Mounts a real React component in a real browser.
 *
 * The alternative — rebuilding the component's behaviour in a test fixture and
 * asserting against that — tests the fixture. It would have passed happily
 * while the actual component passed the wrong props, wired the reset to
 * nothing, or dropped a field from the share link. For a page whose entire
 * value is that its numbers can be trusted, the component has to be the thing
 * under test.
 *
 * Compiles the real .tsx with TypeScript, wires the imports through a tiny
 * CommonJS registry in the page, and hands React its own CJS builds. No
 * bundler, because the npm registry is unavailable here and a test that
 * requires an install nobody can perform is a test that never runs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/** Resolve a package file, so this keeps working if versions move. */
function pkgFile(spec) {
  return fs.readFileSync(require.resolve(spec), 'utf8');
}

function readReact() {
  const root = path.dirname(require.resolve('react/package.json'));
  const domRoot = path.dirname(require.resolve('react-dom/package.json'));
  const schedRoot = path.dirname(require.resolve('scheduler/package.json'));
  return {
    react: fs.readFileSync(path.join(root, 'cjs/react.development.js'), 'utf8'),
    jsxRuntime: fs.readFileSync(path.join(root, 'cjs/react-jsx-runtime.development.js'), 'utf8'),
    scheduler: fs.readFileSync(path.join(schedRoot, 'cjs/scheduler.development.js'), 'utf8'),
    reactDom: fs.readFileSync(path.join(domRoot, 'cjs/react-dom.development.js'), 'utf8'),
    reactDomClient: fs.readFileSync(path.join(domRoot, 'cjs/react-dom-client.development.js'), 'utf8'),
  };
}

/**
 * Compile a project file to CommonJS.
 *
 * 'use client' is stripped: it is a Next directive with no meaning outside the
 * framework, and leaving it in only produces a stray expression statement.
 */
function compile(projectRoot, rel) {
  const src = fs.readFileSync(path.join(projectRoot, rel), 'utf8').replace(/^\s*['"]use client['"];?\s*$/m, '');
  return ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    // The extension is normalised to .ts on purpose. TypeScript decides a
    // file's module system from its name, and for a .mjs it leaves the ESM
    // syntax alone — which then reaches the page as a bare `export` and takes
    // the whole script tag down with a syntax error, so the module silently
    // never registers.
    fileName: rel.replace(/\.mjs$/, '.ts'),
  }).outputText;
}

/**
 * Build a page that mounts `entry`.
 *
 * @param modules  map of import specifier -> project-relative file
 * @param entry    the specifier whose default export is mounted
 */
export function buildPage({ projectRoot, css = '', modules, entry, props = {} }) {
  const r = readReact();
  const compiled = Object.fromEntries(Object.entries(modules).map(([spec, rel]) => [spec, compile(projectRoot, rel)]));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}
/* The reveal animation hides everything until its observer runs, which is not
   part of what is being tested here. */
.rv { opacity: 1 !important; transform: none !important; }
</style></head><body>
<section class="band"><div class="wrap"><div id="root"></div></div></section>
<script>
window.__err = [];
window.addEventListener('error', (e) => window.__err.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => window.__err.push(String(e.reason)));

// A CommonJS registry. Enough for these modules and nothing more.
var __mods = {};
var __cache = {};
function __def(name, fn) { __mods[name] = fn; }
/**
 * Resolve a specifier against the registry.
 *
 * The project modules import each other two ways: pages use the '@/...' alias,
 * and files in the same folder use './model'. Both have to land on the same
 * registered module or the component gets two copies of the state. Exact match
 * first, then match on the last path segment, which is unambiguous across this
 * closed set of files.
 */
function __resolve(name) {
  if (__mods[name]) return name;
  // split/pop rather than a regex: this string is emitted through a template
  // literal, where a backslash escape is consumed before it reaches the page,
  // and the regex silently became /^.*//.
  var parts = String(name).split('/');
  var base = parts[parts.length - 1];
  var hits = Object.keys(__mods).filter(function (k) {
    var p = k.split('/');
    return p[p.length - 1] === base;
  });
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) throw new Error('ambiguous specifier: ' + name + ' matches ' + hits.join(', '));
  return name;
}

function require(name) {
  name = __resolve(name);
  if (__cache[name]) return __cache[name].exports;
  var fn = __mods[name];
  if (!fn) throw new Error('module not registered: ' + name);
  var m = { exports: {} };
  __cache[name] = m;
  fn(m.exports, require, m);
  return m.exports;
}
var process = { env: { NODE_ENV: 'development' } };
</script>

<script>__def('scheduler', function(exports, require, module) { ${r.scheduler} });</script>
<script>__def('react', function(exports, require, module) { ${r.react} });</script>
<script>__def('react/jsx-runtime', function(exports, require, module) { ${r.jsxRuntime} });</script>
<script>__def('react-dom', function(exports, require, module) { ${r.reactDom} });</script>
<script>__def('react-dom/client', function(exports, require, module) { ${r.reactDomClient} });</script>

<script>
/*
 * Next stubs.
 *
 * Enough for a component to mount and be driven, not a reimplementation of the
 * framework. Link becomes a plain anchor, which is what it renders to anyway;
 * usePathname reports the address bar, so active-link states are real rather
 * than hardcoded.
 */
__def('next/link', function (exports, require, module) {
  var React = require('react');
  module.exports = {
    __esModule: true,
    default: function Link(props) {
      var rest = Object.assign({}, props);
      delete rest.href; delete rest.children; delete rest.prefetch; delete rest.replace; delete rest.scroll;
      return React.createElement('a', Object.assign({ href: props.href }, rest), props.children);
    },
  };
});

__def('next/navigation', function (exports, require, module) {
  module.exports = {
    __esModule: true,
    usePathname: function () { return window.location.pathname; },
    useRouter: function () {
      return { push: function (h) { window.location.assign(h); }, replace: function () {}, refresh: function () {} };
    },
    useSearchParams: function () { return new URLSearchParams(window.location.search); },
  };
});

__def('next/image', function (exports, require, module) {
  var React = require('react');
  module.exports = {
    __esModule: true,
    default: function Image(props) {
      var rest = Object.assign({}, props);
      delete rest.priority; delete rest.quality; delete rest.sizes; delete rest.fill; delete rest.loader;
      return React.createElement('img', rest);
    },
  };
});
</script>

${Object.entries(compiled)
  .map(([spec, code]) => `<script>__def(${JSON.stringify(spec)}, function(exports, require, module) { ${code} });</script>`)
  .join('\n')}

<script>
try {
  var React = require('react');
  var client = require('react-dom/client');
  var Entry = require(${JSON.stringify(entry)}).default;
  client.createRoot(document.getElementById('root')).render(React.createElement(Entry, ${JSON.stringify(props)}));
  window.__mounted = true;
} catch (e) {
  window.__err.push('mount failed: ' + (e && e.stack || e));
}
</script>
</body></html>`;
}
