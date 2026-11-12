---
name: Cognovea
description: A white canvas held under a strict colour budget, weighted with deep navy, where the brand spectrum is spent only as signal.
colors:
  signal-violet: "#7c3aed"
  signal-violet-light: "#a78bfa"
  signal-violet-deep: "#4c1d95"
  signal-violet-wash: "#f7f3fe"
  instrument-blue: "#4f6bf0"
  instrument-blue-light: "#60a5fa"
  legible-blue: "#3050d8"
  readout-cyan: "#22d3ee"
  deep-water-navy: "#0a1024"
  deep-water-navy-raised: "#111a33"
  paper: "#ffffff"
  paper-tint: "#f5f7fb"
  paper-tint-strong: "#eef2f9"
  ink: "#0a1024"
  ink-muted: "#48536b"
  ink-soft: "#667085"
  error-border: "#dc4d6b"
  error-text: "#c2334f"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, min(7.6vw, 10.4vh), 5.8rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.042em"
  headline:
    fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.85rem, min(3.6vw, 5.2vh), 2.95rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.036em"
  title:
    fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.3rem, 2.1vw, 1.7rem)"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "-0.028em"
  subtitle:
    fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.08rem, 1.5vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.022em"
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.22rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.011em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.006em"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.65
    letterSpacing: "0.16em"
rounded:
  focus: "4px"
  chip: "7px"
  control: "8px"
  surface: "16px"
  surface-lg: "24px"
spacing:
  gutter: "clamp(1.15rem, 4vw, 2.5rem)"
  band: "clamp(2.4rem, min(5vw, 7.4vh), 4.75rem)"
  grid-gap: "clamp(1rem, 2vw, 1.75rem)"
  card-pad: "clamp(1.6rem, 2.4vw, 2.2rem)"
  card-pad-lg: "clamp(2rem, 3.2vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.signal-violet}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0.95rem 1.7rem"
  button-primary-hover:
    backgroundColor: "#6a2fd4"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0.95rem 1.7rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.95rem 1.7rem"
  button-sm:
    backgroundColor: "{colors.signal-violet}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0.6rem 1.15rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "{spacing.card-pad}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.chip}"
    padding: "0.45rem 1rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.9rem 1.05rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "0.6rem 0.9rem"
---

# Design System: Cognovea

## Overview

**Creative North Star: "The Instrument, Not the Poster"**

This is an enterprise instrument rather than a startup poster. Solid colour does
nearly all of the work; the brand spectrum is spent as signal, in four named
places, and withheld everywhere else. The ground alternates between a white
canvas and a deep navy that supplies weight, and the alternation itself is what
creates structure — a reader moving down a page is moving between plates, not
scrolling through decoration.

The mood is confident, clear and quietly modern. It is legible to a mid-market
buyer and credible to an enterprise one, which is a narrower target than either
alone: too much exuberance loses the second, too much grey loses the first. The
resolution is restraint with one very saturated exception, held in reserve.

Every band is bounded by viewport height as well as width, so a section lands at
or inside one screen on a short laptop rather than growing to fill whatever type
scale the width suggests. Measured at 1440×900 every section sits between 0.74
and 0.98 screens. That constraint is structural, not stylistic: it is why the
type scale clamps against `vh` and why five-item rows get their own grid.

**Key Characteristics:**

- A held colour budget: ~55% white and near-white, ~30% deep navy, ~10% violet
  and blue, ~5% cyan and gradient.
- The gradient is rationed to four appearances and never fills a surface.
- Semantic tokens redeclare on dark ground, so one component works on either
  plate without a variant.
- Sections are height-bounded; one screen is the working target.
- Type is Sora over Inter, tracked tight and negative at every heading size.
- Generated, deterministic artwork rather than stock imagery or icon sets.

## Colors

A cool, high-contrast palette: a single saturated ramp running violet through
blue to cyan, played against white and a navy dark enough to read as ink.

### Primary

- **Signal Violet** (`{colors.signal-violet}`): the action colour. Primary
  buttons, the required-field asterisk, the nav's active underline, the input
  focus ring, and the `::selection` wash. When something on the page is the
  thing to press, it is this colour and solid.
- **Signal Violet Deep** (`{colors.signal-violet-deep}`) and **Signal Violet
  Light** (`{colors.signal-violet-light}`): ramp ends, used in the mark and in
  gradient stops. Not text colours.
