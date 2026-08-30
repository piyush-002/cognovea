/**
 * The notification hooks, with nothing actually sent.
 *
 * The interesting property is not that an email goes out — it is that
 * everything still works when one does not. These hooks run inside the same
 * request that saves the visitor's enquiry, so a hook that throws turns a
 * provider outage into a contact form that reports failure to a person whose
 * message was in fact saved. That is the worst possible combination: we have
 * their enquiry, they think we do not, and they go somewhere else.
 *
 * So the cases below are mostly failure cases. The real hooks are compiled and
 * run against a fake Payload whose sendEmail can be made to reject, hang, or
 * return an object that throws when touched.
 *
 *   node tools/test-notify.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const require = createRequire(import.meta.url);

let ts;
try {
  ts = require('typescript');
} catch {
  console.log('SKIP  typescript is not installed here. Run `npm install` first.');
  process.exit(0);
}

const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: rel.replace(/\.mjs$/, '.ts'),
  }).outputText;

const FILES = {
  '@/lib/notify': 'src/lib/notify.ts',
  '@/lib/host-redirect.mjs': 'src/lib/host-redirect.mjs',
  // Allows everything, so these cases exercise the sending path rather than the
  // cap. The cap itself is checked in test-rate-limit.mjs, against a real
  // database, along with the rest of the limiter.
  '@/lib/rate-limit': 'tools/stubs/rate-limit.ts',
};

const cache = {};
function load(key) {
  if (key in cache) return cache[key];
  if (key === 'payload') return (cache[key] = {});
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const module = { exports: {} };
  cache[key] = module.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(module.exports, load, module);
  return (cache[key] = module.exports);
}

const { notifyOnEnquiry, notifyOnToolLead } = load('@/lib/notify');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const SECRET = 're_liveKey_do_not_leak_0123456789';

/** A fake Payload whose sendEmail behaves however the case needs. */
function fakePayload(behaviour = 'ok') {
  const sent = [];
  return {
    sent,
    req: {
      payload: {
        sendEmail: async (args) => {
          sent.push(args);
          if (behaviour === 'reject') throw new Error('Resend responded 422');
          if (behaviour === 'hang') return new Promise(() => {});
          if (behaviour === 'leaky') {
            // A provider client that puts the outgoing request — API key and all
            // — on the error it throws. This is not hypothetical; several do.
            const err = new Error('Unauthorized');
            err.request = { headers: { authorization: `Bearer ${SECRET}` } };
            throw err;
          }
          return { id: 'msg_1' };
        },
      },
    },
  };
}

const ENQUIRY = {
  id: 41,
  fullName: 'Priya Raman',
  workEmail: 'priya@acme.co.in',
  companyName: 'Acme Manufacturing',
  companySize: '200-500',
  industry: 'Manufacturing',
  phone: '+91 98765 43210',
  intent: 'contact',
  hardestNumber: 'Monthly plant utilisation.',
  goal: 'Stop rebuilding the same report every month.',
};

const LEAD = {
  id: 7,
  email: 'lead@company.com',
  tool: 'bi-automation-calculator',
  summary: '5 people x 10 hrs/week at Rs 1,600/hr\nRecovered a year: Rs 20,00,000',
  shareUrl: 'https://www.cognovea.com/tools/bi-automation-calculator/?p=5&h=10&c=1600',
};

const env = (vars) => {
  for (const [k, v] of Object.entries(vars)) {
    if (v === null) delete process.env[k];
    else process.env[k] = v;
  }
};

const LIVE = { RESEND_API_KEY: SECRET, EMAIL_NOTIFY: 'piyush@nextlooptechnologies.com', EMAIL_FROM: 'noreply@cognovea.com' };

/* --- the happy path -------------------------------------------------------- */
env(LIVE);
{
  const p = fakePayload('ok');
  const returned = await notifyOnEnquiry({ doc: ENQUIRY, operation: 'create', req: p.req });
  ok('an enquiry sends one email', p.sent.length === 1, `sent ${p.sent.length}`);
  ok('the hook returns the document unchanged', returned === ENQUIRY);
  ok('it goes to EMAIL_NOTIFY', p.sent[0].to === LIVE.EMAIL_NOTIFY, p.sent[0].to);
  ok('from EMAIL_FROM', p.sent[0].from === LIVE.EMAIL_FROM, p.sent[0].from);
  ok('the subject names the person', p.sent[0].subject.includes('Priya Raman'), p.sent[0].subject);
  ok('and their company', p.sent[0].subject.includes('Acme Manufacturing'), p.sent[0].subject);

  const body = p.sent[0].text;
  ok('the body carries their address', body.includes('priya@acme.co.in'));
  ok('...their phone', body.includes('+91 98765 43210'));
  ok('...what they asked for', body.includes('Stop rebuilding the same report'));
  ok('...and a link straight to the record', body.includes('/admin/collections/enquiries/41'), body);
}
{
  const p = fakePayload('ok');
  await notifyOnToolLead({ doc: LEAD, operation: 'create', req: p.req });
  ok('a download sends one email', p.sent.length === 1);
  ok('the subject says it is a download, not an enquiry',
    /download/i.test(p.sent[0].subject) && !/enquiry/i.test(p.sent[0].subject), p.sent[0].subject);
  ok('the body carries their figures', p.sent[0].text.includes('Recovered a year: Rs 20,00,000'));
  ok('and the link that reproduces their result', p.sent[0].text.includes(LEAD.shareUrl));
}

