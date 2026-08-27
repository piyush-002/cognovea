# Cognovea. Payload CMS setup

This covers the change from a static site to a Next.js + Payload application.
Read the section at the bottom before you start, some of this code has never
been executed.

---

## 1. What changed and why

The site was built with `output: 'export'`, which produces static HTML and no
server. Payload mounts an admin UI and REST/GraphQL routes that need a Node
runtime, so static export had to go. Practical consequences:

| | Before | After |
|---|---|---|
| Build output | Static HTML in `out/` | Node server + prerendered pages |
| Hosting | Any static host | Node runtime (Vercel serverless) |
| Database | None | Neon Postgres |
| Uploads | None | Vercel Blob |
| `npm start` | Never worked | Works |
| Security headers | Impossible | Set in `next.config.mjs` |

The ten marketing pages are **still statically generated at build time**, so
they serve as static HTML exactly as before. Performance should not regress.

**Content split.** Payload owns Insights (blog), Job Openings and Site Settings.
The ten marketing pages remain in code because their copy is verbatim from your
source documents and the render pipeline in `tools/` can prove it. A guarantee
that disappears the moment those pages depend on a database.

---

## 2. Install

```bash
npm install
```

That is the whole step. Every Payload package is pinned to an exact matching
version in `package.json`, so there is no version-skew risk and no special
install command.

### Why the versions are pinned the way they are

`next` is pinned with a tilde (`~15.4.11`), not a caret. Payload 3.88 declares
this peer range:

```
>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0
```

Those are not arbitrary. Compare them with the Next.js security advisory of
11 December 2025:

| Line | Patched in | Payload requires |
|---|---|---|
| 15.2.x | 15.2.8 | >= 15.2.9 |
| 15.3.x | 15.3.8 | >= 15.3.9 |
| 15.4.x | 15.4.10 | >= 15.4.11 |
| 16.0.x | 16.0.10 | >= 16.2.6 |

Every floor sits at or above the security patch for that line. **The peer range
is a security floor.** The 15.1 line is excluded from it entirely, and 15.5.x is
excluded too even though it exists.

So if `npm install` ever reports an `ERESOLVE` peer conflict on `next`:

> **Do not use `--legacy-peer-deps` or `--force`.** npm suggests them, and they
> will "work", by installing Payload against a Next.js version with known
> unpatched CVEs. Fix the version instead.

The `@payloadcms/*` packages are pinned to exact versions with no range at all,
because Payload requires every one of them to be the identical version. To
upgrade Payload later, change all five together and keep them equal.

### Upgrading to Next 16 later

Payload also supports `>=16.2.6 <17.0.0`, and 16.3.3 is the current release.
Next 16 was deliberately *not* taken here: the Payload integration has never
been executed, and debugging a first-run CMS integration and a major framework
upgrade at the same time is how a day disappears. Once `/admin` works and the
site builds, moving to 16 is a contained follow-up.

## 3. Database

### Which region

**Singapore, `aws-ap-southeast-1`.** Neon has no India region; Singapore is the
closest it offers. **This cannot be changed later**, moving means creating a new
project and migrating the data, so it is worth getting right now.

The latency that matters is between the Vercel *function* and the database, not
between your visitors and the database. The ten marketing pages are static and
served from Vercel's CDN worldwide regardless of where Postgres lives. What
actually touches the database is `/admin`, ISR regeneration, and the insights and
jobs queries.

So the region has to be chosen as a **pair** with Vercel's function region, which
defaults to `iad1` (Washington D.C.). Leaving that default with a Singapore
database is the worst of all combinations, every query crosses the Pacific:

| Vercel functions | Neon | Function ↔ DB round trip |
|---|---|---|
| `sin1` Singapore | Singapore | ~1–3 ms, **recommended** |
| `bom1` Mumbai | Singapore | ~40 ms per query |
| `iad1` Washington (default) | Singapore | ~230 ms per query |
| `iad1` Washington | US East | ~1–3 ms. Pick this instead if your clients are US-first |