- **Signal Violet Wash** (`{colors.signal-violet-wash}`): the brand violet over
  white at 6%, the only tinted brand ground in the system. The 6% is measured,
  not chosen: at 8% muted text on it falls to 4.42:1 and fails AA, and a solid
  violet ground puts a dark client logo at 2.22:1.

### Secondary

- **Instrument Blue** (`{colors.instrument-blue}`): the middle of the brand ramp,
  taken from the live mark. It belongs in gradients and marks. It reaches only
  about 4:1 on white, so it is never a text colour.
- **Legible Blue** (`{colors.legible-blue}`): what Instrument Blue becomes when
  it has to be read. Inline links, arrow links, eyebrows on light ground, and
  the focus outline.

### Tertiary

- **Readout Cyan** (`{colors.readout-cyan}`): the scarcest colour in the system
  and the one that only appears against dark. On navy it becomes the eyebrow
  colour, the link colour and the focus ring; on white it appears only as the
  terminating stop of the gradient. It is where the particle mark dissolves.

### Neutral

- **Paper** (`{colors.paper}`): the default ground and the card surface on light
  bands.
- **Paper Tint** (`{colors.paper-tint}`) and **Paper Tint Strong**
  (`{colors.paper-tint-strong}`): the alternating light band and its heavier
  sibling, used to separate consecutive light sections without a rule.
- **Deep Water Navy** (`{colors.deep-water-navy}`): the weight in the system.
  The hero, How We Work, the closing CTA and the footer stand on it. It is also
  the ink colour on light ground, which is why the page reads as one material
  inverted rather than two palettes.
- **Deep Water Navy Raised** (`{colors.deep-water-navy-raised}`): a lifted navy
  for surfaces sitting on the navy plate.
- **Ink Muted** (`{colors.ink-muted}`): secondary prose, nav links at rest,
  field labels.
- **Ink Soft** (`{colors.ink-soft}`): the quietest text that is still text —
  the logo tagline, form notes, inactive tab and rail labels, placeholders. It
  was raised from `#79839a`, which reached only 3.80:1 on white; the current
  value clears AA on white (4.97) and on the tinted band (4.64).
- **Error Border** (`{colors.error-border}`) and **Error Text**
  (`{colors.error-text}`): the only non-brand hue in the system, two steps apart
  because the text needs more contrast than the stroke.

### Named Rules

**The Rationed Gradient Rule.** The violet→blue→cyan gradient appears in exactly
four places: the logo mark, one word of the hero headline, the 2px scroll
progress bar, and a 2px hairline revealed on card hover. It is a line or a mark,
never a fill. A new use has to be argued for, not assumed.

**The Two Blues Rule.** Instrument Blue is for gradients and marks; Legible Blue
is for anything a person reads. They are not interchangeable and the difference
is contrast, not taste.

**The Inverted Plate Rule.** Dark sections redeclare `--fg`, `--fg-2`, `--fg-3`,
`--line`, `--line-2`, `--card`, `--eyebrow`, `--link` and `--ghost-border`
rather than overriding component rules. Style new components against those
tokens and they work on either ground for free. Style against a literal colour
and they will be dark-on-dark in a band you have not seen yet — this has
already happened once, across five pages, at ratios as low as 2.45:1.

## Typography

**Display Font:** Sora (with `ui-sans-serif, system-ui, -apple-system, Segoe UI,
sans-serif`)
**Body Font:** Inter (with the same fallback chain)

Both are self-hosted through `next/font`. There is no third face: labels and
eyebrows are Inter pushed to 600 weight and wide tracking rather than a separate
mono or display cut.

**Character:** Sora's geometric, slightly squared letterforms carry the headings
with heavy negative tracking, which is what makes a heading read as a single
mass rather than a row of words. Inter underneath is neutral and highly legible
at the site's slightly-larger-than-default 16.5px body size. The pairing is
contemporary without being fashionable — it will not date the way a serif
display choice would.

### Hierarchy

- **Display** (600, `clamp(2.5rem, min(7.6vw, 10.4vh), 5.8rem)`, 0.98): hero
  headlines only, one per page. Tracking at `-0.042em`, the tightest in the
  system.
- **Headline** (600, `clamp(1.85rem, min(3.6vw, 5.2vh), 2.95rem)`, 1.08):
  section headings. The `vh` term in the clamp is load-bearing — a purely
  width-based heading is what pushes a section past one screen on a short
  laptop.
