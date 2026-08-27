/**
 * Tests the input sanitiser used by the contact-form server action.
 *
 * Mirrors the implementation in src/actions/enquiry.ts. Kept as its own file
 * rather than an inline snippet because the interesting inputs are control
 * characters, which do not survive being typed into a shell command.
 */

const clean = (v, max, multiline = false) => {
  if (typeof v !== 'string') return '';
  const stripped = multiline
    ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    : v.replace(/[\u0000-\u001f\u007f]/g, '');
  return stripped.trim().slice(0, max);
};

const NUL = '\u0000';
const DEL = '\u007f';
const LF = '\n';
const TAB = '\t';
const CRLF = '\r\n';

const cases = [
  ['trims surrounding whitespace', '  Rishabh Garg  ', 120, 'Rishabh Garg'],
  ['strips NUL', 'bad' + NUL + 'null', 120, 'badnull'],
  ['strips newlines', 'line' + LF + 'break', 120, 'linebreak'],
  ['strips tabs', 'a' + TAB + 'b', 120, 'ab'],
  ['strips DEL', 'del' + DEL + 'ete', 120, 'delete'],
  ['caps length', 'x'.repeat(500), 120, 'x'.repeat(120)],
  ['null becomes empty', null, 120, ''],
  ['non-string becomes empty', 42, 120, ''],
  ['a File upload becomes empty', { name: 'x' }, 120, ''],
  ['keeps normal punctuation', "O'Brien & Co. (India)", 120, "O'Brien & Co. (India)"],
  ['keeps non-latin text', 'ऋषभ गर्ग', 120, 'ऋषभ गर्ग'],

  // Multiline: the message box keeps paragraph breaks but still loses NUL,
  // and CRLF from a Windows browser is normalised to LF.
  ['multiline keeps newlines', 'para one' + LF + LF + 'para two', 400, 'para one' + LF + LF + 'para two', true],
  ['multiline normalises CRLF', 'a' + CRLF + 'b', 400, 'a' + LF + 'b', true],
  ['multiline still strips NUL', 'a' + NUL + LF + 'b', 400, 'a' + LF + 'b', true],
  ['multiline still strips tabs', 'a' + TAB + LF + 'b', 400, 'a' + LF + 'b', true],
];

let pass = 0;
let fail = 0;
for (const [name, input, max, want, multiline] of cases) {
  const got = clean(input, max, multiline);
  if (got === want) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const emails = [
  ['rgarg@nextlooptechnologies.com', true],
  ['a@b.co', true],
  ['no-at-sign.com', false],
  ['trailing@dot.', false],
  ['two@@at.com', false],
  ['spaces in@email.com', false],
];
for (const [addr, want] of emails) {
  if (EMAIL.test(addr) === want) pass++;
  else {
    fail++;
    console.log(`  FAIL  email ${addr}: expected ${want}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
