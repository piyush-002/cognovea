# Cognovea, website (V1, 10 pages)

Next.js 15 (App Router) + TypeScript, exported as a fully static site. No database, no server, no CSS framework, one hand-written stylesheet and a handful of client components.

## The design system

Purple → Blue → Cyan on a white canvas, with deep navy for weight. Sora for
headings, Inter for everything else.

The colour budget is deliberate and worth keeping:

| share | where |
|---|---|
| ~60% | white / very light, most bands |
| ~25% | deep navy, hero, How We Work, closing CTA, footer |
| ~10% | violet / blue, primary CTAs, links, key marks |
| ~5% | cyan + gradient, micro accents only, never a fill |

**The gradient is rationed.** It appears on the logo mark, one word in the hero
headline, the scroll-progress bar, and a 2px hairline on card hover. Nowhere
else. Buttons, cards, icons and backgrounds are solid colour. A violet button
next to a violet heading on a violet card is what makes a site read as a
startup landing page rather than an enterprise one.

Primary CTA: solid violet, white text. Secondary CTA: transparent with a 1px
border that adapts to whichever ground it sits on (`--ghost-border`).

Dark bands redeclare `--fg`, `--line`, `--card`, `--eyebrow` and `--ghost-border`
rather than overriding every rule, so any component works on either ground.
Style new components against those tokens, never against literal colours.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build it

```bash
npm run build        # static site lands in ./out
```

Deploy `out/` to Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, or any static host.

## Look at it without installing anything

`preview/` holds a static HTML render of all 10 pages plus the 404. Open `preview/index.html` in a browser to see the design immediately. It is a **preview only**, no JavaScript runs, so the hero animation, tabs, accordions, mobile menu and form are inert there. The real behaviour needs `npm run dev`.

## The 10 pages

| Route | Page |
|---|---|
| `/` | Home |
| `/data-engineering-services` | Enterprise Data Engineering Consulting Services and Solutions |
| `/data-modernization-services` | Data Modernization Services and Cloud Upgrades |
| `/generative-ai-services` | Generative AI Development Services |
| `/ai-strategy-consulting` | AI Strategy and Consulting Services |
| `/data-health-check` | Book a Two Week Data Health Check |
| `/about-us` | About Cognovea |
| `/careers` | Cognovea Careers |
| `/contact` | Contact Cognovea |
| `/privacy-policy` | Privacy Policy |

Plus a 404 page, and `sitemap.xml` / `robots.txt` generated at build time.

All page copy is taken verbatim from the source documents. Meta titles and descriptions are the ones specified in those documents.

## Before you launch. The open items

1. **Domain.** `src/lib/site.ts` → `site.url`. Everything else (canonicals, sitemap, JSON-LD, Open Graph) reads from it.
2. **Social profiles.** `src/lib/site.ts` → `site.social`. The "Connect With Cognovea" block on `/contact` only renders the platforms that have a URL, so it stays hidden until you fill them in.
3. **Privacy policy.** `/privacy-policy` is a working draft written to match how this site actually behaves. Have counsel review it against the DPDP Act 2023 and the GDPR, and appoint a named grievance officer. The `TODO` comments in `src/app/(frontend)/privacy-policy/page.tsx` mark every gap.
4. **Email transport.** Nothing is configured, so admin password resets do not arrive and nobody is notified when an enquiry comes in. Enquiries are still saved and readable in the admin; they just sit there unannounced.
5. **A second admin account.** One admin plus no working email is a permanent lockout waiting to happen.
6. **Migrations.** `src/migrations` is empty and `push` is off in production, so a collection added in development does not exist on the live database until `npm run migrate:create` and `npm run migrate` have been run.

## Secrets

No credential is committed. Every one is read from the environment:

| Variable | Used by | Reaches the browser |
| --- | --- | --- |
| `PAYLOAD_SECRET` | signs admin session tokens | no |
| `DATABASE_URI` | Postgres, pooled | no |
| `DATABASE_URI_UNPOOLED` | Postgres, migrations only | no |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads | no |
| `ALLOW_SCHEMA_PUSH` | opt-in for schema push in development | no |
| `EXTRA_ORIGINS` | additional CORS/CSRF origins | no |
| `NEXT_PUBLIC_SERVER_URL` | canonical origin | **yes** |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement id | **yes** |

