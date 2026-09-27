# Vriant — Handoff

> **Status:** v0.3 · working prototype on `main` · last updated 27 Sep 2026 · describes the code at commit `cb837bf`
>
> **Keep this file current.** After every handoff, and every time a change set is pushed to `main`, update:
> 1. the Status line above (date and commit)
> 2. every section the change touches
> 3. the Decision log (§12), with one row per decision
>
> If code and Figma disagree, fix one of them or list the difference under Known gaps (§11). A stale handoff is worse than none.

**Who holds what:**
- **This file** holds intent, decisions and how things work.
- **The code** is the source of truth for behaviour and tokens: `src/styles/tokens.css`.
- **Figma** holds the visual system and the original screen designs.

---

## 1. What Vriant is

Vriant turns this week's homework into next week's practice.

A student scans a physics or maths worksheet. Vriant finds the problems and writes a short practice test made of **variants**: the same problems with new numbers. When the student hands the test back, typed or on paper, Vriant grades it and shows worked solutions. The sheet can then be filed under a class, or simply let go.

**The loop:** Scan → Practice → Grade → File.

**Who it's for:** secondary and early-university students working through physics and maths problem sets.

**What it is not.** This is the main thing that sets Vriant apart from Quizlet-style edtech:

- It's a tool you pick up, not a place you live. Nothing is kept unless you archive it.
- No decks, streaks, points, leaderboards, feeds or mascots. No confetti, and no shaming a low score.
- No accounts for now. Login is a maybe for later, once the base tool has proven itself.

---

## 2. Links & running it