/* --- the part that matters: failure never reaches the visitor -------------- */
{
  const p = fakePayload('reject');
  let threw = false;
  const quiet = console.warn;
  console.warn = () => {};
  try {
    const returned = await notifyOnEnquiry({ doc: ENQUIRY, operation: 'create', req: p.req });
    ok('a rejected send still returns the document', returned === ENQUIRY);
  } catch {
    threw = true;
  }
  console.warn = quiet;
  ok('a rejected send does not throw out of the hook', !threw);
}
{
  const p = fakePayload('reject');
  const quiet = console.warn;
  console.warn = () => {};
  let threw = false;
  try {
    await notifyOnToolLead({ doc: LEAD, operation: 'create', req: p.req });
  } catch {
    threw = true;
  }
  console.warn = quiet;
  ok('the same holds for a download', !threw);
}
{
  // A hook that never settles holds the visitor's request open until the
  // platform kills it. The deadline is what stops that, so it has to be real.
  const p = fakePayload('hang');
  const quiet = console.warn;
  console.warn = () => {};
  const started = Date.now();
  await notifyOnEnquiry({ doc: ENQUIRY, operation: 'create', req: p.req });
  const waited = Date.now() - started;
  console.warn = quiet;
  ok('a hanging provider is abandoned, not waited on forever', waited < 12000, `waited ${waited}ms`);
  ok('and the deadline is long enough to be a real attempt', waited > 1000, `waited ${waited}ms`);
}
{
  // The key must not reach the log. A provider error carrying the request it
  // was given is the usual way an API key ends up in a log aggregator.
  const p = fakePayload('leaky');
  const logged = [];
  const quiet = console.warn;
  console.warn = (...args) => logged.push(args.map(String).join(' '));
  await notifyOnEnquiry({ doc: ENQUIRY, operation: 'create', req: p.req });
  console.warn = quiet;
  ok('a failure is logged', logged.length === 1, JSON.stringify(logged));
  ok('the API key is not in the log', !logged.join('\n').includes(SECRET), logged.join('\n'));
  ok('the log says which hook and that nothing was sent',
    /notify/.test(logged[0]) && /not sent/.test(logged[0]), logged[0]);
}

/* --- only on create -------------------------------------------------------- */
for (const operation of ['update', 'delete']) {
  const p = fakePayload('ok');
  await notifyOnEnquiry({ doc: ENQUIRY, operation, req: p.req });
  ok(`an enquiry ${operation} sends nothing`, p.sent.length === 0, `sent ${p.sent.length}`);
  const q = fakePayload('ok');
  await notifyOnToolLead({ doc: LEAD, operation, req: q.req });
  ok(`a lead ${operation} sends nothing`, q.sent.length === 0);
}

/* --- unconfigured environments stay quiet ---------------------------------- */
for (const [name, vars] of [
  ['no API key', { RESEND_API_KEY: null }],
  ['no recipient', { EMAIL_NOTIFY: null }],
  ['an empty API key', { RESEND_API_KEY: '' }],
  ['a whitespace recipient', { EMAIL_NOTIFY: '   ' }],
]) {
  env(LIVE);
  env(vars);
  const p = fakePayload('ok');
  let threw = false;
  try {
    await notifyOnEnquiry({ doc: ENQUIRY, operation: 'create', req: p.req });
  } catch {
    threw = true;
  }
  ok(`${name}: nothing is attempted`, p.sent.length === 0, `sent ${p.sent.length}`);
  ok(`${name}: and nothing throws`, !threw);
}
env(LIVE);

/* --- sparse and hostile documents ------------------------------------------ */
{
  const p = fakePayload('ok');
  await notifyOnEnquiry({ doc: { id: 1 }, operation: 'create', req: p.req });
  ok('an enquiry with only an id still sends', p.sent.length === 1);
  ok('with no "undefined" in the subject', !/undefined/.test(p.sent[0].subject), p.sent[0].subject);
  ok('and none in the body', !/undefined/.test(p.sent[0].text), p.sent[0].text);
}
{
  const p = fakePayload('ok');
  await notifyOnToolLead({ doc: { id: 2, email: 'x@y.com' }, operation: 'create', req: p.req });
  ok('a lead with no summary says so rather than showing a blank', /No figures recorded/.test(p.sent[0].text), p.sent[0].text);
  ok('and omits the share line entirely', !/Their result:/.test(p.sent[0].text), p.sent[0].text);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