Anything named `NEXT_PUBLIC_*` is compiled into the JavaScript sent to every
visitor. It is not a configuration convention, it is publication. Both of the
public values above are meant to be public: the site's own address, and a GA4
measurement id, which is visible in the network tab of any site running
Analytics and grants nothing on its own. **Never add the prefix to reach a
value from client code.** If a component needs something secret, the work
belongs on the server.

`.env` and `.env.*` are gitignored, with `.env.example` the single exception.
`npm run scan:secrets` checks the source, the git history, the browser-exposed
variables and the logging paths; it refuses to report a clean result if it
scanned nothing.

### Rotate anything that was ever committed

A secret removed from the code is still in the git history, and history is in
every clone, fork and CI cache that ever pulled the repository. Deleting the
line does not unpublish it. The only fix is to issue a new credential and
retire the old one.

At the time of writing, `npm run scan:secrets` finds no credential in this
repository's history, and no `.env` file has ever been committed. If that ever
changes, or if you inherit this repository from somewhere it might have:

- **`PAYLOAD_SECRET`** — generate a new one with `openssl rand -base64 32`.
  Changing it invalidates every admin session, which is the point.
- **`DATABASE_URI` / `DATABASE_URI_UNPOOLED`** — reset the role's password in
  the Neon console. The connection string embeds it, so the string changes too.
- **`BLOB_READ_WRITE_TOKEN`** — revoke and reissue in the Vercel dashboard.
- Update every place each one is set: `.env.local`, and the Vercel project
  settings for Production, Preview and Development separately.

Rewriting history with `git filter-repo` or BFG removes the value from future
clones, but it does not reach anyone who already has one. Rotate first; rewrite
afterwards if you want to, not instead.

## How it's put together

```
src/
  app/
    layout.tsx            root layout, site-wide metadata, Organization + WebSite JSON-LD
    globals.css           the entire design system
    page.tsx              home
    <route>/page.tsx      one folder per page
    sitemap.ts            generates /sitemap.xml
    robots.ts             generates /robots.txt
    not-found.tsx         404
  components/
    Nav.tsx               sticky nav, services dropdown, mobile drawer   (client)
    Footer.tsx
    HeroCanvas.tsx        animated node network behind the hero          (client)
    Reveal.tsx            one IntersectionObserver driving all .rv       (client)
    Tabs.tsx              keyboard-navigable tab set                     (client)
    Rail.tsx              sticky side rail synced to scroll position     (client)
    Faq.tsx               FAQ accordion                                  (client)
    ContactForm.tsx       validation, submit, mailto fallback            (client)
    Bits.tsx              PageHero, CtaBand, Arrow, schema helpers
    JsonLd.tsx
  lib/
    site.ts               domain, contact details, nav, route list
    schema.ts             FaqItem + faqSchema. See the boundary note below
  components/ (continued)
    Marquee.tsx           infinite CSS logo/tech scroll (server component)
    Counter.tsx           count-up on scroll into view                   (client)
    Rotator.tsx           cycling word inside a headline                 (client)
    Scroller.tsx          horizontal card carousel with arrows           (client)
public/
  img/                    generated artwork. See below
tools/
    check-boundaries.mjs  guards the server/client split
    gen-art.mjs           regenerates public/img (npm run art)
```

## One section, one screen

The hero is `min-height: calc(100svh - var(--nav-h))`, one screen with the nav
excluded. `min-height`, not `height`, so very short viewports or large text zoom
make it grow rather than clip. `svh` rather than `vh` so mobile browser chrome
doesn't cause a jump.

Every other section is sized to land at or under one screen. Three things do
that work:

1. **Type is bounded by viewport height as well as width.** `clamp(min, min(Xvw,
   Yvh), max)`. A purely width-based heading is what pushes a section past one
   screen on a short laptop.
2. **Five-item rows use `.grid--5`.** Five items wrapping to 3 + 2 costs a whole
   extra row.
3. **`--band-y` is height-aware.** Short screens get tighter bands.

Measured at 1440×900, every section lands between 0.74 and 0.98 screens. At
1280×800 the tightest two sit at ~1.02. On a phone only the hero, the entry
strip, the marquee, Industries and the closing CTA fit one screen. The rest
carry several hundred words of verbatim source copy and cannot, short of
cutting text or shrinking it below a readable size.

