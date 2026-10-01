# Vriant — Handoff

> **Status:** v0.4 · working prototype on `main` · last updated 28 Sep 2026 · describes the code at commit `99511ce`
>
> **Keep this file current.** After every handoff, and every time a change set is pushed to `main`, update:
> 1. the Status line above (date and commit)
> 2. every section the change touches
> 3. the Decision log (§12), with one row per decision
>
> If code and Figma disagree, fix one of them or list the difference under Known gaps (§11). A stale handoff is worse than none.

**Who holds what:**
- **This file:** intent, decisions, how things work, and where we're going.
- **The code:** the source of truth for behavior, tokens (`src/styles/tokens.css`) and the problem bank (`src/bank/`).
- **`docs/curriculum.md`:** the research behind the bank: which courses and concepts we cover, why, and how common each one is.
- **Figma:** the visual system and the original screen designs.

---

## 1. What Vriant is

Vriant turns this week's homework into next week's practice.

1. A student drops in a worksheet, or simply picks the topics they're studying.
2. Vriant works out which **concepts** those are.
3. It builds a short practice test from a curated **bank of problems** on those concepts, at the difficulty they choose.
4. When they hand the test in, typed, Vriant grades it and shows worked solutions.
5. The test can be filed under a class, or let go.

**The loop:** Sheet or topics → Concepts → Practice → Grade → File.

**Who it's for:**
- First, **Cooper Union students**: the engineering core, and the architecture structures sequence.
- Then American college physics and maths more broadly, weighted toward the most common courses and concepts.

**How it's built to run:** it **costs nothing to run**.
- No AI and no server: every problem is a hand-written template in the bank, and every answer is computed from a formula.
- The site is static and meant for Vercel.

**What it is not.** This is the main thing that sets Vriant apart from Quizlet-style edtech:
- It's a tool you pick up, not a place you live. Nothing is kept unless you archive it.
- No decks, streaks, points, leaderboards, feeds or mascots. No confetti, and no shaming a low score.
- No accounts for now. Login is a maybe for later, once the base tool has proven itself.
- It never pretends to cover a topic it doesn't. Gaps are stated plainly.

---

## 2. Links & running it

