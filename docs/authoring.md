# Writing problems for the Vriant bank

This is the full guide to adding practice problems. HANDOFF.md §4 has the short version.

**The idea.** A problem is a **template**: wording with blanks for its numbers, plus a formula that works out the answer. Every practice question is a template with freshly drawn numbers. Vriant never makes up a problem or an answer at runtime. That's why it costs nothing to run, and why every answer can be trusted.

**Every problem is original.**
- Syllabi and textbooks decide *what* to cover and *how hard*. They never decide the wording.
- Don't copy problems from textbooks, problem sets or websites, even with the numbers changed.
- The audience is Cooper Union engineering and architecture students first, then US college students in general.

---

## 1. Where things live

| Path | What it is |
|---|---|
| `src/bank/taxonomy.ts` | The concept map: courses → units → concepts, with ids, level (`c` core, `m` common, `o` occasional), a Cooper flag and detection keywords. Ships with the app. |
| `src/bank/courses/<course id>.ts` | **One course's templates.** The file name *is* the course id (`calc1.ts`, `phys2.ts`), and adding the file adds the course. Loaded only when needed. |
| `src/bank/kit.ts` | `tpl()` and the shared helpers (§6). Import from `'../kit'`. |
| `src/lib/problems.ts` | The engine: drawing values, formatting, multiple choice, grading. Don't change it from a course file. |
| `scripts/check-generator.mjs` | The stress test (§8). |
| `scripts/sample-bank.mjs` | Prints sample questions, so you can read your templates the way a student will (§8). |
| `scripts/fixtures/detect/<course id>.json` | Sample homework problems, used to test sheet detection (§9). |

**A course is "ready" only when every one of its concepts has at least one template.** The app treats a course file's presence as "ready", so never commit a partial course file. `check:generator` fails if any concept is missing.

---

## 2. Anatomy of a template

```ts
// src/bank/courses/phys1.ts
import { G, n, tpl, u } from '../kit';

export default [
  tpl({
    id: 'phys1.braking',                 // "<course>.<camelCaseName>". Unique, and never renamed once shipped.
    concept: 'phys1.kin1d.constAccel',   // a concept id from taxonomy.ts
    tier: 2,                             // 1 Warm-up · 2 Standard · 3 Challenge
    title: 'Braking distance',           // 2–5 words, sentence case
    params: {                            // [min, max, step, unit, flags]
      v: [10, 32, 1, 'm/s'],
      a: [3, 8, 0.5, 'm/s²'],
    },
    prompt: 'A car travelling at {v} brakes with a constant deceleration of {a}. How far does it travel before stopping?',
    answer: (v) => (v.v * v.v) / (2 * v.a),
    unit: 'm',                           // shown in the answer box; '' when the answer has no unit
    steps: (f, ans) => [
      { tex: 'v^2 = v_0^2 - 2ad', note: 'It stops, so the final speed v is 0.' },
      { tex: `d = \\dfrac{v_0^2}{2a} = \\dfrac{${f('v')}^2}{2 \\times ${f('a')}}` },
      { tex: `d = ${ans}${u('m')}` },
    ],
    mistakes: (v) => [
      { value: (v.v * v.v) / v.a, why: 'Missing the 2 — from v² = v₀² − 2ad, d = v₀² ÷ 2a.' },
      { value: v.v / v.a, why: 'That’s the stopping time, not the distance.' },
    ],
    hint: 'Use v² = v₀² − 2ad with a final speed of 0.',
    ref: [{ v: { v: 18, a: 6 }, a: 27 }],  // worked out BY HAND: 18² / (2 × 6) = 324 / 12 = 27
  }),
];
```

| Field | Rules |
|---|---|
| `params` | `[min, max, step, unit?, flags?]`. Values are drawn on the step grid. Displayed decimals follow the step (step 0.5 shows "4.0"). **Flags:** `int` (whole numbers only), `nz` (never 0), `fixed` (ignores difficulty scaling), `dp` (decimals shown). |
| difficulty | Unless `fixed`: *Warm-up* uses coarser steps. *Challenge* widens positive ranges (×0.6 to ×1.5) and halves the step. **Every value in the widened range must still make a sensible problem**; use `fixed` or `valid` when it wouldn't. |
| `prompt` | Plain text. `{k}` inserts a value with its unit ("12 m/s"). `$…$` is inline TeX, where `\p{k}` inserts the bare number. Keys are letters, digits and `_`. |
| `answer` | Pure formula of the drawn values. Never hard-code an answer. |
| `unit` | The answer's unit, as students write it: `m/s²`, `J`, `N·m`, `°`, `%`. |
| `steps` | 2–5 TeX lines. `f('k')` is the value as displayed; `ans` is the formatted answer. End on the answer with its unit, via `u('m/s')`. `note` is a short plain-English aside. |
| `mistakes` | 2–3 **real** mistakes students make, each with the value it produces and a kind `why`. They feed multiple-choice distractors and the feedback on a wrong typed answer. `partial: true` marks a nearly-right slip (half credit). |
| `valid` | Optional. Rejects value combinations that make no sense (a ladder shorter than the wall, a discriminant below 0). |
| `hint` | One sentence that points at the method without giving the answer. |
| `ref` | At least one case **worked out by hand**, not by running the formula. Pick friendly numbers. The check fails if the formula disagrees. |