### Footer grid

The columns are explicit breakpoints, not `minmax(0, 1.5fr) + repeat(auto-fit,
…)`. That mix produced phantom 0px tracks at wide sizes and. The real bug, let
the first column shrink below the lockup's intrinsic width. The lockup can't go
under ~236px (34px mark + gap + "DATA + AI SOLUTIONS" at 0.3em tracking), so it
overflowed its cell and printed on top of the next column at 430px, 620px and
700px. One column under 560px, two up to 960px with the brand block spanning the
row, four above.

Anything with a hard minimum width inside a fluid grid needs either a track that
respects that minimum or permission to wrap. `.c-foot .logo` has
`flex-wrap: wrap` as the second line of defence.

### Mobile drawer

The drawer's link typography is scoped to `.c-drawer__group a`, deliberately not
`.c-drawer__body a`. The looser selector also matched the CTA and beat `.btn` on
specificity (class + type vs class), replacing `inline-flex` with `display:
block` and 15px with 1.3rem, which dropped the button's arrow onto a second
line. If you add anything else to the drawer body, scope its styles the same way.

The CTA is full width with centred content: it reads as intentional on a phone
and cannot wrap at any sensible width. Links carry `min-height: 48px` for a
comfortable tap target.

### Horizontal overflow

`html` carries `overflow-x: clip` as a backstop, `clip` rather than `hidden`,
because `hidden` would make `<html>` a scroll container and can break the sticky
nav. It is only a backstop: real overflow is fixed at source.

The one that bit: `.rv--left` / `.rv--right` translate content 26px sideways
before revealing, but the page gutter on a phone is ~18px, so a `.rv--right`
element sat ~8px past the viewport edge until it animated in. Chrome hid it via
`body { overflow-x: hidden }`; iOS Safari still panned. Below 900px those
variants now fall back to the vertical reveal. The columns are stacked there
anyway, so a left/right reveal carries no meaning.

If you ever chase a horizontal-scroll bug here, measure with the clipping
lifted (`html`/`body` `overflow-x: visible`) and with `.rv` transforms **not**
neutralised, or you will measure a page that looks fine and isn't.

Two things to know if you edit this:

- On screens under 1020px the hero mark is hidden outright (`.stage {
  display: none }`). Stacked it added ~340px and made the phone hero one and a
  half screens; as a backdrop it competed with the copy. The canvas still mounts,
  but a `display: none` element reports as not intersecting, so MarkCanvas's
  IntersectionObserver stops the loop before it paints a frame.
- The viewport-height trims are declared at the **end** of `globals.css` on
  purpose. They override `.c-hero`, whose base rule appears later in the file;
  at equal specificity, source order decides. Move them up and they stop working.

## The mark

`src/components/Mark.tsx` (small lockup, SVG) and `src/components/MarkCanvas.tsx`
(hero, canvas) render the same object: the particle **C** from cognovea.com. An
open ring of points, dense along the stroke, fraying at the tips and dissolving
outward toward the aperture, which faces right. Colour reads diagonally: violet
top-left, through the mid blue, to cyan at the lower-right.

The point generator lives in `src/lib/mark.ts` and is **seeded**, not random.
The lockup is server-rendered, so an unseeded generator would produce different
points on server and client and trip a hydration mismatch.

Two knobs matter: `count` and `rScale`. The hero runs at 400px+ where the native
point sizes are right; the 34px lockup needs roughly half the points at ~3× the
radius, or it degrades into a grey smudge.

The hero animation is ported from the live page, scatter → resolve, idle drift,
and the cursor parting the swarm, with three changes: it pauses when scrolled
out of view as well as when the tab hides, every listener and frame is torn down
on unmount (this is a route now, not a single static page), and reduced motion
paints the resolved mark once without animating.

Brand ramp, taken from the live mark rather than approximated: `#7C3AED` →
`#4F6BF0` → `#22D3EE`. The mid blue only reaches ~4:1 on white, so links and
eyebrows use `--blue-ink` (`#3050D8`) while the brand blue stays in gradients
and marks.

## The artwork

`public/img/*.svg` is generated by `tools/gen-art.mjs`, not drawn by hand.
Every piece is deterministic, same code, same bytes, so it diffs cleanly in
git instead of arriving as opaque binaries. Change the palette at the top of
that file and run:

