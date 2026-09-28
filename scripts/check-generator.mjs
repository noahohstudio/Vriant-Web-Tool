// Stress-test the problem bank: `npm run check:generator` (SEEDS=400 for a bigger run; COURSE=phys1 for one course).
// Loads every course file through Vite, so the app's own module resolution applies, then checks every template.
//
// Hard failures (exit code 1):
//   · a formula that doesn't reproduce its hand-checked reference case
//   · a non-finite answer, or a correct answer (typed as displayed) marked wrong
//   · multiple choice with fewer than 4 distinct options
//   · a prompt or worked step with an unfilled value, or TeX that KaTeX can't render
//   · a concept in a built course with no templates, or a template pointing at an unknown concept
// Reported, not failed: "ambiguous" variants, where a common mistake lands within 5% of the answer.
import katex from 'katex';
import { createServer } from 'vite';

const SEEDS = Number(process.env.SEEDS ?? 120);
const ONLY = process.env.COURSE;
const server = await createServer({ configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
let hard = 0;
const fail = (id, msg) => {
  hard++;
  console.log(`  ✗ ${id}: ${msg}`);
};
const tex = (s) => katex.renderToString(s, { throwOnError: true, output: 'html', trust: (ctx) => ctx.command === '\\htmlClass', strict: (code) => (code === 'htmlExtension' ? 'ignore' : 'warn') });

try {
  const bank = await server.ssrLoadModule('/src/lib/bank.ts');
  const p = await server.ssrLoadModule('/src/lib/problems.ts');
  const { COURSES, CONCEPTS } = await server.ssrLoadModule('/src/bank/taxonomy.ts');
  const courses = bank.BANK_COURSES.filter((c) => !ONLY || c === ONLY);

  for (const courseId of courses) {
    await bank.ensureCourse(courseId);
    const course = COURSES.find((c) => c.id === courseId);
    const concepts = course.units.flatMap((u) => u.concepts);
    const templates = concepts.flatMap((c) => bank.templatesFor(c.id));
    console.log(`\n${course.code} ${course.name}: ${templates.length} templates across ${concepts.length} concepts`);

    for (const c of concepts) if (!bank.templatesFor(c.id).length) fail(c.id, 'concept has no templates');
    const rows = {};
    for (const t of templates) {
      if (!CONCEPTS.has(t.concept)) fail(t.id, `unknown concept ${t.concept}`);
      if (!t.id.startsWith(`${courseId}.`)) fail(t.id, `id should start with "${courseId}."`);
      const keys = new Set(Object.keys(t.params));
      for (const tok of t.prompt) {
        if (typeof tok === 'object' && 'k' in tok && !keys.has(tok.k)) fail(t.id, `prompt uses {${tok.k}}, which isn't a param`);
        if (typeof tok === 'object' && 'tex' in tok) for (const [, k] of tok.tex.matchAll(/\\p\{(\w+)\}/g)) if (!keys.has(k)) fail(t.id, `prompt TeX uses \\p{${k}}, which isn't a param`);
      }
      for (const r of t.ref ?? []) {
        const got = t.answer(r.v);
        if (!(Math.abs(got - r.a) <= Math.max(1e-12, Math.abs(r.a) * 5e-4))) fail(t.id, `reference ${JSON.stringify(r.v)} should give ${r.a}, formula gives ${got}`);
      }
      if (!t.ref?.length) fail(t.id, 'no hand-checked reference case');

      const row = (rows[t.id] = { tier: t.tier, variants: 0, ambiguous: 0 });
      for (const diff of ['easier', 'same', 'harder']) {
        for (let s = 1; s <= SEEDS; s++) {
          const seed = s * 7919 + t.id.length;
          for (const kind of ['free', 'choice']) {
            const q = p.sampleQuestion(t, seed, diff, kind);
            row.variants++;
            if (!Number.isFinite(q.answer)) {
              fail(t.id, `non-finite answer for ${JSON.stringify(q.values)} (${diff})`);
              continue;
            }
            if (p.isAmbiguous(t, q.values)) row.ambiguous++;
            if (kind === 'free') {
              const shown = p.fmtAnswer(t, q.answer);
              const g = p.grade(q, shown, undefined);
              if (g.result !== 'correct') fail(t.id, `typing the displayed answer "${shown}" was graded ${g.result} (${JSON.stringify(q.values)})`);
            } else {
              const shown = q.choices.map((c) => p.fmtAnswer(t, c));
              if (q.choices.length < 4 || new Set(shown).size < 4) fail(t.id, `choices not 4 distinct options: ${shown.join(' | ')}`);
              if (p.grade(q, undefined, q.correct).result !== 'correct') fail(t.id, 'the correct choice was marked wrong');
            }
            // Render the prompt and worked steps for a few variants of each difficulty.
            if (s <= 3 && kind === 'free') {
              for (const part of p.promptParts(t, q.values, q.dps, true)) {
                const text = 'tex' in part ? part.tex : part.text;
                if (/undefined|NaN|Infinity/.test(text)) fail(t.id, `prompt shows "${text}"`);
                if ('tex' in part) {
                  try {
                    tex(part.tex);
                  } catch (e) {
                    fail(t.id, `prompt TeX: ${e.message}`);
                  }
                }
              }
              for (const step of p.workedSteps(q)) {
                if (/undefined|NaN|Infinity/.test(step.tex)) fail(t.id, `worked step shows "${step.tex}"`);
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
    console.log(noisy.length ? '  Ambiguous variants (a mistake within 5% of the answer):' : '  No ambiguous variants.');
    if (noisy.length) console.table(Object.fromEntries(noisy));
    const tiers = [1, 2, 3].map((n) => templates.filter((t) => t.tier === n).length);
    console.log(`  Tiers: ${tiers[0]} warm-up · ${tiers[1]} standard · ${tiers[2]} challenge`);
  }
} finally {
  await server.close();
}

console.log(hard ? `\n✗ ${hard} hard failures` : '\n✓ No hard failures');
process.exit(hard ? 1 : 0);
