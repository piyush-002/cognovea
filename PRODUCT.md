# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences carry equal weight; neither outranks the other in future work.

- **Manufacturing and oil & gas operators.** Plant, production and operations
  leaders and the data people around them, at companies where plant data lives
  apart from ERP and downtime, OEE, deferment or asset reporting have more than
  one answer. This is the sharpened wedge: the two industry pages, the SAP
  S/4HANA and Oracle Fusion migration pages, and the SCADA/historian page are
  written for them.
- **Mid-market data leaders, any sector.** Heads of Data, BI, IT or Finance at
  growing companies whose data sits across five systems and who cannot get one
  number everyone trusts. `/about-us` names SaaS, financial services, retail,
  manufacturing, logistics, healthcare, education, consumer and professional
  services. This is the volume business.

The recurring situations, taken verbatim from the site: no single reliable
number, half a week spent assembling reports, needing a data engineer without
hiring one full time, needing a whole analytics pod, and wanting AI without
knowing where it creates value.

## Product Purpose

Cognovea is a data analytics, data engineering and AI consultancy. It builds the
pipelines that move a client's data, the analytics and BI that make it legible,
the AI layer that acts on it, and supplies the people to run any of it — as a
one-off integration, an ongoing engineering partner, a dedicated pod, or a fully
managed data function.

The site is the commercial front door: it has to make a buyer recognise their own
situation, and then start a conversation (enquiry, Data Health Check booking, or
a free tool). Success is a qualified enquiry, not a pageview.

The stated test for the work itself: **it is judged by whether it gets used.** An
unopened dashboard and an AI system nobody relies on fail for the same reason.

## Positioning

**Data-first. Settled, after the AI variant was tried and rejected.** Data is
the subject of the sentence; AI is one of the things the data makes possible.
The brand line is "Where Data Becomes Intelligence." and the lockup reads
"Data + AI Solutions".

The decision is a positioning one, not a capability one: Cognovea continues to
build AI, and the generative AI and AI strategy pages stay. What changed is
which half is the subject. An AI-first brand put Cognovea in the most crowded
category in the market and competed on the half that is easiest to claim; the
data engineering is the half that is hard, demonstrable, and genuinely theirs.

The argument that was written for the AI variant survives the change and is
worth keeping, because it is stronger from this side: most AI projects do not
fail because the model was wrong, they fail because the data underneath could
not carry the question. Said by an AI company that is marketing. Said by a data
company it is a credential.

Mechanically this lives in `src/lib/positioning.ts`, which holds both voices
behind `NEXT_PUBLIC_POSITIONING` and defaults to `data` when the variable is
unset — so the default is now correct and the variable is no longer set in any
environment. The honest end state is the one the file's own header asks for:
delete it and inline the data voice. The `ai` variant is the retired one.

Service page titles stay as they are regardless — "SAP Data Migration &
S/4HANA", "SCADA & Historian Data Analytics" — because they are titled for what
a buyer types into a search box.

What a neighbouring firm could not truthfully copy: both halves in one place.
The industrial data work (SAP ECC readiness, Oracle EBS→Fusion conversion, SCADA
and historian data joined to ERP) sits under the same roof as the AI that runs on
it, and the people to operate it afterwards. The comparison table on `/about-us`
positions this explicitly against two alternatives — hiring specialists directly
(slow, months-long search) and large consultancies (heavy, layered process) —
with Cognovea as readily available, deliberately light on process, sized to what
is in front of you.

## Operating Context

- Buyers arrive by search. Every page is written and titled for a real query;
  `/tools` and `/playbooks` exist to be linked to rather than found, and rank
  above the blog in the sitemap for that reason.
- Engagement shapes, all real and all live on the site: project work, dedicated
  data teams (one analyst through a full pod, senior lead throughout), managed
  data services, fractional data leadership (a senior data owner a few days a
  month), and a fixed two-week **Data Health Check** as the paid entry point.
- Pricing is published: the Data Health Check starts at **Rs 1,50,000 in India
  and $2,499 elsewhere**. These are two prices, not one converted — the dollar
  figure is a judgement about what the work is worth outside India. Both numbers
  ship in the HTML on every page; the browser's timezone decides which is shown,
  which is what keeps the pages static and edge-cached.
- Delivery is from two Indian offices: headquarters in HSR Layout, Bengaluru
  (Karnataka) and a development centre in Old Palasia, Indore (Madhya Pradesh).
  Contact is `hello@cognovea.com` and two Indian mobile numbers.
- Clients are reached in both India and abroad; the site serves `www.cognovea.com`
  and Vercel functions are pinned to Singapore (`sin1`) to sit beside the Neon
  Postgres database.

## Capabilities and Constraints

**What the business does** (the chain the site uses: Build → Understand →
Predict → Automate → Operate):

- Data engineering: ETL/ELT pipelines, cloud data infrastructure, warehouses and
  lakes, API integrations, migration and modernization.
- Analytics & BI: Power BI and Tableau dashboards, KPI reporting, sales,
  marketing, financial and operational analytics.
- AI: agents, RAG and knowledge assistants, natural-language analytics,
  forecasting and predictive models, automated reporting, workflow automation.
  AI is built only where a use case is found and confirmed worth pursuing first.
- Dedicated data teams: analysts, data engineers, BI developers, analytics
  engineers, data scientists.
- Managed data services: Cognovea operates the data function outright.
- Named industrial specialisms: SAP ECC → S/4HANA data readiness and cleansing,
  Oracle EBS → Fusion conversion with mock loads and reconciliation, SCADA and
  historian data analytics.

