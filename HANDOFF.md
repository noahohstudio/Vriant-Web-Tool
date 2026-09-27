# Vriant — Handoff v0.1

> **Status:** design direction set for v0.1 · 26 Sep 2026
> Figma holds the visuals. This file explains the intent behind them, lists the tokens, and records the decisions made so far.
> If the two disagree, fix one of them and note it in the decision log at the bottom.

---

## 1. What Vriant is

Vriant turns this week's homework into next week's practice.

A student scans a physics or maths worksheet. Vriant finds the problems and writes a short practice test made of **variants**: the same problems with new numbers. When the student hands the test back, typed or on paper, Vriant grades it and shows worked solutions. The sheet can then be filed under a class, or simply let go.

**The loop:** Scan → Practice → Grade → File.

**Who it's for:** secondary and early-university students working through physics and maths problem sets.

**What it is not.** This is the main thing that sets Vriant apart from Quizlet-style edtech:

- It's a tool you pick up, not a place you live. Nothing is kept unless you archive it.
- No decks, streaks, points, leaderboards, feeds or mascots. No confetti, and no shaming a low score.
- No accounts in v1. Login is a maybe for later, once the base tool has proven itself.

---

## 2. Links

| What | Where |
|---|---|
| Figma file | [Vriant Design System — Screens](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens) |
| Design system (14 boards) | [Design System page → section “Vriant — Design System”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-2) |
| Desktop flow (6 screens) | [Screens page → section “Vriant — Desktop flow v1”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1434) |
| Design references | Outcome logo builder (earlier project; structure only, not the look) · [roydenso.com/landing](https://roydenso.com/landing) (construction lines) |

Boards: [00 Cover](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-3) ·
[01 Colour](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-12) ·
[02 Type](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-21) ·
[03 Space, radius & depth](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-30) ·
[04 Lines](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-39) ·
[05 Palette directions](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-48) ·
[06 Actions](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-57) ·
[07 Inputs](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-66) ·
[08 Grading & progress](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-75) ·
[09 Intake & archive](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-84) ·
[10 Practice](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-93) ·
[11 Navigation & overlays](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-102) ·
[12 Icons](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-111) ·
[13 Themes](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-120)

---

## 3. Core flow (desktop v1)

Every screen uses the same frame: a 64px header whose bottom edge is the **header rule**; a 280px left **rail** whose right edge is the **rail rule**; the main area; and a 40px footer on the **footer rule** carrying a mono status line. Nodes mark the joints (see §5.4).

| # | Screen | Job | Key components |
|---|---|---|---|
| 01 | [Intake](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1445) | Get a sheet in: file, camera or paste. The rail shows recent sheets and classes. | Header, Dropzone (Idle / Drag over / Scanning), Section Label |
| 02 | [Review scan](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1505) | Show what the scanner found on the page; the student includes or excludes problems and sets up the test. | Detected Region, Checkbox, Segmented Control, Field (as Select), Toggle, Button |
| 03 | [Practice](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1565) | One question at a time. The rail lists every question; an aside shows answered, flagged and time. | Test Progress, Question Card (Taking), Answer Field / Choice, Kbd |
| 04 | [Hand in](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1622) | Choose how to be graded: **typed answers** (instant) or **scan the paper** (this is the intake for completed sheets). Optional: typed answers can skip straight to Results. | Answer Field (Answered), Dropzone, Button |
| 05 | [Results](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1678) | Score, what to review, plain-language feedback, worked solution, and a "try a similar one" loop. | Score Summary, Result Row, Grade Mark, Answer Field (graded), Worked Solution |
| 06 | [Archive](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1734) | File by class, search and filter; filing confirms with a toast and Undo. | Class Folder, Sheet Row, Field (search), Segmented Control, Toast |

### Behaviour notes per step

- **Intake.** Accepts PDF, PNG and JPG, up to 20 pages, and handwriting is fine. Camera is its own entry point. `⌘V` pastes. While scanning, the scan line runs edge to edge and a 3px bar on the bottom edge shows progress.
- **Review scan.** Each detected problem is a Detected Region laid over the page image:
  - Selected: included in the test.
  - Detected: found but not yet chosen.
  - Excluded: unsupported, such as sketches and proofs, with the reason shown in its label.

  Setup has three controls: question count (5, 10 or 15), difficulty (easier, same as the original, harder) and an optional timer. Generating takes about 20 seconds.
- **Practice.**
  - *Provenance.* Every card says where it came from: a "Variant" tag, then "of problem 3 · Kinematics — Worksheet 4".
  - *Changed values.* Values that changed from the original are set in accent ink at Medium weight.
  - *Answers.* Free-response answers keep the unit outside the value, so students never type units.
  - *Actions.* Hint, Skip, Flag and Next are on every card, with the shortcuts `Enter` (next), `H` (hint), `F` (flag) and `S` (skip).
  - *Handing in.* The student can hand in any time. Blanks count as *skipped*, not wrong.
- **Hand in (paper path).** The student scans the finished sheet, Vriant matches each answer to its question, and grading then runs exactly as it does for typed answers.
- **Results.** The score uses tabular numerals (e.g. 7.5/10 = 75%), with a breakdown bar and legend (correct / partial / to review).
  - Each missed question shows what the student wrote, the expected value, one sentence of feedback on *why*, and the worked solution as connected steps.
  - "Try a similar one" makes a fresh variant of that single problem.
- **Archive.** Each class has a hue, chosen once from six. Lists are Sheet Rows on divider rules, with no cards around them. Deleting always asks for confirmation; filing and moving use Undo instead.

### Edge cases still to design
Blurry or tilted scan · no problems found · mixed subjects on one sheet · problem split across two pages · student disputes a grade · grading uncertain (low confidence on handwriting) · offline · very long prompts or figures.

---

## 4. Scope

**v1 (build this):** the six-step desktop flow above; the three themes; local archive; free response and multiple choice; typed and paper grading; worked solutions; keyboard shortcuts.

**Later:** mobile / camera-first capture · print or PDF export of practice tests (the paper path needs a print layout, not yet designed) · accounts and sync · motion spec · more problem types (graphs, sketches, proofs).

**Not planned:** social features, gamification, shared decks, teacher dashboards.

---

## 5. Design direction

### 5.1 Principles
1. **Friendly, not cute.** Round shapes, warm paper, plain words.
2. **Precise lines.** A drafting grid holds each page together. Rules follow real edges, and nodes mark the joints.
3. **Temporary by design.** Use it, file the sheet, move on.
4. **One accent.** Ballpoint blue marks what you can act on or what is current. Everything else is paper and graphite.

### 5.2 Colour & themes
- **Signature** is the default theme: oat paper `#ECE5D8`, graphite ink `#1C1B19`, ballpoint blue `#3348D4`.
- **Light** swaps in paper white; **Dark** uses graphite paper with oat ink.
- The theme switch lives in the header (Signature = incline mark, Light = sun, Dark = moon) and persists per device. First visit uses Signature. Whether to follow `prefers-color-scheme` is an open question.
- Accent **never fills a button**. Primary buttons are graphite (oat in Dark).
- Status colours are muted and **always paired with a glyph** (✓, ½, ✕), so grades never rely on colour alone.
- `highlight/bg` (marigold) is the "highlighter". It's used for the Variant / Changed tag.
- Contrast is AA or better for primary, secondary, accent, status and button text in all three modes. `text/tertiary` reaches UI-level contrast only: use it for meta and placeholders, never body copy.
- Palette alternatives explored (board 05): Chalk & Ink, Sage & Pine, Legal pad. **Oat was chosen.** Switching later means changing the primitives only.

### 5.3 Type
Geist for everything you read and press. Geist Mono for annotations that sit on rules (indices, specs, units, timestamps). STIX Two Italic appears **only** as a stand-in for rendered maths; the product renders maths with KaTeX.

| Style | Font | Size / line height | Tracking | Use |
|---|---|---|---|---|
| Display/L | Geist SemiBold | 64/68 | −3.5% | Hero moments only |
| Display/M | Geist SemiBold | 48/52 | −3% | Screen hero titles |
| Heading/L | Geist SemiBold | 32/38 | −2% | Screen titles |
| Heading/M | Geist SemiBold | 24/30 | −1.5% | Section and card titles |
| Heading/S | Geist SemiBold | 18/24 | −1% | Small titles |
| Body/L | Geist Regular | 18/28 | −0.5% | **Question prompts** |
| Body/M | Geist Regular | 15/24 | −0.25% | Default reading text |
| Body/S | Geist Regular | 13/20 | 0 | Helper and meta text (13px is the floor for anything read) |
| Label/L · M · S | Geist Medium | 16/20 · 14/20 · 13/16 | −0.5 · −0.25 · 0% | Buttons, inputs, nav, tags |
| Mono/Label | Geist Mono Medium | 11/16, uppercase | +6% | Section indices on rules |
| Mono/S · M | Geist Mono Regular | 12/16 · 14/20 | 0 | Specs, timestamps, units |
| Numeral/XL | Geist SemiBold | 72/72 | −4% | Scores (`font-variant-numeric: tabular-nums`) |
| Math/Expression | STIX Two Text Italic | 20/28 | 0 | KaTeX stand-in only |

Rules: sentence case everywhere; prompts max 680px wide (60–75 characters); tabular numbers for scores, timers and answers.

### 5.4 Lines (the signature move)
1. **Follow real edges:** header bottom, the rail, section tops. A rule exists only where the layout already has a boundary.
2. **Run edge to edge.** Rules overshoot their container and leave the viewport, like construction lines.
3. **Mark the joints.** Where two rules cross, place an 11px cross (Node). Nothing else is ornament.
4. **Labels ride the line.** Section indices are Mono/Label and sit on their rule, never in a box.
5. **Stay quiet.** `line/rule` is 10–12% ink. Rules never cut through cards.

Also part of the system:
- Graph paper (24px, `line/rule`) appears only inside stages: the dropzone, figure wells and the scan preview.
- Viewfinder corners (Scan Corner) mark anything being scanned or detected.
- Worked-solution steps are graph vertices (Node Dot) joined by edges.

Implementation hints:
- Draw rules as 1px borders on layout regions, or as absolutely positioned full-bleed elements.
- Make nodes `aria-hidden` and non-interactive.
- Keep rules at 1px on every screen density.

### 5.5 Shape, space, depth
- 4px base spacing.
- Radii: xs 4 (checkbox), sm 8 (menu rows, key caps), md 12 (inputs, answer fields), lg 16 (cards, choices), xl 24 (dropzone, sheets). Full radius for buttons, tags and switches.
- Separation comes from tone steps (sunken < canvas < surface < raised) and hairlines. Shadows are reserved for things that float: menus, tooltips, toasts, and a sheet mid-drag.
- Focus is a ring (2px canvas gap + 2px accent), never a glow.
- Controls are 32 / 40 / 48 tall; touch targets are never under 40.

### 5.6 Icons & logo
- **Icons:** 30 icons on a 20px grid, 1.5px stroke, round caps and joins. Each is one vector named `glyph`: upload, download, camera, scan, sheet, plus, minus, check, close, arrow left/right, chevron down/right, folder, archive, sun, moon, signature, timer, shuffle, refresh, more, search, hint, trash, edit, flag, sliders, grid, list.
- **Logo (placeholder):** a rounded right triangle, the "incline" (slope in maths, the ramp in physics), plus a lowercase "vriant" wordmark in Geist SemiBold at −4% tracking. It stays until the real identity lands. The alternatives on the cover are Delta and Offset pair.

### 5.7 Voice
Plain and kind:
- Buttons are verbs: "Upload a sheet", "Generate practice test", "Grade now".
- Errors say what to do next.
- Feedback explains the physics, not the failure: "You multiplied top speed by time — use the average speed instead."
- Never "Wrong!"; blanks are "skipped".

---

## 6. Tokens

These are exported from the Figma variables. Names match the Figma code syntax (`var(--bg-canvas)`). Put the theme on `<html data-theme="…">`: omitted or `signature` is the default, `light` and `dark` are the alternatives.

```css
/* ── Theme: Signature (default) ─────────────────────────────── */
:root,
[data-theme="signature"] {
  color-scheme: light;
  --bg-canvas: #ECE5D8;
  --bg-surface: #F3EEE4;
  --bg-sunken: #E2D9C8;
  --bg-raised: #FDFBF7;
  --bg-inverse: #1C1B19;
  --bg-tint: rgba(28, 27, 25, 0.06);
  --bg-tint-strong: rgba(28, 27, 25, 0.10);
  --bg-scrim: rgba(28, 27, 25, 0.40);

  --text-primary: #1C1B19;
  --text-secondary: #6A604F;
  --text-tertiary: #847862;
  --text-inverse: #F3EEE4;
  --text-on-accent: #FFFFFF;

  --line-rule: rgba(28, 27, 25, 0.12);
  --line-divider: rgba(28, 27, 25, 0.10);
  --line-strong: rgba(28, 27, 25, 0.24);
  --line-node: rgba(28, 27, 25, 0.40);

  --accent-default: #3348D4;
  --accent-hover: #2839B5;
  --accent-subtle: rgba(51, 72, 212, 0.10);
  --focus-ring: var(--accent-default);
  --highlight-bg: rgba(242, 193, 78, 0.45);

  --status-correct: #2A7049;
  --status-correct-subtle: rgba(42, 112, 73, 0.12);
  --status-partial: #8F5B12;
  --status-partial-subtle: rgba(201, 138, 27, 0.18);
  --status-incorrect: #B53A2A;
  --status-incorrect-subtle: rgba(181, 58, 42, 0.12);

  --button-primary-bg: #1C1B19;
  --button-primary-bg-hover: #45423E;
  --button-primary-fg: #F3EEE4;

  /* Class hues — identical in every theme */
  --tag-clay: #C2704E;
  --tag-ochre: #C69326;
  --tag-moss: #6F9150;
  --tag-sky: #4F86C0;
  --tag-plum: #8A65A8;
  --tag-slate: #6B7885;
}

/* ── Theme: Light (overrides only) ──────────────────────────── */
[data-theme="light"] {
  --bg-canvas: #FBFAF8;
  --bg-surface: #FFFFFF;
  --bg-sunken: #EDEBE7;
  --bg-raised: #FFFFFF;
  --text-secondary: #5D5A54;
  --text-tertiary: #7C7870;
  --text-inverse: #FBFAF8;
  --line-rule: rgba(28, 27, 25, 0.10);
  --line-divider: rgba(28, 27, 25, 0.08);
  --line-strong: rgba(28, 27, 25, 0.20);
  --line-node: rgba(28, 27, 25, 0.32);
  --button-primary-fg: #FFFFFF;
}

/* ── Theme: Dark ────────────────────────────────────────────── */
[data-theme="dark"] {
  color-scheme: dark;
  --bg-canvas: #151413;
  --bg-surface: #1C1B19;
  --bg-sunken: #0F0E0D;
  --bg-raised: #262523;
  --bg-inverse: #ECE5D8;
  --bg-tint: rgba(236, 229, 216, 0.08);
  --bg-tint-strong: rgba(236, 229, 216, 0.12);
  --bg-scrim: rgba(0, 0, 0, 0.60);

  --text-primary: #ECE5D8;
  --text-secondary: #A09C94;
  --text-tertiary: #7C7870;
  --text-inverse: #1C1B19;
  --text-on-accent: #131A4E;

  --line-rule: rgba(236, 229, 216, 0.10);
  --line-divider: rgba(236, 229, 216, 0.08);
  --line-strong: rgba(236, 229, 216, 0.24);
  --line-node: rgba(236, 229, 216, 0.40);

  --accent-default: #8E9BEC;
  --accent-hover: #B9C2F4;
  --accent-subtle: rgba(142, 155, 236, 0.16);
  --highlight-bg: rgba(242, 193, 78, 0.28);

  --status-correct: #7BD3A0;
  --status-correct-subtle: rgba(123, 211, 160, 0.16);
  --status-partial: #E8B55C;
  --status-partial-subtle: rgba(232, 181, 92, 0.20);
  --status-incorrect: #F2897A;
  --status-incorrect-subtle: rgba(242, 137, 122, 0.16);

  --button-primary-bg: #ECE5D8;
  --button-primary-bg-hover: #D2C6B1;
  --button-primary-fg: #151413;
}

/* ── Scale (all themes) ─────────────────────────────────────── */
:root {
  --space-0: 0; --space-2: 2px; --space-4: 4px; --space-6: 6px; --space-8: 8px;
  --space-12: 12px; --space-16: 16px; --space-20: 20px; --space-24: 24px; --space-32: 32px;
  --space-40: 40px; --space-48: 48px; --space-64: 64px; --space-80: 80px; --space-96: 96px; --space-128: 128px;

  --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 999px;

  --size-control-sm: 32px; --size-control-md: 40px; --size-control-lg: 48px;
  --size-icon-sm: 16px; --size-icon: 20px; --size-header: 64px;

  --stroke-hairline: 1px; --stroke-icon: 1.5px; --stroke-focus: 2px;

  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", monospace;

  /* Shadows are only for floating things. Their colour stays graphite in every theme. */
  --shadow-raised: 0 1px 2px rgba(28, 27, 25, 0.06), 0 2px 6px -2px rgba(28, 27, 25, 0.08);
  --shadow-popover: 0 2px 6px -2px rgba(28, 27, 25, 0.08), 0 12px 32px -8px rgba(28, 27, 25, 0.22);
  --shadow-drag: 0 24px 48px -12px rgba(28, 27, 25, 0.28);
  --focus-shadow: 0 0 0 2px var(--bg-canvas), 0 0 0 4px var(--focus-ring);
}
```

The primitive ramps (oat, graphite, ink, status, hue, plus alpha tints) live in the Figma **Primitives** collection. They are hidden from pickers, and only the Theme tokens above should be used in code.

---

## 7. Components (Figma library, v0.1)

There are 38 components plus 30 icons, 175 variants in total. Every fill and stroke is bound to a Theme variable (audited: 0 unbound colours).

| Component | Variants · properties | Notes |
|---|---|---|
| Logo | Type (Mark / Lockup) × Tone (Ink / Accent) | Placeholder identity |
| Button | Style (Primary / Secondary / Ghost) × Size (M 40 / S 32) × State (Default / Hover / Focus / Disabled) · Label, Leading/Trailing icon toggles + swaps | Pills. One Primary per view. Disabled = 40% opacity |
| Icon Button | Style × Size × State (Default / Hover / Disabled) · Icon swap | Always with a Tooltip |
| Segment · Segmented Control | Selected On/Off · Label, Icon | Question count, filters |
| Theme Switch | Theme (Signature / Light / Dark) | Header; active option shows its name |
| Field | State (Default / Hover / Focus / Filled / Error / Disabled) · Label, Placeholder, Value, Helper, Icon | With Chevron Down it becomes a Select |
| Answer Field | State (Empty / Focus / Answered / Correct / Partial / Incorrect) · Value, Unit, Expected | The grading states live on the answer itself |
| Choice | State (Default / Hover / Selected / Correct / Incorrect) · Letter, Text | Whole row is the hit target |
| Checkbox · Toggle | Off / On / Mixed · Off / On | Toggle = applies immediately |
| Tag | Tone (Neutral / Accent / Correct / Partial / Incorrect / Highlight) · Label, Icon | Never interactive |
| Class Tag | Hue (Clay / Ochre / Moss / Sky / Plum / Slate) · Label | Dot is the only colour |
| Grade Mark | Result (Correct / Partial / Incorrect / Skipped) | Glyph + colour, always |
| Progress Segment · Test Progress | 6 states · Mode (Taking / Review) | One segment per question |
| Score Summary · Result Row | — · State (Default / Hover), exposed Grade Mark | Results screen |
| Dropzone | State (Idle / Drag over / Scanning) | Resizable; corners pin, content centres |
| Detected Region | State (Detected / Selected / Excluded) · Label | Overlay on the scanned page |
| Sheet Row · Class Folder | State (Default / Hover / Selected) · Hue ×6 | Archive |
| Question Card | Type (Free response / Multiple choice) × Mode (Taking / Review) · Index, Topic | The heart of the tool |
| Solution Step · Worked Solution | Position (First / Middle / Last) | Steps on a node rail |
| Figure | Caption | Diagram well (graph paper) |
| Header · Nav Item | — · State (Default / Hover / Active) | 64px; active bar rests on the header rule |
| Menu · Menu Item | — · State (Default / Hover / Destructive) | Destructive last, after a divider |
| Tooltip · Toast · Kbd | Text, Shortcut · Message, Action · Key | Toast offers Undo instead of "are you sure?" |
| Rule · Node · Section Label · Scan Corner · Pattern/Graph | Orientation × Style · Cross / Dot | The line system |

---

## 8. Technical notes (proposals, not decisions)

- **Maths rendering:** KaTeX for prompts, answers and worked solutions.
- **Scanning:** a vision-capable model or OCR pipeline returns structured problems:
  - text
  - given values with units
  - which quantity is asked for
  - figure crops
  - **bounding boxes**, which drive the Detected Region overlays
  - a confidence score for each problem

  Low-confidence regions should be shown as Detected, not Selected.
- **Variant generation:** treat each problem as a template.
  - Keep the structure, change the given values within physically sensible ranges, and keep significant figures and units.
  - Record *which* values changed, so the UI can set them in ink.
  - **Compute answers deterministically** with a numeric solver or CAS rather than trusting generated text. The same computation yields the worked-solution steps.
- **Grading:**
  - Numeric answers: tolerance aware of significant figures (for example ±1% or ±½ of the last significant digit), with units checked separately.
  - Partial credit: separate *method*, *arithmetic* and *units*.
  - Paper path: read handwriting, map each answer to its question, then use the same grader.
  - Always show the student why a grade was given, and let them flag a grade they think is wrong.
- **Storage:** local-first. The archive lives in the browser (e.g. IndexedDB) and there is no account in v1. Add export/import (JSON, and PDF for sheets) so nothing is trapped.
  - Retention policy for uploaded images still needs a decision. The working assumption is "processed, then discarded unless archived".
- **Theming:** CSS variables from §6 with `data-theme` on `<html>`, and the choice kept in `localStorage`.
- **Fonts:** Geist and Geist Mono are SIL Open Font Licence, available via the `geist` npm package or Google Fonts.
- **Accessibility:**
  - Keep AA contrast and the visible focus ring.
  - Full keyboard support for the test: `Enter`, `H`, `F`, `S`.
  - Never rely on colour alone.
  - Respect `prefers-reduced-motion`; the scan line should become a static state.

---

## 9. Open questions / next steps

1. Real brand identity; the logo is a placeholder.
2. Mobile and camera-first capture flow.
3. Print layout for practice tests (the paper path depends on it).
4. Empty and error states (blurry scan, nothing found, grading unsure).
5. Should Light or Dark follow the system theme automatically, or stay a manual choice with Signature as the default?
6. Motion spec: scan line, card transitions, toast.
7. Accounts and sync, once the base tool has proven itself.

---

## 10. Decision log

| Date | Decision |
|---|---|
| 2026-09-26 | Design system v0.1 built. Themes Signature (default) / Light / Dark; Geist + Geist Mono; pill buttons; ballpoint-blue accent that never fills buttons. |
| 2026-09-26 | Construction-line motif adopted (after roydenso.com); kept at its current intensity (`line/rule` 10–12%). |
| 2026-09-26 | **Oat** chosen as the signature paper over Chalk & Ink, Sage & Pine and Legal pad. |
| 2026-09-26 | Placeholder logo: the incline mark + "vriant" wordmark. |
| 2026-09-26 | Desktop flow v1 laid out: Intake → Review scan → Practice → Hand in → Results → Archive. |