- **Title** (600, `clamp(1.3rem, 2.1vw, 1.7rem)`, 1.22): card and sub-section
  headings.
- **Subtitle** (600, `clamp(1.08rem, 1.5vw, 1.25rem)`, 1.3): the smallest
  heading, used inside dense cards and list items.
- **Lede** (400, `clamp(1.05rem, 1.4vw, 1.22rem)`, 1.6): the paragraph directly
  under a hero or section heading, in Ink Muted. Section heads cap at `60rem`.
- **Body** (400, 16.5px, 1.65): default prose, `-0.006em` tracking.
- **Label** (600, 12px, `0.16em`, uppercase): the eyebrow. Always preceded by a
  24×1.5px rule in the current colour, set as a `::before`, which is what makes
  it read as a tab on the section rather than as small text.

### Named Rules

**The Negative Tracking Rule.** Every heading size carries negative
letter-spacing, tightening as the size grows (`-0.022em` at subtitle through
`-0.042em` at display). A heading set at default tracking will look wrong here
before you can say why.

**The Balanced Heading Rule.** Headings carry `text-wrap: balance`. Do not
hand-break them with `<br>`.

## Layout

A single centred container at `1240px` with a fluid gutter of
`clamp(1.15rem, 4vw, 2.5rem)`. Vertical rhythm is the `--band-y` scale,
`clamp(2.4rem, min(5vw, 7.4vh), 4.75rem)` — height-aware, so short screens get
tighter bands automatically rather than through a media query.

Sections are `.band`, alternating ground: default white, `.band--tint` on Paper
Tint, `.band--dark` on Deep Water Navy. The sticky nav reserves `82px`, and the
hero is `min-height: calc(100svh - var(--nav-h))` — `min-height` so large text
zoom grows it rather than clipping it, and `svh` so mobile browser chrome does
not cause a jump.

Grids are explicit rather than `auto-fit`: `.grid--2` goes two-up at 760px;
`.grid--3` and `.grid--4` go two-up at 620px and full at 1000px; `.grid--5` has
its own ladder so five items never wrap to 3 + 2 and cost a whole extra row.
Breakpoints in use: 560, 620, 760, 900, 920, 960, 1000, 1020, 1240px. The footer
grid is explicit breakpoints for the same reason — mixing `minmax(0, 1.5fr)`
with `repeat(auto-fit, …)` produced phantom 0px tracks and let the brand lockup,
which cannot go under ~236px, overflow its cell onto the next column.

Long-copy sections use `.feature--copy`: prose takes 1.55fr against the art's
1fr, top-aligned, with the figure `position: sticky`. A 1:1 centred split
narrows nine paragraphs by about 30%, making them about 30% taller, and leaves
the figure floating in the middle of a tall column.

`html` and `body` carry `overflow-x: clip` — `clip`, not `hidden`, because
`hidden` makes the element a scroll container and silently breaks every
`position: sticky` descendant.

### Named Rules

**The One Screen Rule.** Every section is sized to land at or under one screen.
Three mechanisms do it: type clamped against `vh` as well as `vw`, `.grid--5`
for five-item rows, and the height-aware band scale. Pages carrying several
hundred words of source copy are the honest exception.

**The Source Order Rule.** The viewport-height trims sit at the end of
`globals.css` deliberately. They override `.c-hero`, whose base rule appears
later in the file, and at equal specificity source order decides. Moving them up
silently disables them.

## Elevation & Depth

A hybrid, and the two halves do different jobs. **Structural depth comes from
the band stack** — white, tint, navy — which is why the page has a sense of
layers without a single shadow being visible at rest. **Interactive depth comes
from the shadow vocabulary**, which exists only to answer hover and focus.
Surfaces are flat until something happens to them.

The navy bands are not "dark mode"; they are the same material seen from the
other side, which is why the token redeclaration approach works at all.

### Shadow Vocabulary

- **Ambient** (`box-shadow: 0 1px 2px rgba(10, 16, 36, 0.04), 0 2px 8px -3px rgba(10, 16, 36, 0.06)`):
  the barely-there resting shadow, for elements that need to separate from a
  tinted ground without lifting.
- **Lift** (`box-shadow: 0 20px 48px -26px rgba(10, 16, 36, 0.3), 0 2px 8px -3px rgba(10, 16, 36, 0.05)`):
  the card hover shadow. Long, soft, heavily negative-spread, so it reads as
  distance rather than as a drop shadow.