**Terminology that is deliberate:** SCADA is a capability demonstrated inside
energy work, not an industry Cognovea serves — it keeps its page but is reached
from the Oil & Gas page, never listed beside Manufacturing in the industries
menu. "Playbooks" are reading material and live under Resources; the industry
pages are the commercial pages.

**Technical constraints:**

- Next.js 15 App Router + TypeScript + Payload CMS 3.88 on Neon Postgres, Vercel
  Blob for uploads, one hand-written stylesheet, no CSS framework. The ten
  original marketing pages are statically generated with their copy in code, on
  purpose: the copy is verbatim from source documents and the render harness in
  `tools/` can prove it. Payload owns only Insights, Jobs, Portfolio, Clients,
  Testimonials, Enquiries, Tool leads and Site Settings.
- `next` is pinned with a tilde because Payload's peer range doubles as a
  security floor. `--legacy-peer-deps` and `--force` are forbidden here.
- The design system is token-driven; dark bands redeclare `--fg`, `--line`,
  `--card`, `--eyebrow` and `--ghost-border` so a component works on either
  ground. New components are styled against tokens, never literal colours.
- A repo guard (`tools/repo-guard.mjs`) runs at pre-commit, pre-push and in CI
  and refuses scripts, binaries, encoded payloads, unlisted network hosts and
  unlisted dependencies. Every exception is a reviewable edit to
  `tools/repo-guard.allow.json`.
- Server/client boundary: any helper a Server Component calls lives in
  `src/lib/`, never in a `'use client'` module. `npm run check:boundaries`
  enforces it.

**Explicitly undecided or unfinished:**

- Social profile URLs are empty; the "Connect With Cognovea" block stays hidden
  until they are filled.
- `/privacy-policy` is a working draft awaiting counsel review against the DPDP
  Act 2023 and GDPR, and a named grievance officer. Gaps are marked `TODO` in
  the page.
- Email transport is not configured: enquiries are saved and readable in the
  admin but nobody is notified.
- `src/migrations` is empty and schema push is off in production.
- The homepage People section has a marked `TEAM PHOTOGRAPHY SLOT` awaiting a
  real 4:5 team photograph.

## Brand Commitments

- Name **Cognovea**. Lockup second line: "Data + AI Solutions". Tagline: "Where
  Data Becomes Intelligence." The retired `ai` variant reads "AI + Data
  Solutions" and "AI, Built on Data That Holds Up."
- The mark is the particle **C** from cognovea.com — an open ring of points,
  dense along the stroke, fraying at the tips, aperture facing right, colour
  reading diagonally violet → mid blue → cyan. Brand ramp taken from the live
  mark, not approximated: `#7C3AED` → `#4F6BF0` → `#22D3EE`.
- Voice: plain, concrete, unhyped. The site states what a thing does and what it
  avoids; it does not promise AI as a catch-all. Copy on the ten original
  marketing pages is verbatim from source documents and is not to be reworded
  without asking.
- Certifications displayed: ISO/IEC 27001, ISO 9001, CMMI Level 3. The rule
  attached to them is binding: only a mark supplied by the certifying body may
  be shown, never a generic badge taken off the web, and certificate numbers
  belong with them. The `body` and `ref` fields are currently unfilled.

## Evidence on Hand

- **Client logos — real and live.** Published through the Payload `Clients`
  collection and rendered on the site. The collection refuses to save without an
  explicit "we have permission to display this logo" confirmation.
- **Testimonials — real and live.** Published through the `Testimonials`
  collection with author name, role, company and an explicit "this person agreed
  to be quoted publicly" confirmation, shown in the homepage carousel.
- **Case studies with outcome numbers exist and can be written up.** They are
  not yet in the repository or the Portfolio collection.
- **PredictX is the only case study transcribed so far**, from
  `PredictX_Case_Study_Final.docx`, wording unchanged. The source document has no
  client, no results and no screenshots, so the entry has none either. This
  absence is deliberate and must not be filled in with invented detail.
- Client attribution is gated in code: a client's name appears only when the
  permission box is ticked, otherwise the sector stands in ("a manufacturing
  client").
- Published, checkable facts available for use: the Data Health Check price in
  both currencies, engagement durations and starting prices from the source
  documents, the technology stack shown in the marquee, and the two office
  addresses.
- Not available and not to be fabricated: analyst badges, awards, benchmark
  results, headcount claims, or client results beyond what is confirmed above.

## Product Principles

1. **Judge it by whether it gets used.** An unopened dashboard and an unused AI
   system fail identically. Anything built here is measured that way.
2. **Understand the business before the technology.** What decision is hard,
   what number nobody trusts, what report takes too long — then look at the
   data, then build only what is needed.
3. **Build only what is genuinely needed.** Complexity is not sophistication. If
   the analytics is more complicated than the spreadsheet it replaced, it
   failed.
4. **Claim nothing that is not real.** Proof is shown only when it exists and
   permission has been given; absences are stated rather than filled. The layouts
   for logos, awards and case studies are already built and wait empty.
5. **One source of truth.** Domain, prices, nav, routes and FAQ schema are each
   defined once and composed everywhere, so two copies of a string can never
   disagree.

## Accessibility & Inclusion

No formal conformance target has been confirmed by the business. What the
implementation already commits to, and future work must preserve: a skip link,
visible focus rings, `aria-expanded`/`aria-controls` on every disclosure, roving
tabindex on tabs, table captions, 48px minimum tap targets in the mobile drawer,
a full `prefers-reduced-motion` path that stops the hero animation and every
scroll reveal, a `<noscript>` fallback so a JavaScript-less reader gets the whole
page rather than a blank one, and pause/stop control on the moving testimonial
carousel per WCAG 2.2.2. Link and eyebrow colour uses `--blue-ink` (`#3050D8`)
rather than the brand mid-blue, which only reaches ~4:1 on white.