**Tier guide:**
- **1 · Warm-up:** one idea, direct substitution.
- **2 · Standard:** typical homework, a step or two.
- **3 · Challenge:** several steps, calculus, or combining two ideas. Exam-level.

**How many:** at least 1 per concept, and ideally 2–3. Put 3 or more on `c` (core) concepts, spread across tiers. `o` (occasional) concepts can have just one.

---

## 3. Maths templates: `exact` and `derive`

For maths, set **`exact: true`**. This changes three things:
- **Display:** answers show exactly: whole numbers stay whole, short decimals stay decimals, and fractions, π and √n appear symbolically (`1/3`, `8π/3`, `3√2/2`). Results add "≈ 106.7" beside non-decimal forms.
- **Grading:** a whole-number answer must be exact. Other answers are right to 3 significant figures. Students can type `8pi/3`, `8π/3`, `2.667`, `sqrt(3)/2` or `√3/2`.
- **Multiple choice:** exact forms appear only when all four options have the same kind of form. Otherwise every option shows a decimal, so the right one never stands out.

**Choose parameters so answers come out nice.** Use integer params (`int: true`), and a `valid` that keeps answers tidy when that matters.

**`derive`** works out extra values for the prompt and steps from the drawn ones. It returns numbers (formatted exactly) or ready-made TeX/text:

```ts
import { sgn, texPoly, tn, tpl } from '../kit';

tpl({
  id: 'calc1.limFactor', concept: 'calc1.limits.algebraic', tier: 1, title: 'Factor and cancel',
  params: { a: [2, 9, 1, '', { int: true }], b: [1, 9, 1, '', { int: true }] },
  // (x − a)(x + b) expanded; texPoly drops zero terms and 1-coefficients and gets every sign right.
  derive: (v) => ({ num: texPoly([1, v.b - v.a, -v.a * v.b]) }),
  prompt: 'Evaluate $\\displaystyle\\lim_{x \\to \\p{a}} \\frac{\\p{num}}{x - \\p{a}}$.',
  answer: (v) => v.a + v.b,
  exact: true,
  steps: (f, ans) => [
    { tex: `\\frac{${f('num')}}{x - ${f('a')}} = \\frac{(x - ${f('a')})(x + ${f('b')})}{x - ${f('a')}}`, note: 'Substituting gives 0/0, so factor the numerator.' },
    { tex: `= x + ${f('b')} \\qquad (x \\ne ${f('a')})`, note: 'Cancel the common factor. The limit never looks at x = a itself.' },
    { tex: `\\lim_{x \\to ${f('a')}} (x + ${f('b')}) = ${ans}` },
  ],
  mistakes: (v) => [
    { value: 0, why: 'Substituting gives 0/0, which tells you nothing yet — it isn’t 0. Factor and cancel first.' },
    { value: v.a - v.b, why: 'Check the factoring: the numerator is (x − a)(x + b), so what’s left is x + b.' },
  ],
  hint: 'If substituting gives 0/0, factor the numerator and cancel the common factor.',
  ref: [{ v: { a: 3, b: 2 }, a: 5 }],   // (x² − x − 6)/(x − 3) → x + 2 → 5
});
```

**Rules for derived values:**
- A derived **number** can be highlighted like a drawn value.
- Derived **text** (`texPoly`, `texSum`, `texMat` …) is inserted as written, and never highlighted.
- `f('key')` works for derived keys in `steps`.
- **Signs:** keep drawn params positive and write the sign into the prompt (`x - \p{a}`). Otherwise build the expression with `texPoly`, `texSum` or `sgn` in `derive`. Never write `+ -3`, and never write a coefficient of 1 ("1x").

---

## 4. Worded questions: `pick`

Some ideas have no number to type. Examples:
- Which way does the induced current flow?
- Does the series converge?
- Is the equilibrium a saddle or a spiral?
- Reject H₀ or not?

Use **`pick`** for these. A worded question is always multiple choice: the right option plus up to three wrong ones, shuffled. Each wrong option carries the feedback for choosing it.