- **Deep Lift** (`box-shadow: 0 40px 90px -40px rgba(10, 16, 36, 0.45)`): for
  the few elements that float above the page — the nav dropdown, the drawer.
- Primary buttons carry their own violet-tinted shadow
  (`0 10px 26px -14px rgba(124, 58, 237, 0.9)`, deepening on hover) rather than
  a neutral one, so the glow reads as belonging to the button's colour.

### Named Rules

**The Flat-At-Rest Rule.** No surface carries a shadow in its default state
except where it must separate from a tinted ground. Shadow is a response.

## Shapes

A two-tier radius system with no sharp corners and no pills. Controls — buttons,
inputs, selects, nav links — are `8px`, tight enough to read as precise. Surfaces
— cards, panels, the completed-form state — are `16px`, with `24px` reserved for
the largest containers. Chips sit at `7px`, deliberately one pixel under the
control radius so a row of chips does not read as a row of buttons. The focus
outline rounds at `4px`.

Borders are hairlines in a token, never a literal colour: `--line` at 10% ink for
dividers and card edges, `--line-2` at 18% for inputs, chips and anything that
must look interactive. On navy the same tokens become 12% and 22% white.

The recurring silhouette is the horizontal hairline: the eyebrow's 24px rule, the
nav link's underline scaling from the left, the card's gradient hairline doing
the same, and the 2px scroll progress bar across the top of the viewport. Four
different components, one gesture.

## Components

### Buttons

- **Character:** tactile and confident. A button answers when touched — it moves,
  the arrow inside it moves further, and the shadow deepens under it.
- **Shape:** tightly rounded (`8px`), 1px transparent border so ghost and primary
  share a box model.
- **Primary:** Signal Violet with white text, `0.95rem 1.7rem`, carrying a
  violet-tinted shadow. Hover darkens to `#6a2fd4`, lifts 2px, deepens the
  shadow.
- **Ghost:** transparent on a `--ghost-border` stroke that adapts to whichever
  ground it sits on. Hover fills with `--ghost-hover-bg` and lifts 2px.
- **Small:** `0.6rem 1.15rem` at 13.5px, for nav and inline placements.
- **Arrow behaviour:** any `svg` inside a button translates 4px on hover. This is
  the one piece of motion the system uses to indicate direction.
- **Disabled:** 45% opacity, `not-allowed`, and explicitly no transform — a
  button that moves under the cursor reads as clickable.
- **Labels wrap.** Buttons must not carry `white-space: nowrap`; a 327px label
  once forced the entire page to 364px wide and clipped the layout on every
  narrower phone. `max-inline-size: 100%` is the backstop.

### Cards

- **Corner Style:** `16px`, or `24px` on the largest.
- **Background:** `--card`, which is white on light ground and 4.5% white on
  navy — so the same card is a solid plate on one band and a frosted one on the
  next.
- **Border:** 1px `--line`, moving to `--line-2` on hover.
- **Shadow Strategy:** flat at rest, Lift on hover with a 4px rise.
- **Signature:** a 2px gradient hairline pinned to the top edge, `scaleX(0)` at
  rest, scaling from the left over 0.55s on hover. This is one of the four
  sanctioned gradient appearances.
- **Internal Padding:** `clamp(1.6rem, 2.4vw, 2.2rem)`, or the `--pad-lg` step.
- `.card--flat` opts out of both the lift and the shadow while keeping the rest.

### Chips

- **Style:** transparent on a 1px `--line-2` stroke, `7px` radius, 13.5px
  medium, Ink Muted.
- **State:** hover brings the text to full Ink and the border to Instrument
  Blue. They are read-only labels here, not filters.

### Inputs / Fields

- **Style:** `8px` radius, 1px `--line-2` stroke, white ground on light bands and
  7% white on dark, 15px Inter, `0.9rem 1.05rem`.
- **Label:** 13.5px medium in Ink Muted above the field; the required asterisk is
  Signal Violet.
- **Focus:** border becomes Signal Violet with a 3px `rgba(124, 58, 237, 0.14)`
  ring. The native outline is suppressed only because this replacement is
  stronger.
- **Error:** border to Error Border, message below at 12.5px in Error Text.
- **Select:** native appearance removed, with an inline SVG chevron at `right
  1rem center`.