| What | Where |
|---|---|
| Repo | [github.com/noahohstudio/Vriant-Web-Tool](https://github.com/noahohstudio/Vriant-Web-Tool). Commit straight to `main`; no branches or PRs (see §6). |
| Figma file | [Vriant Design System — Screens](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens) |
| Design system (14 boards) | [Design System page → “Vriant — Design System”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-2) |
| Desktop flow (6 screens) | [Screens page → “Vriant — Desktop flow v1”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1434) |
| References | Outcome logo builder (earlier project; structure only) · [roydenso.com/landing](https://roydenso.com/landing) (construction lines) |

```bash
npm install
npm run dev                # http://localhost:5173 — add `-- --host` to open it on a phone on the same Wi-Fi
npm run build              # type-check + production build
npm run check:generator    # stress-test the problem engine (see §4.6)
```

To start over, use **Settings (sliders icon) → Reset demo data**. It clears the archive and the session.

---

## 3. Where the prototype stands

A desktop-first, working prototype of the whole loop is built with Vite 8, React 19 and TypeScript 7. It has no UI libraries; KaTeX is loaded lazily.

| Real | Simulated (for now) |
|---|---|
| Variant generation from 5 kinematics templates, at 3 difficulty levels | **Scanning and problem detection.** Every upload loads the sample *Kinematics — Worksheet 4* (§4.3) |
| Answers computed from each template's formula | **Paper hand-in.** It grades the answers typed in the app |
| Grading: tolerance aware of significant figures, partial credit, feedback on common mistakes | PDF previews |
| Multiple-choice distractors built from those same mistakes | |
| KaTeX worked solutions; "Try a similar one"; "Practice these again" | |
| Archive with classes: create, rename, recolour, delete (sheets move to Unsorted, with Undo); move and delete sheets | |
| **Revisit archived work.** A filed test reopens on Results (answers, grades, feedback, worked solutions); its source sheet reopens in Review to make a new test | |
| Signature / Light / Dark themes, saved per device | |
| Keyboard: `Enter` next · `H` hint · `F` flag · `S` skip · `1–4` choose | |

**Storage:**
- **The archive:** stays on this device, in `localStorage` (`vriant:archive:v1`).
  - Each filed test stores a **snapshot** in `item.data`: `sheet`, `test`, `attempt`, `results`. Its source sheet stores `sheet`.
  - Entries without `data` (the demo examples) can't be reopened.
- **The working session** (sheet, setup, test, answers, results): lasts only for the tab, in `sessionStorage` (`vriant:session:v1`).
- **Theme:** `vriant:theme`.

---

## 4. Scanning & problem generation — how it works, and how to debug it

**This is the next area to debug.** Everything below describes the code as it is now.

### 4.1 Pipeline at a glance

```
Intake ─ file / camera / paste / "try the sample sheet"
  │  Dropzone.start(file)      1.8 s scan animation, then onFile(file)            src/components/dropzone.tsx
  ▼
loadSheet(upload)              SIMULATED: always sampleSheet() → 6 problems       src/lib/store.ts
  │                            (an image upload is only shown as a picture)
  ▼
Review ─ include / exclude problems, questions (1–12, or typed up to 30), difficulty, timer
  │  generate() → buildQuestions(problems, selected, count, difficulty, seed)     src/lib/problems.ts
  ▼
Question[] ─ each has templateId, values, dps (decimals shown), answer, kind, choices / correct
  │  Practice: answers kept in attempt.answers / attempt.choices
  ▼
handIn('typed' | 'paper') → grade(q, typed, chosen) for every question           src/lib/store.ts → problems.ts
  ▼
Results ─ score, feedback, workedSteps(q) (KaTeX); trySimilar() → buildFrom([problem]); practiceMissed()
  │  fileResults(classId)      stores a snapshot (sheet, test, attempt, results) in the archive
  ▼
Archive ─ openArchived(id)     filed test → Results (read-only review)  ·  source sheet → Review (new test)
```

### 4.2 Code map

| File | What lives there |
|---|---|
| `src/lib/problems.ts` | **The engine.** `TEMPLATES` (parameters, prompt, `answer`, `steps`, `mistakes`, `hint`), `sampleSheet()`, `makeValues()` (picks values), `buildQuestions()` / `buildFrom()`, `makeChoices()`, `grade()`, `tolerance()`, `parseNumber()`, `workedSteps()`, `fmtSig()` |
| `src/lib/store.ts` | Flow and state: `loadSheet()` (**the simulated scan**), `generate()`, `nextQuestion()`, `handIn()`, `trySimilar()`, `practiceMissed()`, `fileResults()` (snapshots), `openArchived()`, archive actions, persistence, navigation |
| `src/components/dropzone.tsx` | Intake UI: drag and drop, file picker, camera input, paste; the scan animation (`SCAN_MS = 1800`, caption phases) |
| `src/screens/intake.tsx` | Review screen: the rendered sample page with Detected Regions and the test-setup controls |
| `src/components/question.tsx` | Prompt rendering (changed values in ink), answer input, choices, graded answer, worked solution |
| `scripts/check-generator.mjs` | Stress test for the engine (§4.6) |

### 4.3 Scanning today (simulated)

- **Any file** (image, PDF or pasted image) plays the scan animation for 1.8 s. Then `loadSheet()` creates `sampleSheet(fileName, 'upload')` with the six built-in problems.
- The Review screen shows an uploaded image as-is, with a visible notice ("Prototype: problem detection is simulated…"). PDFs get a file card only.
- "Try the sample sheet" loads the same six problems, rendered as an HTML page with clickable Detected Regions.
- Problem 4 ("Sketch the v–t graph…") is hard-coded as unsupported, to show the Excluded state.
- There are **no failure states**: no blurry scan, no "nothing found", no wrong file type, no timeout.
- The paper hand-in runs the same animation, then calls `handIn('paper')`, which grades the **typed** answers.

**Making it real (proposed):**
1. **Keep secrets off the client.** Put a small server endpoint (or serverless function) in front of the vision model, so API keys never reach the browser. The static prototype can't do this by itself.
2. **Define the extraction contract first**, as JSON. One object per problem:
   - `n`
   - `text`
   - `quantities[]`: `{ symbol, value, unit, sigFigs, span }`
   - `asks`: the quantity wanted, with its unit
   - `bbox`: normalised 0–1, which drives the Detected Region overlay
   - `figure` crop, if any
   - `supported`, plus a `reason` when it isn't
   - `confidence`

   Show low-confidence problems as **Detected**, not Selected.
3. **Map extracted problems to templates.** Either match against the known `TEMPLATES`, or have the model propose a parametric template: parameter ranges plus a formula. **Always compute answers deterministically** with a safe expression evaluator (e.g. mathjs), never with the model.
4. **Validate before use.** A proposed template must reproduce the original problem's numbers, and its answer when one is printed. Reject it if not.
5. **Add the failure states** listed above (§5, Intake).

### 4.4 Problem generation

**Templates.** There are 5, all Kinematics. Values on the sample sheet and their expected answers (the check script prints these):

| Q | Template | Original values | Answer |
|---|---|---|---|
| 1 | `carAccel` | v 24 m/s, t 6.0 s | 4.00 m/s² |
| 2 | `droppedBall` | h 20 m | 2.02 s |
| 3 | `cyclist` | v 9.0 m/s, t 4.0 s | 18.0 m |
| 5 | `braking` | v 18 m/s, a 6.0 m/s² | 27.0 m |
| 6 | `twoTrains` | d 30 km, 80 & 100 km/h | 10.0 min |

**How variants are made** (`makeValues`):
- Each parameter has a range, a step and the decimals to display.
- **Difficulty** changes only the range and the step:
  - *Easier:* coarser steps, so rounder numbers.
  - *Same:* the template's own ranges.
  - *Harder:* a wider range (×0.6 to ×1.5) and half the step.
- Values are redrawn (up to 32 tries) until every parameter differs from the original and the template's optional `valid()` passes.
- Only `twoTrains` has a `valid()`: the two speeds must differ.

**Test assembly** (`buildQuestions`):
- **Template order:** questions cycle through the selected problems in sheet order (`pool[i % pool.length]`).
- **Question type:** every third question (`i % 3 === 1`) is multiple choice; the rest are typed.
- **Seed:** a random seed drives everything, and it's embedded in every question id as `q<seed in base 36>-<index>`, so any test can be rebuilt exactly (§4.6).
- "Try a similar one" and "Practice these again" use `buildFrom()`, which always produces typed questions.

**Answers and choices:**
- Answers display to 3 significant figures (`fmtSig`), whatever the precision of the inputs.
- Multiple choice uses the correct answer plus the template's `mistakes()` values, filled up with ×2, ÷2, ×1.5, ×0.75 or ×3. Any two options must be at least 4% apart, and the order is shuffled.

### 4.5 Grading (`grade`)

- **Correct:** within `max(1% of the answer, half a unit in the 3rd significant figure)`.
- **Common mistake:** a value within 2% of a template `mistakes()` value gets that mistake's feedback. The result is incorrect, or partial for mistakes flagged `partial`, such as hours instead of minutes.
- **Wrong power of ten** (×10ⁿ for n = −3…3): partial, "check your units".
- **Within 3%:** partial, "carry more digits".
- **Blank:** skipped, which is not the same as wrong. **Unreadable:** incorrect, with a hint to type just the value.
- **Points:** 4 correct, 2 partial, 0 otherwise. The score is points ÷ 4, shown out of the question count.
- **Parsing** reads the first number in the text: commas and spaces are stripped, and `×10^` becomes `e`. "4.91 m/s²" and "4.91e0" both work.

### 4.6 Debugging recipes

**Re-run the engine stress test.** It checks thousands of variants at every difficulty:

```bash
npm run check:generator              # SEEDS=1000 npm run check:generator for a bigger run
```

- **Exits 1** on a hard failure: a correct answer rejected, fewer than 4 choices, or a variant identical to the original.
- **The `ambiguous` column:** variants where a common mistake lands within 5% of the right answer.

**Poke at the engine from the browser console.** This works under `npm run dev` only:

```js
const p = await import('/src/lib/problems.ts');
const sheet = p.sampleSheet();
const qs = p.buildQuestions(sheet.problems, { 1: true, 2: true, 3: true, 5: true }, 10, 'same', 12345);
qs.map((q) => [q.templateId, q.values, p.fmtSig(q.answer), q.kind]);
p.grade(qs[0], '4.9', undefined);  // → { result, points, feedback }
p.workedSteps(qs[0]);              // → KaTeX strings + notes
```

**Rebuild the test you're looking at:**
1. In DevTools → Application → Session Storage, open `vriant:session:v1`.
2. Read `test.questions[0].id`, e.g. `q1x3k9-0`, and decode the seed: `parseInt('1x3k9', 36)`.
3. Call `buildQuestions` with the same selection, count, difficulty and seed.

**Useful state:**
- `vriant:session:v1` holds `sheet`, `setup`, `test`, `attempt` (answers, choices, flags), `results` and the grades.
- Settings → **Reset demo data** clears everything.

### 4.7 Known issues — scanning & generation (start here)

| # | Issue | Evidence | Where / suggested fix |
|---|---|---|---|
| 1 | **Ambiguous variants.** In `droppedBall`, the wrong method *h ÷ g* equals the right answer √(2h/g) at h ≈ 19.6 m. At h = 20 they're 1% apart (2.04 vs 2.02 s), so a wrong method can be marked correct, and the feedback can't tell them apart. A few *harder* `carAccel` variants do the same when v ≈ t. | `check:generator`: about 4–7% of `droppedBall` variants at every difficulty; about 1% of `carAccel` at *harder* | `makeValues`: reject values where any `mistakes()` value is within ~5% of the answer (a generic `valid()` check) |
| 2 | **Scanning is fake.** Uploads never affect the problems. | By design for now | §4.3 "Making it real" |
| 3 | **Harder mode shows odd precision**, such as "10.50 s" or "a = 10.00 m/s²". | `check:generator` `maxDecimals` = 2 | Keep the display decimals at the template's `dp`, or snap harder values to nicer steps |
| 4 | **The significant-figures policy is undecided.** Answers are always 3 s.f., even when the inputs have 2. | `fmtSig(answer)` | Decide: match the least precise input (textbook rule), or keep 3 s.f. and say so in the UI |
| 5 | **A decimal comma** ("4,91") is read as 491 and marked "wrong power of ten". | Parser test | `parseNumber`: treat a single comma followed by 1–2 digits as a decimal point, or follow the user's locale |
| 6 | **Expressions aren't evaluated.** "27/5.5" is read as 27. | Parser test | Evaluate simple arithmetic safely, or say that only a number is expected |
| 7 | **The question mix is predictable.** Templates cycle in sheet order, and multiple choice is always Q2, Q5, Q8… | `buildQuestions` | Shuffle with the seed; decide the typed vs multiple-choice ratio in Review |
| 8 | **Only 5 kinematics templates**, and every topic label is "Kinematics". | `TEMPLATES` | Grows with real scanning (§4.3 step 3) |
| 9 | **Wrong sign** gets only the generic feedback. | Parser test ("−4.91") | Add a sign check before the generic message |

---

## 5. Core flow (desktop)

Every screen shares one frame:
- **Header:** 64px, whose bottom edge is the **header rule**.
- **Rail:** 280px down the left, whose right edge is the **rail rule**.
- **Main area.**
- **Footer:** 40px, on the **footer rule**, carrying a mono status line.

Nodes (11px crosses) mark the joints. Review and Results add a **split rule** between two columns, which scroll independently.

| # | Screen | Job & current behaviour |
|---|---|---|
| 01 | [Intake](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1445) | Drop, choose, photograph or paste a sheet, or try the sample. The rail shows recent sheets and classes. **Scan animation:** a graphite scanner head passes down the page, the loader is in secondary ink, and captions cycle through broad phases. No counts, no blue glow. |
| 02 | [Review scan](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1505) | The rendered page with Detected Regions: click to include or exclude. **Setup:** problem checkboxes; **Questions** slider 1–12 (double-click the number, or press Enter on it, to type up to 30); **Difficulty** slider with 3 stops (Easier · Same · Harder) and a hint line; **Time myself** Off / On. "Generate practice test" takes about 0.6 s. |
| 03 | [Practice](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1565) | One question card at a time. A Variant tag names the source problem; changed values are in ink. The hint expands smoothly. Keyboard shortcuts work, and one press moves one step (250 ms guard). The rail lists every question; the aside shows answered, flagged, difficulty and "Hand in early". |
| 04 | [Hand in](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1622) | **Typed** (instant) or **paper** (scan the sheet — simulated). Blanks count as skipped. |
| 05 | [Results](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1678) | Score summary, the to-review list and per-question detail: the student's answer, the expected value, feedback and the worked solution. Buttons for "Try a similar one" and "Practice these again". **Keep it?** Pick a class from a custom dropdown and archive it. Once filed, or when reopened from the archive, this shows "Filed under [class]" with a "View in archive" button. |
| 06 | [Archive](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1734) | Search, filter (All / Graded / Not graded), class folders and sheet rows. **Class menu** ("…" on each folder, and on rail rows when hovered): Rename (inline), Colour, Delete class…. The folder grid ends with a "New class" tile. **Archived tests reopen:** click a filed test to review its results; click a source sheet to make a new test. The Intake rail's Recent list opens items directly. Sheet menu: Review results, New test from this sheet, Move to, Delete… (confirm). Opening an archived item over an unfinished test offers Undo, which returns you to that test. Toasts offer Undo. |

**States not designed or built yet:** a blurry or unreadable scan, "no problems found", an unsupported file, a slow or failed scan, low-confidence grading, offline, and very long prompts or figures. Mobile and camera-first capture isn't built either.

---

## 6. Prototyping direction — the rules we're building by

1. **Smooth or nothing.** No dropped frames. Everything that moves animates `transform` or `opacity`.
   - Two deliberate exceptions, both tiny and contained: the segmented thumb's `width`, and the hint's height (`grid-template-rows`, contained to the card).
   - Entrance animations use `animation-fill-mode: backwards`, so they don't hold layers or stacking contexts after they finish.
2. **Theme and screen changes use the View Transitions API.** It cross-fades snapshots on the compositor, not per-element colour transitions.
   - A theme flip costs about 1–5 ms of main-thread work.
   - The theme switch is excluded from the snapshot, so its thumb visibly glides.
   - Browsers without support switch instantly, and `prefers-reduced-motion` turns motion off.
3. **No stock browser controls.**
   - One **Segmented** control with a sliding thumb (theme switch, filters, Off / On).
   - A custom **Slider** (knob follows the pointer, then glides to the nearest stop).
   - A custom **Select** (popover with enter and exit animation).
   - No native `<select>`, no default switches, **no visible scroll bars** (areas still scroll).
4. **Labels never shift layout.** Controls keep fixed labels. Icon-only controls reveal their names as a tooltip after about 0.4 s.
5. **Menus and popovers animate in and out.** Anything holding an open menu is raised above its neighbours.
6. **Be honest about simulation.** Anything faked says so on screen, in a highlighted notice.
7. **Undo over "are you sure?".** Deleting still confirms, and deletions also offer Undo.
8. **Local-first.** No accounts. Heavy libraries load lazily (KaTeX is prefetched during practice).
9. **Workflow:**
   - Commit directly to `main`.
   - Run `npm run build` (and `npm run check:generator` when touching the engine) before pushing.
   - **Update this file after every push.**

---

## 7. Design direction

**Principles:**
1. **Friendly, not cute.** Round shapes, warm paper, plain words.
2. **Precise lines.** Rules follow real edges; nodes mark the joints.
3. **Temporary by design.** Use it, file the sheet, move on.
4. **One accent.** Ballpoint blue marks what you can act on or what's current.

**Colour & themes:**
- **Signature** (default): oat paper `#ECE5D8`, graphite ink `#1C1B19`, ballpoint blue `#3348D4`.
- **Light:** paper white. **Dark:** graphite paper with oat ink.
- **Accent never fills a button.** Scanning is monochrome; blue appears on drag-over, selection, focus and current.
- **Status colours are always paired with a glyph** (✓ ½ ✕).
- Contrast is AA for primary, secondary, accent, status and button text in all three themes. `text/tertiary` reaches UI-level contrast only.
- **Oat was chosen** over Chalk & Ink, Sage & Pine and Legal pad (Figma board 05).

**Type:** Geist for everything read or pressed, Geist Mono for annotations on rules. KaTeX renders the maths; STIX Two Italic is only its Figma stand-in. Sentence case everywhere. 13px is the floor for text a student reads, and prompts are at most 680px wide.

| Style | Spec | Use |
|---|---|---|
| Display/M · Heading/L · M · S | Geist SemiBold 48/52 · 32/38 · 24/30 · 18/24 | Titles |
| Body/L · M · S | Geist Regular 18/28 · 15/24 · 13/20 | **Prompts** · reading · meta |
| Label/M · S | Geist Medium 14/20 · 13/16 | Controls |
| Mono/Label · Mono/S | Geist Mono 11/16 uppercase +6% · 12/16 | Section indices · specs, units |
| Numeral/XL | Geist SemiBold 72/72, tabular | Scores |

**Lines (the signature move):**
- Rules follow real edges and run edge to edge.
- An 11px cross marks every joint.
- Section labels ride their rule.
- `line/rule` is 10–12% ink.
- Graph paper appears only inside stages (the dropzone, figure wells).
- Worked-solution steps sit on a rail of nodes.

**Shape & depth:**
- 4px base spacing.
- Radii: xs 4 · sm 8 · md 12 · lg 16 · xl 24 · full for pills.
- Tone steps and hairlines separate surfaces; shadows only for things that float.
- Focus is a 2px gap plus a 2px accent ring.

**Logo (placeholder):** a rounded right triangle, the "incline", plus a lowercase "vriant" wordmark.

**Voice:**
- Plain and kind.
- Buttons are verbs.
- Feedback explains the physics, not the failure.
- Blanks are "skipped", never "wrong".

---

## 8. Tokens

The source of truth is **`src/styles/tokens.css`**. It mirrors the Figma variables:
- Theme collection: Signature / Light / Dark
- Scale collection
- Motion tokens

Set the theme with `<html data-theme="signature | light | dark">`.

- **Semantic families:**
  - `--bg-*` (canvas, surface, sunken, raised, inverse, tint, tint-strong, scrim)
  - `--text-*` (primary, secondary, tertiary, inverse, on-accent)
  - `--line-*` (rule, divider, strong, node)
  - `--accent-*`, `--status-*`, `--button-primary-*`, `--tag-*` (six class hues), `--highlight-bg`
- **Motion:**
  - `--ease-out`, `--ease-in`, `--ease-in-out`
  - `--dur-fast` 120ms · `--dur-base` 200ms · `--dur-theme` 480ms
- **Layout:** `--size-header` 64 · `--size-rail` 280 · `--size-footer` 40.

When a token changes, update Figma and `tokens.css` together.

---

## 9. Components (in code)

| Component | Where | Notes |
|---|---|---|
| Button, IconButton | `components/ui.tsx` | Pills; one Primary per view; icon buttons carry tooltips |
| **Segmented** | `components/ui.tsx` | One measured, sliding thumb. Supports icon-only options, which show their name on hover. Used by the theme switch, the Archive filter and Time myself (Off / On) |
| **Slider** | `components/ui.tsx` | Drag, click on the track, keyboard (arrows, Page Up/Down, Home, End); optional labelled stops |
| **Select** | `components/ui.tsx` | Custom dropdown; opens up or down; animates in and out |
| Menu, MenuItem | `components/ui.tsx` | Popover with exit animation. Class menu: Rename, Colour, Delete; sheet menu: Move, Delete |
| Checkbox, Tag, ClassTag, Mark, Kbd, TeX | `components/ui.tsx` | TeX loads KaTeX on demand |
| SheetRow (archive) | `screens/archive.tsx` | Whole row opens the item when it has a snapshot; the hover hint says what will happen ("Review results" or "Make a new test") |
| Dropzone | `components/dropzone.tsx` | Idle, drag-over and scanning states. Props: `scanTitle`, `phases`, `allowSample` |
| QuestionCard, TestProgress, GradedAnswer, WorkedSolution | `components/question.tsx` | Hint uses the smooth reveal |
| Header, RailRow, ToastHost, Elapsed | `components/shell.tsx` | Toasts offer Undo |

**Removed:** the Figma Toggle (replaced by the Off / On Segmented) and the native select (replaced by Select and Slider).

---

## 10. Open questions / next steps

1. **Debug scanning and problem generation** (§4.7): start with ambiguous variants, then the significant-figures policy and the question mix.
2. **Make scanning real** (§4.3): server endpoint, extraction contract, template mapping, validation.
3. Design and build the missing states (§5).
4. Real brand identity; the logo is a placeholder.
5. Mobile and camera-first capture.
6. A print layout for practice tests (the paper path depends on it).
7. Should Light or Dark follow the system theme automatically?
8. Automated tests. `check:generator` is a start; unit tests for `grade()` and `parseNumber()` would come next.
9. Accounts and sync, once the base tool has proven itself.

## 11. Known gaps

**Figma is behind the code.** It still shows:
- the old Toggle and the native Select field
- the theme switch showing its active label
- stepped segments (5 / 10 / 15)
- the blue scan line with glow and the "Found N problems" count

It's missing:
- Slider, the sliding Segmented and the custom Select
- the class menu and the New class tile
- the new scanning animation
- the hint reveal

Update the Figma components to match.

**Other gaps:**
- **Accessibility:** hidden scroll bars reduce discoverability on long pages. Slider and Segmented have keyboard support, but no screen-reader audit has been done.
- **Snapshot compatibility:** archived snapshots store raw `Question` objects. If the `Question` or template shape changes, bump the storage key (`vriant:archive:v2`) and migrate, or old tests may fail to reopen.
- **Deleting a source sheet** leaves the tests made from it (each carries its own copy of the sheet).
- **Nothing is synced:** a filed test lives only in this browser.
- **The engine issues in §4.7.**

## 12. Decision log

| Date | Decision |
|---|---|
| 2026-09-26 | Design system v0.1 built. Themes Signature (default) / Light / Dark; Geist + Geist Mono; pill buttons; ballpoint-blue accent that never fills buttons. |
| 2026-09-26 | Construction-line motif adopted (after roydenso.com), kept at its current intensity (`line/rule` 10–12%). |
| 2026-09-26 | **Oat** chosen as the signature paper over Chalk & Ink, Sage & Pine and Legal pad. |
| 2026-09-26 | Placeholder logo: the incline mark + "vriant" wordmark. |
| 2026-09-26 | Desktop flow v1 laid out: Intake → Review scan → Practice → Hand in → Results → Archive. |
| 2026-09-27 | Working prototype added (Vite + React + TS). Variants, grading and worked solutions are real; scanning and paper hand-in are simulated. Theme and screen changes use View Transitions; motion is transform/opacity only. |
| 2026-09-27 | Workflow: commit directly to `main`; no branches or pull requests. |
| 2026-09-27 | Controls pass: segmented controls share one sliding thumb; the theme switch is icon-only with names on hover; the stock switch and selects are replaced by an Off / On segment, custom Sliders (difficulty 3 stops; questions 1–12, double-click to type up to 30) and a custom Select. |
| 2026-09-27 | Classes can be renamed, recoloured and deleted. Sheets fall back to Unsorted, with Undo; Unsorted is protected. |
| 2026-09-27 | Scanning made quieter: graphite scanner head on the page, secondary-ink loader, broad captions instead of counts, blue only on drag-over. |
| 2026-09-27 | Scroll bars hidden app-wide; areas still scroll. |
| 2026-09-27 | This handoff restructured around the next focus (scanning and generation); `npm run check:generator` added; the "update after every push" rule added. |
| 2026-09-27 | Archived tests can be revisited: filing stores a snapshot; tests reopen on Results and source sheets reopen in Review. Replacing an unfinished test offers Undo. |