```ts
tpl({
  id: 'calc1.concavityCheck', concept: 'calc1.apps.concavity', tier: 1, title: 'Concave up or down?',
  params: { p: [1, 5, 1, '', { int: true }], q: [2, 9, 1, '', { int: true }], c: [-3, 8, 1, '', { int: true }] },
  derive: (v) => ({ f: texPoly([1, -3 * v.p, v.q, 0]) }),
  prompt: 'Is the graph of $f(x) = \\p{f}$ concave up or concave down at $x = \\p{c}$?',
  pick: (v) => {
    const fpp = 6 * v.c - 6 * v.p;
    return {
      answer: fpp > 0 ? 'Concave up' : 'Concave down',
      wrong: [
        { text: fpp > 0 ? 'Concave down' : 'Concave up', why: `f″(${v.c}) = ${fpp}, which is ${fpp > 0 ? 'positive — concave up' : 'negative — concave down'}.` },
        { text: 'Neither — it’s an inflection point', why: `An inflection point needs f″ to be 0 and change sign; here f″(${v.c}) = ${fpp}.` },
      ],
    };
  },
  steps: (f, ans, v) => [
    { tex: `f'(x) = ${texPoly([3, -6 * v.p, v.q])}, \\quad f''(x) = ${texPoly([6, -6 * v.p])}` },
    { tex: `f''(${f('c')}) = ${tn(6 * v.c - 6 * v.p)}`, note: 'Concavity follows the sign of the second derivative.' },
    { tex: `\\text{${ans}}` },
  ],
  valid: (v) => v.c !== v.p,
  hint: 'Concavity comes from the sign of the second derivative.',
  ref: [{ v: { p: 2, q: 5, c: 4 }, a: 'Concave up' }, { v: { p: 2, q: 5, c: 0 }, a: 'Concave down' }],
});
```

**Rules for worded questions:**
- Give 2–4 options in total, all distinct in every variant. The check fails otherwise.
- Keep options short and parallel. The right one must not be the longest or the most detailed.
- Options can contain `$…$` TeX, e.g. `'$y = 2x + 1$'`.
- `ref` answers are the exact option strings.
- The `ans` passed to `steps` is the right option's text.
- No `answer`, `unit` or `mistakes`.
- Aim for **most templates to be numeric**. Use worded questions where the concept really is a judgment. Roughly one in five templates at most, except where a concept has no sensible number.

---

## 5. When answers depend on tables: `tol`

Statistics answers depend on how students read tables. A z rounded to 2 decimals, or a t critical value from a table row, can shift the answer by 1–2%. Set **`tol: 0.02`** to accept answers within 2%. The defaults are 1% for physics and 3 significant figures for `exact` maths. Use the smallest value that's fair. Say in the prompt how to round when it matters, e.g. "Round z to two decimals".

---

## 6. Helpers in `kit.ts`

| Helper | What it does |
|---|---|
| `u('m/s')` | A unit after a TeX value: `` `${ans}${u('m/s')}` `` |
| `n(x)` | An intermediate physics value for a step, 3 significant figures, TeX-ready |
| `tn(x)` | A maths value for TeX, exactly when possible: `\frac{1}{3}`, `\frac{2\pi}{3}`, `3\sqrt{2}` |
| `par(s)` | Wraps a negative value in parentheses: `par(f('x'))` |
| `sgn(x)` | `" + 3"` or `" - 3"`, to append a signed number |
| `texPoly([a, b, c], 'x')` | A polynomial, highest power first, with correct signs; zero terms and 1-coefficients handled |
| `texSum([[3, 'e^{2x}'], [-1, '\\sin x'], [5, '']])` | Any signed sum of terms |
| `texMat(M)`, `texVec(v)` | A `bmatrix`; a vector ⟨a, b, c⟩ |
| `G`, `rad`, `deg` | 9.81 m/s²; degree/radian conversion |
| `gcd`, `lcm`, `fact`, `nCr`, `nPr`, `round(x, dp)` | Arithmetic |
| `simpson(f, a, b)`, `bisect(f, a, b)` | A numeric integral; a root where f changes sign. Use these to *check* or compute answers without closed forms |
| `normCdf`, `normInv`, `tCdf`, `tInv`, `chi2Cdf`, `chi2Inv`, `fCdf`, `fInv` | Distributions (lower-tail probabilities; inverses take a lower-tail p) |
| `binomPmf`, `binomCdf`, `poissonPmf`, `poissonCdf` | Discrete distributions |
| `dot`, `cross`, `norm`, `matMul`, `det`, `solve` | Vectors and matrices |
| `K_E`, `EPS0`, `MU0`, `QE`, `ME`, `MP`, `H_PLANCK`, `C_LIGHT`, `K_B`, `N_A`, `R_GAS` | Physical constants, at the values students are usually given. **State in the prompt any constant the student needs that isn't standard.** |

Write a helper you need inside your own course file. Don't edit `kit.ts` or the engine from a course file.

---

## 7. House style

**Spelling and units:**
- American spelling ("meters", "center", "practice").
- SI units; g = 9.81 m/s².
- Numbers and units as students see them: `12 m/s`, `4.0 kg`, `30°`.

**Wording:**
- Plain and kind.
- Mistake feedback says what the student probably did, then what to do instead. It explains the physics or maths, not the failure.
- No trick questions, no gotchas, no pop-culture names.
- Prompts are one to three sentences. Ask for exactly one thing ("What is its speed?"), and name the unit when it matters ("in meters per second").

**Maths notation:**
- `\dfrac` in steps, `\frac` inline.
- `\,dx` before differentials.
- `\displaystyle` for limits, sums and integrals inside prompts.

**Keep numbers tidy:**
- Answers should rarely need more than 3 significant figures.
- Maths answers should be integers or simple fractions where the concept allows.

**Keep it safe for grading:**
- Every mistake must land more than 5% away from the right answer, in every variant. If the check reports ambiguous variants, narrow the ranges or add `valid`.
- Avoid mistakes that coincide with the answer for special values (a mistake of `2a` when the answer is `a + 2`).

---

## 8. Checking your work

```bash
COURSE=calc1 npm run check:generator   # must end with "✓ No hard failures", ideally "No ambiguous variants"
COURSE=calc1 npm run sample:bank       # read every prompt, answer, option and step as a student would
COURSE=calc1 ID=calc1.limFactor DIFF=harder npm run sample:bank
npx tsc --noEmit                       # must be clean (unused variables and parameters are errors)
```

**The check fails on:**
- a formula (or `pick`) that misses its `ref`
- a non-finite answer
- a displayed answer that wouldn't be graded right if typed back
- multiple choice without 4 distinct options, or worded questions without 2–4 distinct options
- unfilled or broken TeX
- an unknown concept, a duplicate id, or a concept with no templates

**Before you finish, read the sample output.** A template can pass every check and still read badly.

**Size:** keep each course file under about 60 KB gzipped. Physics I, with 108 templates, is 27 KB.

---

## 9. Detection fixtures and keywords

Vriant reads a student's worksheet in the browser. It splits the text into problems, then matches each problem to a concept using the `kw` keywords in `taxonomy.ts`. Two things help it.

**Fixtures:** `scripts/fixtures/detect/<course id>.json`. These are realistic homework problems, written the way they look when text is copied out of a PDF. They're original, like everything else.

```json
{
  "course": "calc1",
  "problems": [
    { "concept": "calc1.limits.algebraic", "text": "Evaluate lim x→3 (x^2 − 9)/(x − 3), or explain why it does not exist." },
    { "concept": "calc1.apps.relatedRates", "text": "A 13 ft ladder leans against a wall. The bottom slides away at 2 ft/s. How fast is the top sliding down when the bottom is 5 ft from the wall?" }
  ],
  "sheets": [
    {
      "title": "Ma 111 Problem Set 4",
      "text": "Ma 111 — Problem Set 4\nDue Friday\n1. Find the derivative of f(x) = x^3 sin x.\n2. A spherical balloon is inflated at 10 cm^3/s. How fast is the radius increasing when r = 5 cm?\n3. Sketch the graph of y = x/(x^2+1).",
      "expect": ["calc1.deriv.rules", "calc1.apps.relatedRates", null]
    }
  ]
}
```

- **Problems:** about 2 per concept, phrased differently from each other and from your templates. Mix Unicode (`x²`, `√`, `π`, `∫`, `→`, `θ`) with the plain forms PDFs often produce (`x^2`, `sqrt(x)`, `pi`, `->`, `int`).
- **Sheets:** 2 or 3 multi-problem sheets. Number the problems the way real sheets do (`1.`, `2)`, `Problem 3`, with `(a)`/`(b)` parts inside). `expect` gives one concept id per problem, in order. Use `null` for problems Vriant shouldn't match (sketches, proofs, "explain in words").

**Keywords:** the `kw` string on each concept, in your course's block of `taxonomy.ts`.
- Lowercase, separated by `|`.
- Matching is by substring: `accelerat` matches both "acceleration" and "accelerates".
- **Prefer distinctive phrases and symbols** that appear in real problems ("related rates", "ladder", "cm^3/s", "how fast").
- **Avoid generic words** that would pull in other courses ("find", "velocity" on its own, "graph").
- You may edit `kw` for your own course's concepts. Don't change ids, names or levels, and don't add or remove concepts. If a concept seems wrong, say so in your report.
