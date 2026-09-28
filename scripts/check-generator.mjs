// Stress-test the problem bank: `npm run check:generator` (SEEDS=400 for a bigger run; COURSE=calc1 for one course).
// Loads every course file in src/bank/courses through Vite, so the app's own module resolution applies.
//
// Hard failures (exit code 1):
//   · a formula (or worded pick) that doesn't reproduce its hand-checked reference case
//   · a non-finite answer, or a correct answer (typed as displayed) marked wrong
//   · multiple choice without 4 distinct options; a worded question without 2–4 distinct options
//   · a prompt, option or worked step with an unfilled value, or TeX that KaTeX can't render
//   · a concept in a built course with no templates, a template pointing at an unknown concept,
//     a duplicate template id, or a course file whose name isn't a course in the concept map
// Reported, not failed: "ambiguous" variants, where a common mistake lands within 5% of the answer.
import katex from 'katex';
import { createServer } from 'vite';

const SEEDS = Number(process.env.SEEDS ?? 120);
const ONLY = process.env.COURSE;
const server = await createServer({ configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
let hard = 0;
const fail = (id, msg) => {
  hard++;
  if (hard <= 400) console.log(`  ✗ ${id}: ${msg}`);
};
const tex = (s) => katex.renderToString(s, { throwOnError: true, output: 'html', trust: (ctx) => ctx.command === '\\htmlClass', strict: (code) => (code === 'htmlExtension' ? 'ignore' : 'warn') });
const BAD = /undefined|NaN|Infinity|\\p\{|\[object/;

try {
  const bank = await server.ssrLoadModule('/src/lib/bank.ts');
  const p = await server.ssrLoadModule('/src/lib/problems.ts');
  const { COURSES, CONCEPTS } = await server.ssrLoadModule('/src/bank/taxonomy.ts');
  const courses = bank.BANK_COURSES.filter((c) => !ONLY || c === ONLY);
  if (ONLY && !courses.length) fail(ONLY, `no course file src/bank/courses/${ONLY}.ts`);
  const seen = new Map();

  for (const courseId of courses) {
    const course = COURSES.find((c) => c.id === courseId);
    if (!course) {
      fail(courseId, `src/bank/courses/${courseId}.ts doesn't match any course id in src/bank/taxonomy.ts`);
      continue;
    }
    const raw = (await server.ssrLoadModule(`/src/bank/courses/${courseId}.ts`)).default;
    for (const t of raw) {
      if (seen.has(t.id)) fail(t.id, `duplicate template id (also in ${seen.get(t.id)})`);
      seen.set(t.id, courseId);
    }
    await bank.ensureCourse(courseId);
    const concepts = course.units.flatMap((u) => u.concepts);
    const templates = concepts.flatMap((c) => bank.templatesFor(c.id));
    console.log(`\n${course.code} ${course.name}: ${raw.length} templates across ${concepts.length} concepts`);

    for (const c of concepts) if (!bank.templatesFor(c.id).length) fail(c.id, 'concept has no templates');
    for (const t of raw) if (!CONCEPTS.has(t.concept)) fail(t.id, `unknown concept ${t.concept}`);
    const rows = {};
    for (const t of templates) {
      if (!t.id.startsWith(`${courseId}.`)) fail(t.id, `id should start with "${courseId}."`);
      if (!t.title?.trim() || !t.hint?.trim()) fail(t.id, 'needs a title and a hint');
      if (![1, 2, 3].includes(t.tier)) fail(t.id, `tier should be 1, 2 or 3 (got ${t.tier})`);

      // Every {k} and \p{k} must be a param or a derived value.
      const probe = Object.fromEntries(Object.entries(t.params).map(([k, v]) => [k, v.min]));
      let derivedKeys = [];
      try {
        derivedKeys = Object.keys(t.derive?.(probe) ?? {});
      } catch (e) {
        fail(t.id, `derive() threw: ${e.message}`);
      }
      const keys = new Set([...Object.keys(t.params), ...derivedKeys]);
      for (const tok of t.prompt) {
        if (typeof tok === 'object' && 'k' in tok && !keys.has(tok.k)) fail(t.id, `prompt uses {${tok.k}}, which isn't a param or derived value`);
        if (typeof tok === 'object' && 'tex' in tok) for (const [, k] of tok.tex.matchAll(/\\p\{(\w+)\}/g)) if (!keys.has(k)) fail(t.id, `prompt TeX uses \\p{${k}}, which isn't a param or derived value`);
      }

      // Hand-checked reference cases.
      for (const r of t.ref ?? []) {
        if (t.pick) {
          const got = t.pick(r.v).answer;
          if (got !== r.a) fail(t.id, `reference ${JSON.stringify(r.v)} should pick "${r.a}", pick() gives "${got}"`);
        } else {
          const got = t.answer(r.v);
          if (!(Math.abs(got - r.a) <= Math.max(1e-12, Math.abs(r.a) * 5e-4))) fail(t.id, `reference ${JSON.stringify(r.v)} should give ${r.a}, formula gives ${got}`);
        }
      }
      if (!t.ref?.length) fail(t.id, 'no hand-checked reference case');

      const row = (rows[t.id] = { tier: t.tier, kind: t.pick ? 'worded' : t.exact ? 'exact' : 'numeric', variants: 0, ambiguous: 0 });
      for (const diff of ['easier', 'same', 'harder']) {
        for (let s = 1; s <= SEEDS; s++) {
          const seed = s * 7919 + t.id.length;
          for (const kind of t.pick ? ['text'] : ['free', 'choice']) {
            let q;
            try {
              q = p.sampleQuestion(t, seed, diff, kind);
            } catch (e) {
              fail(t.id, `building a question threw: ${e.message}`);
              break;
            }
            row.variants++;
            if (p.isAmbiguous(t, q.values)) row.ambiguous++;
            if (q.kind === 'text') {
              const opts = q.options ?? [];
              if (opts.length < 2 || opts.length > 4 || new Set(opts).size !== opts.length) fail(t.id, `worded options must be 2–4 distinct: ${opts.join(' | ')}`);
              if (q.correct < 0 || p.grade(q, undefined, q.correct).result !== 'correct') fail(t.id, 'the right option was marked wrong');
              const wrongPick = opts.findIndex((_, i) => i !== q.correct);
              if (wrongPick >= 0 && p.grade(q, undefined, wrongPick).result !== 'incorrect') fail(t.id, 'a wrong option was not marked wrong');
              if (s <= 3) {
                for (const o of opts) {
                  if (BAD.test(o)) fail(t.id, `option shows "${o}"`);
                  for (const part of p.richParts(o)) {
                    if (!('tex' in part)) continue;
                    try {
                      tex(part.tex);
                    } catch (e) {
                      fail(t.id, `option TeX: ${e.message}`);
                    }
                  }
                }
              }
            } else {
              if (!Number.isFinite(q.answer)) {
                fail(t.id, `non-finite answer for ${JSON.stringify(q.values)} (${diff})`);
                continue;
              }
              if (q.kind === 'free') {
                const shown = p.fmtAnswer(t, q.answer);
                const g = p.grade(q, shown, undefined);
                if (g.result !== 'correct') fail(t.id, `typing the displayed answer "${shown}" was graded ${g.result} (${JSON.stringify(q.values)})`);
              } else {
                const shown = q.choices.map((_, i) => p.choiceText(q, i));
                if (q.choices.length < 4 || new Set(shown).size < 4) fail(t.id, `choices not 4 distinct options: ${shown.join(' | ')}`);
                if (p.grade(q, undefined, q.correct).result !== 'correct') fail(t.id, 'the correct choice was marked wrong');
              }
            }
            // Render the prompt and worked steps for a few variants of each difficulty.
            if (s <= 3 && q.kind !== 'choice') {
              for (const part of p.promptParts(t, q.values, q.dps, true)) {
                const text = 'tex' in part ? part.tex : part.text;
                if (BAD.test(text)) fail(t.id, `prompt shows "${text}"`);
                if ('tex' in part) {
                  try {
                    tex(part.tex);
                  } catch (e) {
                    fail(t.id, `prompt TeX: ${e.message}`);
                  }
                }
              }
              for (const step of p.workedSteps(q)) {
                if (BAD.test(step.tex)) fail(t.id, `worked step shows "${step.tex}"`);
                try {
                  tex(step.tex);
                } catch (e) {
                  fail(t.id, `worked-step TeX: ${e.message}`);
                }
              }
            }
          }
        }
      }
      row.ambiguous = `${((row.ambiguous / row.variants) * 100).toFixed(1)}%`;
    }
    const noisy = Object.entries(rows).filter(([, r]) => r.ambiguous !== '0.0%');
    console.log(noisy.length ? '  Ambiguous variants (a mistake within 5% of the answer, or repeated options):' : '  No ambiguous variants.');
    if (noisy.length) console.table(Object.fromEntries(noisy));
    const tiers = [1, 2, 3].map((k) => templates.filter((t) => t.tier === k).length);
    const worded = templates.filter((t) => t.pick).length;
    console.log(`  Tiers: ${tiers[0]} warm-up · ${tiers[1]} standard · ${tiers[2]} challenge${worded ? ` · ${worded} worded` : ''}`);
  }
} finally {
  await server.close();
}

console.log(hard ? `\n✗ ${hard} hard failures` : '\n✓ No hard failures');
process.exit(hard ? 1 : 0);