### Navigation

- **Style:** sticky, transparent over the hero, and on scroll it becomes 88%
  white with `blur(20px) saturate(1.6)` and a hairline bottom border. 82px tall.
- **Links:** 15px at weight 450 in Ink Muted, `8px` radius, with a 1.5px Signal
  Violet underline inset from the padding that scales from the left on hover and
  on `aria-current="page"`.
- **Dropdowns:** a Deep Lift panel; the trigger's chevron rotates 180°.
- **Mobile:** a drawer whose link typography is scoped to `.c-drawer__group a`,
  deliberately not `.c-drawer__body a` — the looser selector also matched the CTA
  and beat `.btn` on specificity, dropping the arrow to a second line. Drawer
  links carry a 48px minimum height; the drawer CTA is full width and centred.

### The Eyebrow

The system's most-repeated component and the one that sets its tone. An
uppercase 12px Inter label at `0.16em` tracking in `--eyebrow` — Legible Blue on
white, Readout Cyan on navy — preceded by a 24×1.5px rule in `currentColor`. It
labels the section the way a tab labels a drawer.

### The Mark

`Mark.tsx` (SVG lockup) and `MarkCanvas.tsx` (hero canvas) render the same
object: a particle **C**, dense along the stroke, fraying at the tips and
dissolving outward toward an aperture that faces right, coloured diagonally
violet → blue → cyan. The generator in `src/lib/mark.ts` is **seeded, not
random** — the lockup is server-rendered, so an unseeded generator would trip a
hydration mismatch. Two knobs matter: the 34px lockup needs roughly half the
points at about 3× the radius, or it degrades into a grey smudge. The hero
animation pauses when scrolled out of view or when the tab hides, and reduced
motion paints the resolved mark once without animating.

### Motion

One easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`, on everything. Durations sit
between 0.25s for colour changes and 0.9s for scroll reveals. The reveal system
is a single IntersectionObserver driving every `.rv` element: 26px up by default,
26px sideways for `.rv--left` / `.rv--right`, `scale(0.965)` for `.rv--scale`,
with a per-element `--rv-delay`. Below 900px the sideways variants fall back to
vertical — the 26px translation put content about 8px past the viewport edge on a
phone, which iOS Safari let you pan to.

## Do's and Don'ts

### Do:

- **Do** style new components against the semantic tokens (`--fg`, `--fg-2`,
  `--fg-3`, `--line`, `--line-2`, `--card`, `--eyebrow`, `--link`,
  `--ghost-border`) so they work on white and navy without a variant.
- **Do** clamp heading sizes against `vh` as well as `vw`, following the existing
  scale, so sections keep landing inside one screen.
- **Do** keep the gradient to a line, a mark or a hairline. It has four homes
  today; adding a fifth should be a decision, not a default.
- **Do** use Legible Blue (`{colors.legible-blue}`) for anything a person reads
  and Instrument Blue (`{colors.instrument-blue}`) only in gradients and marks.
- **Do** let button labels wrap, and keep `max-inline-size: 100%` on them.
- **Do** give every disclosure `aria-expanded` / `aria-controls`, every moving
  element a reduced-motion path, and every tap target in the drawer 48px.
- **Do** put helpers a Server Component calls in `src/lib/`, and run
  `npm run check:boundaries` after adding one.

### Don't:

- **Don't** reach for a literal hex where a token exists. That is how five pages
  ended up dark-on-dark at 2.45:1 on markup that looked correct.
- **Don't** fill a surface with the gradient, and prefer solid colour for
  buttons, cards, icons and backgrounds. A violet button beside a violet heading
  on a violet card is what makes a site read as a startup landing page rather
  than an enterprise one — a surface can earn an exception, but it should be
  arguing for one.
- **Don't** use `overflow: hidden` on `html` or `body`; it makes them scroll
  containers and breaks every sticky element on the site. `clip` is the value.
- **Don't** put `white-space: nowrap` on a button.
- **Don't** move the viewport-height trims from the end of `globals.css`.
- **Don't** add a third typeface. Labels are Inter at 600 and wide tracking.
- **Don't** introduce an unseeded random generator into anything
  server-rendered.
- **Don't** ship placeholder proof. The layouts for client logos, awards and case
  studies exist and stay empty until real ones arrive; the generated artwork in
  `public/img` is explicitly a placeholder for photography, not a substitute for
  it.