| What | Where |
|---|---|
| Repo | [github.com/noahohstudio/Vriant-Web-Tool](https://github.com/noahohstudio/Vriant-Web-Tool). Commit straight to `main`; no branches or PRs (§6). |
| Live site | [noahohstudio.github.io/Vriant-Web-Tool](https://noahohstudio.github.io/Vriant-Web-Tool/). GitHub Actions builds and publishes it on every push to `main` (`.github/workflows/deploy.yml`). Pages' source must stay **GitHub Actions**: serving the branch directly publishes unbuilt source, which can't run. |
| Curriculum research | [`docs/curriculum.md`](docs/curriculum.md) |
| Figma file | [Vriant Design System — Screens](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens) |
| Design system (14 boards) | [Design System page → “Vriant — Design System”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=5-2) |
| Desktop flow (6 screens) | [Screens page → “Vriant — Desktop flow v1”](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1434) |
| References | Outcome logo builder (earlier project; structure only) · [roydenso.com/landing](https://roydenso.com/landing) (construction lines) |

```bash
npm install
npm run dev                # http://localhost:5173 — add `-- --host` to open it on a phone on the same Wi-Fi
npm run build              # type-check + production build (run before every push)
npm run check:generator    # stress-test every template in the bank (§4.7)
npm run check:detect       # sheet detection against sample problems and sheets (§4.9)
npm run sample:bank        # print sample questions from one course (COURSE=phys1), to read them as a student would
```

To start over, use **Settings (sliders icon) → Reset demo data**. It clears the archive and the session.

---

## 3. Where the prototype stands

A desktop-first prototype of the whole loop, built with Vite 8, React 19 and TypeScript 7. It has no UI libraries; KaTeX loads lazily.

| Real | Simulated or not built yet |
|---|---|
| **Problem bank:** Physics I (Ph 112): 108 original templates across all 48 concepts (39 warm-up · 45 standard · 24 challenge) | **Handwritten sheets.** Text recognition reads typed or printed text; handwriting mostly fails |
| **Concept map:** 11 courses and 210 concepts, including those without problems yet | **Every other course's problems**: Calculus I is next (§10, Phase A) |
| **Topics screen:** search in your own words or browse by course, then pick topics and practice without a sheet | **Figures and diagrams** on a sheet are ignored; only text is read |
| **Honest coverage:** "Not in Vriant yet" with the closest ready topics, wherever a topic has no problems | **Paper hand-in.** It grades the answers typed in the app |
| Tests draw problems by concept at a difficulty tier; variants get fresh numbers and computed answers | **Multi-part and symbolic answers** (a vector, f′(x)): one number or one option per question |
| Grading: tolerance, common-mistake feedback, wrong sign, wrong power of ten; reads arithmetic like 27/5.5, π/4, 3×10⁸ | **Detection accuracy** on unfamiliar wording: about 85% of problems land in the right unit, 70% on the exact concept (§4.9) |
| KaTeX worked solutions and inline maths in prompts; "Try a similar one"; "Practice these again" | Mobile layout, camera-first capture, print layout |
| Archive with classes; filed tests reopen on Results, and their course file loads on demand | |
| Loading screen (once per session); Signature / Light / Dark themes; keyboard shortcuts | |
| **Reading real sheets, on the device:** PDF text (pdf.js), photos and scanned PDFs (Tesseract OCR), pasted or plain text → numbered problems → concepts, with a sure/guess/unknown confidence | |
| **Review for scans:** what we read beside the original page, each problem's topic changeable (likely topics + search), sketches and proofs flagged, failures that lead to Topics | |

**Storage** (all on the device):
- **The archive:** in `localStorage` (`vriant:archive:v1`).
  - Each filed test stores a **snapshot** in `item.data`: `sheet`, `test`, `attempt`, `results`. Its source sheet stores `sheet`.
  - Entries without `data` (the demo examples) can't be reopened.
- **The working session:** lasts only for the tab, in `sessionStorage` (`vriant:session:v1`). It holds the sheet, setup, test, answers, results and picked topics.
- **Other flags:** the theme is `vriant:theme`. The loading screen's seen-this-session flag is `vriant:splash`.

---

## 4. How it works: the bank, the engine, the checks

### 4.1 Pipeline

```
Intake ─ drop / choose / paste a sheet  or  "Pick topics instead"                          src/components/dropzone.tsx
  │  scanFile(): readSheetFile() → page texts + page pictures (PDF text · OCR · text)       src/lib/read.ts (lazy)
  │              detectSheet() → problems → concepts (keywords + similarity to the bank)   src/lib/detect.ts (lazy)
  │                                                        │
  │                                          Topics ─ search / browse / pick concepts        src/screens/topics.tsx
  ▼                                                        ▼
Sheet { problems: [{ n, concept, supported, text, … }] }  ← practiceTopics() builds one from picks   src/lib/store.ts
  ▼
Review ─ include/exclude, question count, tier (Warm-up · Standard · Challenge), timer
  │  generate(): slots (one per selected problem's concept)
  │  → ensureFor(courses)        loads each course's bank file on demand                      src/lib/bank.ts
  │  → buildQuestions(slots, count, difficulty, seed)                                          src/lib/problems.ts
  ▼
Practice ─ Question: { templateId, values, dps, kind, answer, choices? }
  ▼
handIn() → grade() per question → Results (feedback, worked steps) → fileResults() snapshot → Archive
  ▲                                                                                            │
  └──────────────── openArchived(): loads the course file, then reopens Results or Review ─────┘
```

### 4.2 Code map

| File | What lives there |
|---|---|
| `src/bank/taxonomy.ts` | **The concept map.** Courses → units → concepts, with stable ids, level (core, common, occasional), a Cooper flag and detection keywords. Ships with the app. |
| `src/bank/courses/<course id>.ts` | **One course's templates**, e.g. `courses/phys1.ts`, loaded lazily. The file name is the course id, and adding a file adds the course. Each file default-exports `Template[]`. |
| `src/bank/kit.ts` | Authoring helpers: `tpl()`, compact params, prompt parsing; TeX helpers (`texPoly`, `texSum`, `tn`, `u`); numeric, statistics and matrix helpers; physical constants |
| `src/lib/bank.ts` | Registry: finds `src/bank/courses/*.ts` itself; `ensureFor()`, `getTemplate()`, `templatesFor()`, legacy id aliases |
| `src/lib/problems.ts` | Engine: formatting, `promptParts()`, value generation, `buildQuestions()`, `buildFrom()`, `makeChoices()`, `grade()`, `parseNumber()`, `workedSteps()`, `sampleSheet()` |
| `src/lib/topics.ts` | Coverage and search: `isReady()`, `searchConcepts()`, `suggestionsFor()`, `suggestionsForQuery()` |
| `src/lib/store.ts` | Flow and state: `scanFile()` (real reading), `setProblemConcept()`, `loadSheet()` (the sample sheet), `practiceTopics()`, `generate()`, `handIn()`, `fileResults()`, `openArchived()`, `ready()` (startup) |
| `src/lib/read.ts` | Reading files in the browser: PDF text layer and page pictures (`pdfjs-dist`), OCR (`tesseract.js`), plain text; readable errors. Loaded on upload |
| `src/lib/detect.ts` | Splitting text into problems and matching each to a concept (§4.9). Pure, so `check:detect` can test it |
| `src/screens/topics.tsx` | Topics screen, course cards, concept rows, the shared `NotYet` panel |
| `scripts/check-generator.mjs` · `scripts/sample-bank.mjs` | The bank's stress test (§4.7) · sample questions printed for review |
| `docs/authoring.md` | **The full guide to writing templates**, detection fixtures and keywords |

### 4.3 The concept map and coverage

- **Ids:** a concept id is `course.unit.concept`, e.g. `phys1.kin1d.freeFall`. A template id is `course.name`, e.g. `phys1.carAccel`. The prefix tells the registry which file to load.
- **Ready means the course file exists.** A concept is *ready* when its course has a file in `src/bank/courses/`. `check:generator` fails if any concept in a registered course has no templates, so "ready" never lies.
- **Not-ready concepts are still known.** They appear in search and browse marked **Not yet**, and a sheet or pick that includes one keeps it, marked.
- **The `NotYet` panel** names the concept and the course it's planned for, then offers the closest ready concepts: same unit, then same course, then shared keywords, then same subject.
- **Order:** see §10 and `docs/curriculum.md`. Cooper's core first, then national popularity.

### 4.4 Writing templates (content rules)

The full guide, with examples of every kind of template, is **[`docs/authoring.md`](docs/authoring.md)**. In short:


**Every problem is original.**
- Syllabi and textbooks decide *what* to cover and *how hard*, never the wording.
- OpenStax material is CC BY-NC-SA; we only used its tables of contents.

Answers are computed from a formula, never written by hand. Every template carries at least one hand-checked `ref` case.

```ts
tpl({
  id: 'phys1.carAccel', concept: 'phys1.kin1d.constAccel', tier: 1, title: 'Car from rest',
  params: { v: [12, 36, 1, 'm/s'], t: [3, 9, 0.5, 's'] },        // [min, max, step, unit, { dp, int, fixed, nz }]
  prompt: 'A car speeds up from 0 to {v} in {t}. Find its acceleration.',   // {k} = value + unit; $…$ = TeX with \p{k}
  answer: (v) => v.v / v.t, unit: 'm/s²',                       // `exact: true` for maths: 1/3, 8π/3, 12 shown exactly
  steps: (f, ans, v) => [{ tex: 'a = \\dfrac{\\Delta v}{\\Delta t}', note: '…' }, …],
  mistakes: (v) => [{ value: v.v * v.t, why: 'You multiplied…' }, …],   // feed distractors and feedback
  valid: (v) => …,                                              // optional constraint on values
  hint: 'Acceleration = change in velocity ÷ time taken.',
  ref: [{ v: { v: 24, t: 6 }, a: 4 }],                          // hand-checked; the check fails if the formula disagrees
});
```

- **Tiers:**
  - 1 · Warm-up: one idea, direct formula
  - 2 · Standard: typical homework, a step or two
  - 3 · Challenge: several steps, or calculus
- **How many:** about 3 templates per core concept over time, at least 1 per concept before a course is registered.
- **House style:**
  - American spelling and conventions; SI units; g = 9.81 m/s².
  - Plain, kind wording. Mistake feedback explains the physics, not the failure.
  - Keep numbers tidy: parameters positive, with signs written into the prompt.
  - Never a coefficient of 1 in maths prompts ("1t³"): start integer ranges at 2.
- **Other kinds of template:**
  - `derive`: extra values worked out from the drawn ones, including ready-made TeX, e.g. a polynomial with its signs right (`texPoly`).
  - `pick`: worded "which one?" questions (converges or diverges, Lenz direction), always multiple choice, with feedback on each wrong option.
  - `tol`: a wider tolerance for table-based answers (statistics).
- **Adding a course:**
  1. Create `src/bank/courses/<course id>.ts` covering **every** concept of that course. A partial file would mark the whole course ready.
  2. Run `COURSE=<id> npm run check:generator` and `COURSE=<id> npm run sample:bank`.
  3. The course becomes "ready" in the app automatically.

### 4.5 Generation

- **Slots:** each selected problem contributes its concept. Rounds visit every slot once, in a fresh shuffled order.
- **Template choice:** the tier matching the difficulty is weighted 4. The next tier gets 1.5 and the far tier 0.5. The same template never appears twice in a row for a concept.
- **Values** (`makeValues`):
  - Each parameter is drawn from its range and step.
  - *Warm-up* uses coarser steps. *Challenge* widens ranges (×0.6–×1.5) and halves the step.
  - Draws are redone (up to 60 times) until they pass `valid()`, avoid zero where flagged, differ from the sheet's own numbers, and **no common mistake lands within 5% of the answer**. The last rule keeps every variant gradable.
- **Display:**
  - Physics answers show 3 significant figures.
  - Maths answers (`exact`) show exactly: whole numbers, short decimals, fractions, and multiples of π or √n (`8π/3`, with "≈ 8.378" beside it in Results).
  - Multiple-choice options share one format, so an exact right answer never stands out among decimals.
  - Very large or small values switch to scientific notation (1.67 × 10⁻⁷).
- **Multiple choice:**
  - About one question in three, at random positions.
  - The options are the answer, the template's mistakes, then scalings, kept at least 4% apart.
- **Seeds:** the seed is embedded in every question id (`q<seed36>-<i>`), so any test can be rebuilt exactly.

### 4.6 Grading (`grade`)

- **Correct:**
  - Physics: within `max(1% of the answer, half a unit in the 3rd significant figure)`.
  - Maths (`exact`): whole-number answers must be exact; others to 3 significant figures (so `8pi/3`, `2.667` and `√3/2` all work).
  - A template's `tol` widens either (statistics tables).
- **Worded questions** (`pick`): the chosen option is right or wrong; each wrong option has its own feedback.
- **Otherwise, checked in this order:**
  1. **Common mistake** (within 2%): that mistake's feedback, marked incorrect or partial.
  2. **Wrong sign:** incorrect, "Right size, wrong sign."
  3. **Wrong power of ten:** partial.
  4. **Within 3%:** partial, "carry more digits" (not for whole-number maths answers).
- **Reading answers:** simple arithmetic (`27/5.5`, `π/4`, `2√3`, `3×10^8`), superscripts (`10⁻⁷`) and a decimal comma (`4,91`) all work. Anything after the value, like a unit, is ignored. Nothing is passed to `eval`.
- **Blank:** skipped, not wrong.
- **Points:** 4 correct, 2 partial. The score is points ÷ 4, out of the question count.

### 4.7 Checks & debugging

`npm run check:generator` loads every course file through Vite and fails (exit 1) on:
- a formula (or worded `pick`) that misses its `ref`
- a non-finite answer
- a correct answer typed as displayed but marked wrong
- multiple choice without 4 distinct options, or worded questions without 2–4 distinct options
- unfilled or broken TeX in prompts, options or steps
- a concept with no templates, an unknown concept, a duplicate id, or a course file named for no course

It also reports ambiguous variants. Use `SEEDS=400` for a longer run, or `COURSE=phys1` for one course. `COURSE=phys1 npm run sample:bank` prints sample prompts, answers, options and steps (`ID=`, `DIFF=harder`, `N=` narrow it).

**Console debugging** (`npm run dev`):
- Import modules by the URL the app actually uses. After a hot reload that URL carries a `?t=` query; otherwise you get a second, separate copy.
  ```js
  const url = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.includes('/src/lib/store.ts')).pop();
  const store = await import(url);   // store.getState(), store.go(), store.generate() …
  ```
- **Screen changes are asynchronous.** They run inside a View Transition, so poll `getState()` rather than reading it immediately.

### 4.8 Known issues — engine and content

| # | Issue | Suggested fix |
|---|---|---|
| 1 | **The significant-figures policy is undecided.** Physics answers always show 3 s.f. | Decide: match the least precise input, or keep 3 s.f. and say so in the UI |
| 2 | **One answer per question.** Vectors, matrices and multi-part answers can't be typed, so templates ask for one component, a magnitude or a determinant | A multi-field answer box, if students miss it |
| 3 | **No symbolic answers.** "Find f′(x)" can't be graded, so templates ask for a value, such as f′(2) | Keep numeric; revisit only with a small expression checker |
| 4 | **Detection misses unfamiliar wording** (see §4.9) | More keywords from real sheets; the per-problem topic picker covers the rest |

### 4.9 Reading sheets (`src/lib/read.ts`, `src/lib/detect.ts`)

Everything happens on the student's device; nothing is uploaded.

1. **Reading** (`readSheetFile`):
   - **PDFs:** the text layer via `pdfjs-dist`, rebuilt into lines (raised small digits become superscripts, big gaps become blank lines). Each page is also rendered to a picture for the Review screen. Up to 20 pages, 40 MB.
   - **Scanned PDFs** (almost no text) and **photos:** Tesseract OCR (`tesseract.js`). Its engine and English model come from the jsDelivr CDN the first time (a few MB, then cached by the browser). The picture itself never leaves the device.
   - **Text:** pasted text (⌘V on Intake) or a `.txt` file.
   - **Errors** say what to do: unsupported type, password-protected PDF, OCR couldn't load, no problems found. Each offers "Try another file" and "Pick topics instead".
2. **Splitting** (`splitProblems`):
   - Problems start at `1.` `2)` `(3)` `Problem 4` `Q5` at the start of a line, and numbers must run in order (small gaps allowed), so "2. Use g = 9.8" mid-problem can't split one.
   - Parts `(a)`, `(b)` stay inside their problem; hyphenated line breaks join back up.
   - The header lines give the title. With no numbering, each paragraph that asks something becomes a problem.
3. **Matching** (`matchProblem`), per problem:
   - **Keywords** from the concept map. Phrases count most, and keywords in the question sentence count extra. Words used everywhere (velocity, force, area…) count less.
   - **Similarity** (TF-IDF cosine) to the bank's own templates for each concept, so wordings nobody listed still match. Concepts with no templates yet count less here.
   - **The sheet as a whole:** the course its header names ("Ph 112", "Calculus II") and the course most of its problems match get a boost.
   - **Confidence:** *sure* (ticked, shown plainly), *guess* ("Check", not ticked), or *unknown* ("Topic not recognized"). Every problem keeps its top candidates for the topic picker.
   - Sketches and proofs are left out, with "Practice its topic anyway".
4. **Checking** (`npm run check:detect`):
   - Sample problems and multi-problem sheets per course in `scripts/fixtures/detect/<course>.json`.
   - Fails below 90% right-unit.
   - Physics I: 98% unit on its fixtures. On a fresh batch written without tuning, 17/20 unit and 14/20 concept; sure matches are right 100/101 times.
   - Real sheets for testing go in `scripts/fixtures/private/` (git-ignored).

---

## 5. Core flow (desktop)

Every screen shares one frame:
- **Header:** 64px, whose bottom edge is the **header rule**.
- **Rail:** 280px down the left, whose right edge is the **rail rule**.
- **Main area.**
- **Footer:** 40px, on the **footer rule**, carrying a mono status line.

Nodes (11px crosses) mark the joints. Review and Results add a **split rule** between two independently scrolling columns. A **loading screen** appears once per session.

| # | Screen | Job & current behavior |
|---|---|---|
| 01 | [Intake](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1445) | Drop, choose, photograph or paste a sheet (a file or text), try the sample, or **Pick topics instead**. The rail shows recent sheets and classes. **Scan animation:** a graphite scanner head; captions follow the real stages ("Reading page 2 of 3", "Recognizing the text"); the loader sweeps until reading finishes. **Failed:** why, plus Try another file / Pick topics instead. |
| 01b | Topics *(not in Figma yet)* | "What are you studying?" Search in your own words, or browse course cards and tick concepts. Concepts without problems are marked **Not yet**; **Similar** opens the `NotYet` panel with the closest ready topics. The rail lists picks, "Make a practice test", and coverage per course. |
| 02 | [Review](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1505) | **From a scan:** "What we read" (the problems as text, with Detected Regions labelled by topic) or the **Original** page; a note says how it was read. The setup list names each problem's topic, marks guesses **Check**, and has a **Change**/**Choose** picker (likely topics, then search). Topics not in Vriant yet offer close ready ones. **From topics:** a topic list, where a not-yet topic can be swapped for a suggestion. **Setup:** Questions slider 1–12 (type up to 30), **Difficulty** Warm-up · Standard · Challenge, Time myself. |
| 03 | [Practice](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1565) | One card at a time, headed by the unit label (e.g. KINEMATICS). **Variant** tag when it's the sheet's own problem with new numbers; **Practice** when it's another problem on the same concept. Maths renders inline. Keyboard shortcuts; smooth hint. |
| 04 | [Hand in](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1622) | **Typed** (instant) or **paper** (simulated). Blanks count as skipped. |
| 05 | [Results](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1678) | Score, to-review list, per-question detail: answer, expected value, feedback, worked solution. "Try a similar one" and "Practice these again". **Keep it?** files the test to a class. |
| 06 | [Archive](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens?node-id=46-1734) | Search, filter, class folders, sheet rows. The status sits flush right; on hover it gives way to what a click does. Filed tests reopen (their course file loads first); source sheets reopen in Review. |

**States not built yet:** offline, very long prompts or figures. Mobile and camera-first capture.

---

## 6. Prototyping direction — the rules we're building by

1. **Smooth or nothing.** No dropped frames. Everything that moves animates `transform` or `opacity`.
   - Two deliberate exceptions, both tiny and contained: the segmented thumb's `width`, and the hint's height (`grid-template-rows`, contained to the card).
   - Entrance animations use `animation-fill-mode: backwards`, so they don't hold layers after they finish.
2. **Theme and screen changes use the View Transitions API.**
   - They cross-fade compositor snapshots, not per-element colours, so a theme flip costs 1–5 ms of main-thread work.
   - The theme switch is excluded from the snapshot, so its thumb visibly glides.
   - Browsers without support switch instantly, and `prefers-reduced-motion` turns motion off.
   - Going where you already are does nothing: the current tab is inert, and `go()` skips a same-screen call with nothing to change.
3. **No stock browser controls.**
   - One **Segmented** control with a sliding thumb.
   - A custom **Slider** and a custom **Select**.
   - No native `<select>`, no default switches, **no visible scroll bars**. Areas still scroll, but only vertically: the rail and split columns clip sideways overflow, so nothing can slide out of bounds.
4. **Labels never shift layout.** Controls keep fixed labels. Icon-only controls reveal their names as a tooltip after about 0.4 s.
5. **Menus and popovers animate in and out.** Anything holding an open menu is raised above its neighbours.
6. **Be honest.**
   - Anything simulated says so on screen.
   - Anything not covered says **Not in Vriant yet**, with a way forward.
7. **Undo over "are you sure?".** Deleting still confirms, and deletions also offer Undo.
8. **Zero running cost, local-first.**
   - No AI, no server, no accounts.
   - Heavy things load only when needed: each course's problems, KaTeX, and later the PDF reader and OCR.
   - **Size budget:** first load ≤ ~120 KB of compressed JS (today ~104 KB). Each course file ≤ ~60 KB (Physics I is 27 KB).
9. **Content is original and checked.** See the content rules in §4.4.
10. **Workflow:**
    - Commit directly to `main`.
    - Run `npm run build` and `npm run check:generator` before pushing. **Every push to `main` deploys the live site**; check that its Actions run passed.
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
- **Accent never fills a button.** Scanning is monochrome; blue appears on drag-over, selection, focus, current, and changed values in a prompt.
- **Status colours are always paired with a glyph** (✓ ½ ✕).
- Contrast is AA for primary, secondary, accent, status and button text in all three themes. `text/tertiary` reaches UI-level contrast only.
- **Oat was chosen** over Chalk & Ink, Sage & Pine and Legal pad (Figma board 05).

**Type:** Geist for everything read or pressed, Geist Mono for annotations on rules. KaTeX renders the maths (inline in prompts at 1.08em). STIX Two Italic is only its Figma stand-in. Sentence case everywhere. 13px is the floor for text a student reads, and prompts are at most 680px wide.

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
- The loading screen is a construction line with a node at each end.

**Shape & depth:**
- 4px base spacing.
- Radii: xs 4 · sm 8 · md 12 · lg 16 · xl 24 · full for pills.
- Tone steps and hairlines separate surfaces; shadows only for things that float.
- Focus is a 2px gap plus a 2px accent ring.
- **Dashed outlines mean "not here yet":** the New class tile, the Not-yet panel, courses without problems.

**Logo (placeholder):** a rounded right triangle, the "incline", plus a lowercase "vriant" wordmark. **Tagline:** "Homework in, practice out."

**Voice:**
- Plain and kind.
- Buttons are verbs.
- Feedback explains the physics, not the failure.
- Blanks are "skipped", never "wrong".
- Gaps are "not in Vriant yet", never hidden.

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
- **The loading screen** in `index.html` repeats the colours inline, because it paints before any stylesheet loads. Keep them in step with `tokens.css`.

When a token changes, update Figma and `tokens.css` together.

---

## 9. Components (in code)

| Component | Where | Notes |
|---|---|---|
| Button, IconButton | `components/ui.tsx` | Pills; one Primary per view; icon buttons carry tooltips |
| **Segmented** | `components/ui.tsx` | One measured, sliding thumb; icon-only options show their name on hover |
| **Slider** | `components/ui.tsx` | Drag, click, keyboard; optional labelled stops. The knob's box is knob-sized and moves by transform, so it never overhangs the track |
| **Select**, Menu, MenuItem | `components/ui.tsx` | Popovers that animate in and out |
| Checkbox, Tag, ClassTag, Mark, Kbd, **TeX** | `components/ui.tsx` | TeX loads KaTeX on demand; only `\htmlClass` is trusted, for highlighting changed values |
| **Prompt**, QuestionCard, TestProgress, GradedAnswer, WorkedSolution | `components/question.tsx` | Prompts mix text, values (accent when changed) and inline TeX; the card shows the unit label and a Variant or Practice tag |
| **Topics screen**, CourseGrid, ConceptRow, **NotYet** | `screens/topics.tsx` | NotYet is shared with Review |
| SheetRow (archive) | `screens/archive.tsx` | The status sits flush right; on hover or focus it gives way to a hint of what a click does |
| Dropzone | `components/dropzone.tsx` | Idle, drag-over and scanning states |
| Header, RailRow, ToastHost, Elapsed | `components/shell.tsx` | The current tab is inert; toasts offer Undo |
| Loading screen | `index.html` + `src/main.tsx` | Inline markup and CSS; shows until the saved session's course file and Geist are ready; at least ~1 s on the first visit of a session |

---

## 10. Roadmap — where we're going

### Phase A — Fill the bank (next)

| Wave | Course | Status |
|---|---|---|
| 1 | Physics I: Mechanics (Ph 112) | **Done** — 108 templates, 48 concepts |
| 1 | Calculus I (Ma 111) | **Next** — ~60 templates planned across 32 concepts (limits, derivatives incl. hyperbolic, applications, integrals) |
| 1 | Calculus II (Ma 113) | Planned — techniques, applications (volumes, work, centroids), parametric/polar, partial derivatives, series |
| 1 | Intro Linear Algebra (Ma 110) | Planned — vectors, lines & planes, matrices & systems, complex numbers |
| 2 | Physics II: E&M (Ph 213) | Planned — waves & sound, fields, potential, capacitance, circuits, magnetism, induction, AC, EM waves |
| 2 | Probability & Statistics (Ma 224.1) | Planned — the largest intro course nationally |
| 2 | Differential Equations (Ma 240) | Planned — first/second order, systems, Laplace, Fourier |
| 2 | Vector Calculus (Ma 223 / Ma 225) | Planned |
| 3 | Physics III: Optics & Modern (Ph 214) | Planned |
| 3 | Statics & Strength of Materials (ME 103, ESC 201; Arch Structures) | Planned — shared by engineers and architects |
| 3 | Precalculus & College Algebra | Planned — the national gateway courses |

**Beyond the concept map:**
- Cooper's later maths: Linear Algebra (Ma 326), Discrete Mathematics (Ma 352).
- Engineering sciences (thermodynamics, fluids, circuits).
- Algebra-based physics variants.

**Engine work for the content:** done in `437d395`: derived values in prompts, exact maths answers (fractions, π, roots), worded questions, and per-template tolerance. What's left is depth: about 3 templates per core concept.

### Phase B — Read real sheets, for free, in the browser

**Done** (§4.9): PDF text, OCR for photos and scanned PDFs, pasted text, splitting, matching with confidence, the Review states, failure states, and `check:detect`.

**Next:**
- **Real sheets:** collect real Cooper sheets in `scripts/fixtures/private/`, and tune keywords from their misses.
- **Handwriting:** Tesseract handles print, not handwriting. Say so plainly on photo uploads; revisit if free handwriting models appear.
- **Figures:** a problem that depends on a diagram ("from the graph shown") could be flagged "needs its figure".
- **Photos:** keeping the OCR files on our own site instead of jsDelivr (about 10 MB of static files) would make photo reading independent of a third-party CDN.

### Phase C — Product polish and reach

- **Hosting:** live on **GitHub Pages** (free), built by GitHub Actions. Vercel stays an option if Vriant needs a custom domain setup or preview deploys; its free Hobby plan is non-commercial. Keep the size budgets.
- **More devices:** a mobile layout and camera-first capture.
- **Paper:**
  - A **print layout** for practice tests, needed for the paper path.
  - **Paper hand-in:** reading handwriting isn't feasible for free. Offer typing the answers from paper instead, or revisit later.
- **Figma catch-up:** the loading screen, the Topics screen and Not-yet panel, the tier labels, the Practice tag, plus the component gaps in §11.
- **Accessibility:** a screen-reader pass on Slider, Segmented and the Topics screen.
- **Testing:** unit tests for `grade()`, `parseNumber()` and topic search, alongside `check:generator`.
- **Decisions to make:** the significant-figures policy (§4.8 #1), and whether Light or Dark should follow the system theme.

### Phase D — Later, maybe

- **Shareable tests with no server:** a test is fully defined by its seed and template ids, so it fits in a URL.
- **Spaced review from the archive:** "the concepts you missed last week".
- **Contributions:** the template format is documented (§4.4), so TAs or students could contribute problems through pull requests, checked by the stress test.
- **Accounts and sync:** only once the base tool has proven itself.

---

## 11. Known gaps

**Figma is behind the code.**
- It still shows:
  - the old Toggle and the native Select field
  - the theme switch showing its active label
  - stepped segments (5 / 10 / 15)
  - the blue scan line with glow and the "Found N problems" count
  - difficulty as Easier · Same · Harder
- It's missing:
  - Slider, the sliding Segmented and the custom Select
  - the class menu and the New class tile
  - the new scanning animation and the hint reveal
  - the **loading screen**, the **Topics screen** and **Not-yet panel**
  - the **Practice** tag and the unit label on question cards

**Other gaps:**
- **Coverage:** only Physics I has problems; the other 10 courses show as Not yet.
- **Detection is keyword- and similarity-based:** it misses unfamiliar wording, and can't see figures. Guesses are flagged; the student can change any topic.
- **Accessibility:** hidden scroll bars reduce discoverability on long pages, and there's been no screen-reader audit.
- **Snapshot compatibility:**
  - Archived tests store raw `Question` objects that point at template ids.
  - Never rename or delete a template id. Retire templates by keeping them, or add an alias in `src/lib/bank.ts`.
  - If the `Question` shape changes, bump the storage key (`vriant:archive:v2`) and migrate.
- **Deleting a source sheet** leaves the tests made from it (each carries its own copy of the sheet).
- **Nothing is synced:** a filed test lives only in this browser.
- **Sheet row hover corners:** Figma rounds the hover fill (`radius/lg`); the code keeps it square against the divider lines. Decide which is right.

---

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
| 2026-09-27 | Archive rows: the status sits flush right, as in Figma. On hover or focus it gives way to the "Review results" / "Make a new test" hint, rather than the hidden hint pushing every status left. |
| 2026-09-27 | Scroll areas scroll vertically only. The slider knob no longer overhangs its track; that overhang had let the Review setup column slide sideways. |
| 2026-09-27 | Figma Sheet Row Hover now matches the code: the Status hides and a Hint (Label/S + Chevron Right in `text/tertiary`) takes its slot. The hint text is a component property, `Hint`. |
| 2026-09-27 | Clicking where you already are does nothing: the current tab is inert, and same-screen navigation no longer replays the screen transition or adds a history entry. |
| 2026-09-27 | Zero running cost: no AI or server at runtime. A bank of original, formula-checked templates, organized by concept, with one lazily loaded file per course. A sheet's concepts decide what gets practised. |
| 2026-09-27 | Cooper Union's engineering core sets the build order. Wave 1: Physics I, Calculus I, Calculus II, Intro Linear Algebra. National syllabi and frameworks rank how common each concept is (`docs/curriculum.md`). |
| 2026-09-27 | Physics I bank built: 108 templates, 48 concepts. Difficulty became absolute tiers (Warm-up · Standard · Challenge). Grading reads arithmetic (27/5.5, π/4, 3×10⁸), decimal commas and superscripts, and flags wrong signs. Fixes §4.7 #1, #3, #5, #6, #7, #9 (numbering of the handoff at that time). |
| 2026-09-27 | Loading screen: incline mark, tagline and a construction-line loader, shown once per session. |
| 2026-09-28 | Honest coverage: the concept map lists every planned course (11 courses, 210 concepts). Topics without problems say "Not in Vriant yet" and suggest the closest ready ones. |
| 2026-09-28 | Students can practice without a sheet: a Topics screen for searching in their own words or browsing by course; picked topics become a practice sheet. |
| 2026-09-28 | Handoff revamped around the bank, coverage and the phased roadmap (§10). |
| 2026-09-28 | Bank engine ready for every course: course files register themselves from `src/bank/courses/`; maths answers show and grade exactly (fractions, π, roots); prompts can use derived values; worded "which one?" questions; per-template tolerance. `docs/authoring.md` is the guide for writing banks. |
| 2026-09-28 | Sheets are read for real, on the device: PDF text (pdf.js), OCR for photos and scanned PDFs (Tesseract, engine from jsDelivr on first use), pasted text. Problems are matched to concepts by keywords plus similarity to the bank's templates; guesses are marked "Check" and every topic can be changed. |
| 2026-09-30 | The live site is built by GitHub Actions and published to GitHub Pages. Pages had been serving the unbuilt source, so visitors were stuck on the loading screen. If the app can't start, the loading screen now says so and offers Reload. PDF pages render in one pass, so reading never stalls in a background tab. |
| 2026-10-01 | Numbers only where they're used: the score, test progress, the question-count setting, the timer, answered-before-hand-in, the sheet's own problem numbers, dates and keys. Section indices (01, 02…), counts, points, percentages, page counters, course codes and the version number are gone. |
