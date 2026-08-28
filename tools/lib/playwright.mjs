/**
 * Finds Playwright wherever it happens to be installed, and says something
 * useful when it is not there.
 *
 * Three of these tests need a browser, and each had grown its own loader. One
 * of them hardcoded an absolute path from the sandbox it was written in, which
 * is the same mistake as a test that only passes on one machine. This is the
 * single place that knows how to find a browser.
 *
 * Both package names are accepted. `@playwright/test` is what most people
 * install, `playwright` is what the docs for the library say, and either one
 * provides the `chromium` export these tests use. Refusing the wrong one would
 * be pedantry that costs somebody twenty minutes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const NAMES = ['playwright', '@playwright/test'];

function globalRoots() {
  const roots = [];
  for (const cmd of ['npm root -g', 'npm root -g --prefix ~/.npm-global']) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (out) roots.push(out);
    } catch {}
  }
  return [...new Set(roots)];
}

/**
 * @returns {Promise<{chromium: any, launchOpts: object, source: string} | null>}
 */
export async function loadPlaywright() {
  const tried = [];

  // Resolved relative to the calling project first, which is where a
  // `npm i -D` install lands.
  for (const name of NAMES) {
    try {
      const mod = await import(name);
      if (mod?.chromium) return { chromium: mod.chromium, launchOpts: launchOptions(), source: name };
    } catch {
      tried.push(name);
    }
  }

  for (const root of globalRoots()) {
    for (const name of NAMES) {
      const dir = path.join(root, name);
      if (!fs.existsSync(dir)) continue;
      for (const entry of ['index.mjs', 'index.js']) {
        const file = path.join(dir, entry);
        if (!fs.existsSync(file)) continue;
        try {
          const mod = await import(`file://${file}`);
          if (mod?.chromium) {
            return { chromium: mod.chromium, launchOpts: launchOptions(), source: `${name} (global: ${root})` };
          }
        } catch {}
      }
      tried.push(`${name} in ${root}`);
    }
  }

  return null;
}

/** Some sandboxes pin a browser; everywhere else Playwright finds its own. */
function launchOptions() {
  return fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
}

/**
 * Loads Playwright or exits 0 with an explanation.
 *
 * Exit 0, not 1: a missing browser on someone's laptop is not a failing test,
 * and turning it into one trains people to ignore the suite. The message
 * separates the two things that can be missing, because installing the package
 * without the browser is the more confusing half and produces a launch error
 * rather than an import error.
 */
export async function requirePlaywright(testName = 'this test') {
  const pw = await loadPlaywright();
  if (pw) return pw;

  console.log(`SKIP  ${testName} needs a browser, and Playwright was not found.`);
  console.log('      Checked "playwright" and "@playwright/test", in this project and globally.');
  console.log('');
  console.log('      In the project directory:');
  console.log('        npm i -D playwright');
  console.log('        npx playwright install chromium');
  console.log('');
  console.log('      Both lines are needed. The first installs the library, the second');
  console.log('      downloads the browser it drives; the package alone fails at launch.');
  process.exit(0);
}
