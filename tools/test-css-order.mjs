/**
 * Catches media queries that lose to the rules they are meant to override.
 *
 * Twice now a responsive rule has silently done nothing because a base rule
 * with the identical selector appeared later in the file. Same specificity
 * means source order decides, so `display: none` inside `@media (max-width:
 * 860px)` is simply discarded if `display: flex` for that selector is declared
 * below it. Nothing warns: no error, no lint, no visual difference on the
 * desktop the CSS was written on. It only shows up on a phone.
 *
 * This compares exact selector strings, so the two rules being compared always
 * have equal specificity and source order genuinely is the tiebreaker. That
 * makes a report here a real bug rather than a guess.
 *
 *   node tools/test-css-order.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const file = path.join(here, '..', 'src', 'app', '(frontend)', 'globals.css');
const css = fs.readFileSync(file, 'utf8');

// Strip comments so a selector inside prose is never parsed as a rule.
const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const lineOf = (index) => clean.slice(0, index).split('\n').length;

/** Every declaration, with its selector, whether it is inside an at-rule, and where. */
const declarations = [];

let i = 0;
const stack = [];
let buffer = '';

while (i < clean.length) {
  const ch = clean[i];

  if (ch === '{') {
    stack.push({ selector: buffer.trim(), start: i });
    buffer = '';
    i++;
    continue;
  }

  if (ch === '}') {
    const block = stack.pop();
    if (block) {
      const body = clean.slice(block.start + 1, i);
      const isAtRule = block.selector.startsWith('@');
      // Only leaf blocks hold declarations; an at-rule's body is other rules.
      if (!isAtRule) {
        const inMedia = stack.some((s) => s.selector.startsWith('@media'));
        const media = stack.find((s) => s.selector.startsWith('@media'))?.selector ?? null;
        for (const m of body.matchAll(/(?:^|;)\s*([a-z-]+)\s*:/g)) {
          // Skip declarations belonging to a nested block, if any.
          if (body.slice(0, m.index).split('{').length !== body.slice(0, m.index).split('}').length) continue;
          declarations.push({
            selector: block.selector.replace(/\s+/g, ' '),
            property: m[1],
            inMedia,
            media,
            line: lineOf(block.start + 1 + (m.index ?? 0)),
            pos: block.start + (m.index ?? 0),
          });
        }
      }
    }
    buffer = '';
    i++;
    continue;
  }

  buffer += ch;
  i++;
}

const problems = [];

for (const d of declarations.filter((x) => x.inMedia)) {
  // Custom properties cascade differently and are set deliberately in groups.
  if (d.property.startsWith('--')) continue;

  const overriding = declarations.find(
    (o) =>
      !o.inMedia &&
      o.selector === d.selector &&
      o.property === d.property &&
      o.pos > d.pos,
  );

  if (overriding) {
    problems.push(
      `  ${d.selector} { ${d.property} }\n` +
        `      set at line ${d.line} inside ${d.media}\n` +
        `      overridden at line ${overriding.line} by the same selector outside any media query\n` +
        `      -> the media query has no effect; move it below line ${overriding.line}`,
    );
  }
}

console.log(`Parsed ${declarations.length} declarations from globals.css.`);

if (problems.length) {
  console.log(`\n${problems.length} media query rule(s) overridden by a later base rule:\n`);
  console.log(problems.join('\n\n'));
  console.log('');
  process.exit(1);
}

console.log('No media query is overridden by a later rule of equal specificity.\n');
process.exit(0);