Mumbai looks tempting because it is closer to Bengaluru, but it is the wrong
trade: your team reaches the function once per page, while the function reaches
the database many times per page. Payload's admin issues a lot of queries per
view, so co-locating the function with the database wins comfortably.

`vercel.json` in the project root already pins functions to `sin1`:

```json
{ "regions": ["sin1"] }
```

Single-region is available on every Vercel plan; Pro allows up to five. If you
later decide your audience is US-first, change both sides together, never one.

### Creating it

1. Create a project at [neon.tech](https://neon.tech) (free tier is enough to start),
   choosing **Singapore (aws-ap-southeast-1)** as the region.
2. In the Neon Console: open the project → **Connect** → toggle **Connection
   pooling** on → copy the string. The host will contain `-pooler`.
3. Put it in `.env.local` as `DATABASE_URI`, and change `?sslmode=require` to
   **`?sslmode=verify-full`**.
4. Copy the same string again with `-pooler` removed from the host, and put that
   in `DATABASE_URI_UNPOOLED` (also `verify-full`).

**On `sslmode`.** Neon's console hands you `sslmode=require`, but `require` only
means "encrypt". It does not require the server to prove it is actually Neon,
which leaves the connection open to a man-in-the-middle. Neon recommends
`verify-full`, which checks the certificate chain, hostname and expiry.

node-postgres currently treats `require` as `verify-full` anyway and prints a
security warning about it, because in pg v9 it will adopt libpq semantics and
`require` will silently become the weaker mode. Writing `verify-full` explicitly
is correct today and unaffected by that change. Neon's certificate is issued by
Let's Encrypt (ISRG Root X1), which macOS, Linux and Node already trust. There
is no certificate to download.

**Why both.** They are the same database over two different doors.

The pooled endpoint routes through PgBouncer in transaction mode. Serverless
needs it: every Vercel invocation opens its own connection and none are shared,
so a direct endpoint hits Postgres's connection ceiling under real traffic and
starts refusing clients. That failure only appears under load. It will look
perfect in development.

But transaction pooling discards session state between statements, so `SET`,
advisory locks and temporary tables do not work, which is exactly what schema
migrations need. Neon's own guidance is to migrate over the direct endpoint.

`src/lib/db-endpoint.ts` picks the right one per command: direct for `migrate`
and `migrate:create`, pooled for everything else. Nothing to swap by hand, and
nothing to forget to swap back, leaving production pointed at the direct
endpoint after a migration is the failure this avoids. It also warns if
`DATABASE_URI` looks like a direct endpoint at runtime.

The selection logic is unit-tested and runs without a database:

```bash
npm run test:db-endpoint
```

`DATABASE_URI_UNPOOLED` is optional. Without it, migrations run over the pooled
endpoint and print a warning; they may work, and may hang.

```bash
cp .env.example .env.local
openssl rand -base64 32   # paste into PAYLOAD_SECRET
```

## 4. First run

```bash
npm run dev
```

`dev` and `build` both run `payload generate:importmap` first, so the import map
can never go stale. That file maps every React component Payload's admin needs
to load, and it is generated from the config rather than written by hand.

It is not only for *custom* components. The Lexical rich-text editor registers
its own server components there, so an empty import map produces this at runtime,
the moment you open any form with a rich-text field:

```
getFromImportMap: PayloadComponent not found in importMap
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField"
```

Because it fails at runtime and not at build, a stale map ships green and breaks
in production. That is why generation is wired into the scripts instead of being
a step to remember. Commit the generated file too.

Open <http://localhost:3000/admin>. The first visit shows a create-first-user
screen. That account is a real admin. Use a password manager.

In development `push: true` syncs the schema to the database automatically. For
production, generate real migrations so a deploy can never silently drop a
column:

```bash
npm run migrate:create   # commit the generated file
npm run migrate          # run against production
```

Then regenerate types whenever the collections change, and commit the result:

```bash
npm run generate:types
```

---

## 5. Deploy to Vercel

Set all of these in **Project Settings → Environment Variables**:

| Variable | Notes |
|---|---|
| `PAYLOAD_SECRET` | Different from your local value |
| `DATABASE_URI` | Neon pooled string (host contains `-pooler`) |
| `DATABASE_URI_UNPOOLED` | Same string without `-pooler`; used only by migrations |
| `NEXT_PUBLIC_SERVER_URL` | `https://cognovea.com`, no trailing slash |
| `BLOB_READ_WRITE_TOKEN` | Injected automatically once Blob storage is added |
| `NEXT_PUBLIC_GA_ID` | `G-VGN7HXWX4V`. Leave empty to ship with no analytics |

Add **Storage → Blob** to the project before the first upload.

Build command stays `npm run build`. There is no longer an `out/` directory,
if the Vercel project has an Output Directory override left over from the static
setup, clear it.

---

## 6. The contact form

Submissions go to the `enquiries` collection, **Content → Enquiries** in the
admin, with a status field for triage (New / Contacted / Qualified / Closed /
Spam).

The form previously opened the visitor's mail client, because a static export
had nowhere to POST. That was always fragile: it needs a configured desktop mail
client, and anyone on webmail simply loses the enquiry.

Two design points worth knowing:

**The collection denies public creates.** `create` is set to `authenticated`,
even though anonymous visitors are the entire audience. Opening it would also
open Payload's REST endpoint, anyone could POST to `/api/enquiries` in a loop.
The only way in is the server action in `src/actions/enquiry.ts`, which
validates and sanitises first, then writes with `overrideAccess: true`.

**It is a Server Action, not a route handler.** Payload owns `/api/[...slug]`,
so a route at `/api/enquiry` would collide with it and fail the build.

Spam protection is a honeypot field plus server-side length caps. That stops
undirected bots. It will not stop someone deliberately targeting the form, if
that happens, add Cloudflare Turnstile or a rate limit at the edge.

**No email notification yet.** See section 11.

---

## 7. Client logos and testimonials

Two collections, both under **Content** in the admin. Both are empty at launch,
and **every section renders nothing until something is published**, so until you
add real logos and real quotes the site looks exactly as it does now. There are
no placeholder boxes and no sample data.

**Where they appear**

| Page | What | Notes |
|---|---|---|
| Home | Logo strip + one quote | Directly after the Proof section |
| About Us | Logo wall | Every published logo, not just featured |
| Data Health Check | One quote | Immediately before the booking form |
| Data Engineering | One quote | Only if tagged for that service |
| Data Modernization | One quote | Only if tagged |
| Generative AI | One quote | Only if tagged |
| AI Strategy | One quote | Only if tagged |

Service pages ask for a quote tagged for that service and show nothing if there
is no match, rather than falling back to a general one. A data engineering quote
on the Generative AI page reads as filler.

**Both collections require a permission tick before they can be saved.** A
client's logo is their trademark, used to promote you, and enterprise contracts
often forbid it without written sign-off. A testimonial publishes a named
person's words, role and employer, which is personal data under the DPDP Act.
Neither record saves until someone confirms.

**No Review structured data, on purpose.** Google treats reviews of a business
collected and published on that business's own site as self-serving: they are
ineligible for review rich results, and marking them up anyway risks a
structured-data manual action. The quotes are there to persuade a reader.

---

## 8. Analytics and consent

The measurement ID is `G-VGN7HXWX4V`, set via `NEXT_PUBLIC_GA_ID`. It is not a
secret (it is visible in any page's source), so it lives in configuration rather
than anywhere guarded.

**The standard gtag snippet is deliberately not pasted into the layout.** That
snippet loads gtag on page load, unconditionally. Doing that here would fire GA
before anyone has agreed, contradicting what the privacy policy on this site
promises, and would double-load the tag alongside the component below. The same
`gtag('js')` / `gtag('config')` calls run from `src/components/Analytics.tsx`
instead, after consent.

GA4 loads **only after the visitor clicks Accept**. This is stricter than Google
Consent Mode, which loads the script immediately and withholds cookies. It was
chosen because the DPDP Act 2023 is built around prior consent and because the
privacy policy on this site now says analytics run only with agreement. The
code should match the promise.

The trade-off is real: visitors who ignore the banner are never measured, so
GA4 will under-report. If you would rather use Consent Mode and accept the
compliance position, the change is contained to `src/components/Analytics.tsx`.

Core Web Vitals (LCP, INP, CLS, FCP, TTFB) are sent as GA4 events. **CLS is
multiplied by 1000** so it fits GA4's integer event values. Divide by 1000 when
reading reports.

---

## 9. Security headers

Set in `next.config.mjs`, which only works now that there is a server. Two CSP
profiles: a locked-down one for the public site, a more permissive one for
`/admin` (Payload's UI needs inline styles and blob URLs). The admin also sends
`X-Robots-Tag: noindex` and `Cache-Control: no-store`.

`/admin` is deliberately **not** listed in `robots.txt`. Disallowing it there
would advertise its existence to every scanner that reads robots.txt looking for
login pages.

**Known compromise:** the public CSP includes `'unsafe-inline'` in `script-src`.
Next.js App Router injects per-page inline hydration scripts; removing it means
nonce-based CSP, which requires middleware generating a per-request nonce, which
forces every page to render dynamically and drops the marketing pages out of
static generation. Static HTML was judged worth more than closing an XSS vector
on a site that renders no user-submitted HTML. Revisit if that ever changes.

Verify after deploy at <https://securityheaders.com>.

---

## 10. What has not been verified

Everything touching Payload is **unexecuted code**. npm was blocked in both the
authoring sandbox and the desktop VM (`403, forbidden by your security policy`),
so no Payload package was ever installed, no build was run, and no database was
connected.

What *was* verified: the ten marketing pages still render through the existing
`tools/` pipeline after the route-group move, `slugify` is unit-tested, the
Neon endpoint selection has 15 passing unit tests (`npm run test:db-endpoint`),
the CSP strings are syntactically valid, and no marketing page imports Payload.

Expect the first `npm run build` to surface something. The most likely places:

1. **ESM.** `package.json` sets `"type": "module"`. Payload 3 is ESM-only, and
   without this the config is transpiled to CommonJS and dies with
   `ERR_REQUIRE_ESM` on `@payloadcms/db-postgres`. The admin's `importMap.js`
   needs it too. Do not remove it; if you add a CommonJS script, name it `.cjs`.
2. **Payload scaffolding**. The files under `src/app/(payload)/` marked
   `PAYLOAD SCAFFOLDING` were hand-written. If `npx create-payload-app` emits
   different versions for your Payload version, prefer theirs.
3. **`trailingSlash: true` with the admin**, kept because your URLs are already
   indexed with trailing slashes. It should be fine (308 redirects preserve
   method and body), but `/admin` and `/api` are the first things to test.
4. **Package version skew**, no longer possible; all five Payload packages are
   pinned to the same exact version in package.json.
5. **`sharp` on the deploy platform**, usually fine on Vercel, occasionally
   needs a platform-specific build.

---

## 11. Still open from before

- Social profile URLs are empty in `src/lib/site.ts`; the footer hides them
  until filled in.
- **Contact form notifications.** Submissions are saved to the `enquiries`
  collection and visible in the admin, but nothing emails you when one arrives,
  so someone has to actually look. Before launch, either wire an email provider
  (Payload supports nodemailer; Resend is the least effort on Vercel) or put a
  daily habit around checking the admin. This replaced a `mailto:` form, which
  did land in your inbox, so it is a real gap rather than a nice-to-have.
- The privacy policy needs legal review and a named grievance officer, which
  the DPDP Act requires.
- Three mismatches between your documents and the live cognovea.com remain
  unresolved: the slogan, the contact email (`cognovea@gmail.com` vs
  `hello@cognovea.com`), and whether Indore is a "Development Center" or a
  "Delivery Centre". Site Settings in the admin is now the place to settle them.