```bash
npm run art
```

The motifs are meant to carry meaning rather than decorate. The homepage set:
a radar sweep for "see clearly", a forecast cone for "know what's next", a
pipeline for "work smarter", converging paths for "move with confidence", and
one per industry. The inner pages add layered warehouse storage, source
orchestration, a quality-check grid with one anomaly flagged, concurrency lanes,
a batch-by-batch migration, a falling cost curve, RAG retrieval with citations,
an agent workflow pausing at a human approval gate, document extraction with a
low-confidence row escalated, an impact-versus-effort matrix, a six-phase
roadmap, an engagement ladder, delivery phases, a hiring funnel and a two-city
locations mark.

Long-copy sections use `.feature--copy`: the prose takes 1.55fr to the art's
1fr, top-aligned, with the figure `position: sticky`. A 1:1 centred split
narrows nine paragraphs by ~30%, making them ~30% taller. And leaves the
figure floating in the middle of a tall column.

**These are placeholders for photography, not a substitute for it.** The People
section on the homepage has a marked slot (`TEAM PHOTOGRAPHY SLOT` in
`src/app/page.tsx`), drop a 4:5 image at `public/img/team.jpg`, swap the `src`,
write real alt text. A photograph of the actual team will outperform any
abstract art.

## What is deliberately not on the page

The reference sites lean heavily on client logo walls, analyst badges, case
study tiles and testimonials. None of that exists for Cognovea yet and none of
it is faked here. What the marquee shows is the **technology stack** named in
the source documents, and the counters show **durations and starting prices**
from those documents, not results. When real logos, awards and case studies
arrive, the layouts they belong in are already built.

### The server/client boundary

Page files are Server Components. A Server Component can **render** a Client
Component, but it cannot **call** a function exported from a `'use client'`
module, Next.js compiles those exports into client references, and calling one
throws at runtime:

```
Attempted to call faqSchema() from the server but faqSchema is on the client.
```

So any helper a page calls directly lives in `src/lib/`, never next to the
component that uses it. `faqSchema` is in `src/lib/schema.ts` for exactly this
reason, even though `Faq.tsx` is its natural home.

```bash
npm run check:boundaries
```

catches this before it reaches the browser. Worth running alongside `typecheck`
whenever you add a helper to a component file.

### Content lives at the top of each page file

Every page keeps its copy in plain arrays and objects above the component. To change wording, edit the data. You rarely need to touch JSX.

### SEO

- Per-page `metadata` with canonical URLs and Open Graph tags.
- `Organization` + `WebSite` JSON-LD once, site-wide.
- `Service` JSON-LD on the four service pages and the Data Health Check.
- `FAQPage` JSON-LD generated from the same array that renders the visible accordion, so the two can never drift apart.
- `BreadcrumbList` JSON-LD matching the visible breadcrumbs.
- `trailingSlash: true` so clean URLs work on plain static hosts.

### Scroll reveal and client-side navigation

`Reveal` sits in the root layout, and the root layout does **not** remount when
you navigate between routes. A mount-only effect there would observe the first
page's `.rv` elements and never see any later page's, leaving them stuck at
opacity 0 until a hard refresh. So it re-runs on every `pathname` change, plus
keeps a `MutationObserver` for anything mounted afterwards.

`.rv` starts hidden in `globals.css` so it can animate in. A `<noscript>` style
block in `layout.tsx` cancels that when JavaScript is unavailable, so a JS-less
reader gets the full page rather than a blank one.

That safety net is deliberately **not** an inline script stamping a class on
`<html>`. The usual trick. That script mutates the DOM before React hydrates,
so the server HTML and the client DOM differ and React reports a hydration
mismatch. `<noscript>` is byte-identical on both sides. If you ever need
pre-hydration DOM state here, you will also need `suppressHydrationWarning`;
prefer a CSS-only solution instead.

The same "layout doesn't remount" rule applies to anything else you add to the
layout that touches the DOM, give it a `pathname` dependency.

### Accessibility

Skip link, visible focus rings, `aria-expanded` / `aria-controls` on every disclosure, roving tabindex on tabs, table captions, and a full `prefers-reduced-motion` path that disables the hero animation and all scroll reveals.

### No case studies

The homepage "Proof" section describes the shape of a customer story, as written in the source document. Build real case studies before this section carries any weight with buyers.
