import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const previewDir = '/home/claude/preview';
const shotDir = '/home/claude/shots';
fs.mkdirSync(shotDir, { recursive: true });

const targets = process.argv.slice(2);
const pages = targets.length ? targets : ['index'];

// Serve over http rather than file:// so absolute asset paths (/img/...) resolve
// the same way they will in production.
const http = require('node:http');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(previewDir, url === '/' ? 'index.html' : url);
  if (!file.startsWith(previewDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4321, r));
const ORIGIN = 'http://127.0.0.1:4321';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const name of pages) {
  const file = path.join(previewDir, `${name}.html`);
  if (!fs.existsSync(file)) {
    console.log(`missing ${name}`);
    continue;
  }

  for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${ORIGIN}/${name}.html`, { waitUntil: 'load' });
    // Walk the page so loading="lazy" images actually fetch before capture,
    // otherwise every below-the-fold figure screenshots as an empty box.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);

    const full = await page.evaluate(() => document.body.scrollHeight);
    const cap = Math.min(full, label === 'desktop' ? 4200 : 5200);
    await page.setViewportSize({ width, height: cap });
    await page.waitForTimeout(300);
    const out = path.join(shotDir, `${name}-${label}.png`);
    await page.screenshot({ path: out });
    console.log(`${out}  (page ${full}px, captured ${cap}px)`);
    await ctx.close();
  }
}

await browser.close();
server.close();
