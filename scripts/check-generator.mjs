// Stress-test the problem engine: `npm run check:generator` (Node 23.6+ runs the TypeScript directly).
// Builds thousands of tests from the sample sheet at every difficulty and reports anything suspicious.
// Exit code 1 = a hard failure (a correct answer rejected, missing choices, or a variant identical to the original).

const p = await import(new URL('../src/lib/problems.ts', import.meta.url).href);

const SEEDS = Number(process.env.SEEDS ?? 400);
const sheet = p.sampleSheet();
const all = Object.fromEntries(sheet.problems.filter((x) => x.supported).map((x) => [x.n, true]));
let hard = 0;

console.log('\nOriginal problems (should match the worksheet):');
for (const prob of sheet.problems) {
  if (!prob.templateId) {
    console.log(`  Q${prob.n}  unsupported — ${prob.reason}`);
    continue;
  }
  const t = p.TEMPLATES[prob.templateId];
  console.log(`  Q${prob.n}  ${t.title.padEnd(18)} → ${p.fmtSig(t.answer(prob.values))} ${t.unit}`);
}

for (const diff of ['easier', 'same', 'harder']) {
  const rows = {};
  for (let s = 1; s <= SEEDS; s++) {
    for (const q of p.buildQuestions(sheet.problems, all, 10, diff, s * 7919)) {
      const t = p.TEMPLATES[q.templateId];
      const r = (rows[t.id] ??= { variants: 0, sameAsOriginal: 0, ambiguous: 0, choicesUnder4: 0, correctRejected: 0, maxDecimals: 0 });
      const original = sheet.problems.find((x) => x.n === q.problemN).values;
      r.variants++;
      if (Object.keys(q.values).some((k) => q.values[k] === original[k])) r.sameAsOriginal++;
      // A common mistake that lands within 5% of the right answer makes the variant ungradable by value alone.
      if (t.mistakes(q.values).some((m) => Math.abs(m.value - q.answer) / Math.abs(q.answer) < 0.05)) r.ambiguous++;
      if (q.kind === 'choice' && q.choices.length < 4) r.choicesUnder4++;
      const g = p.grade(q, q.kind === 'free' ? p.fmtSig(q.answer) : undefined, q.kind === 'choice' ? q.correct : undefined);
      if (g.result !== 'correct') r.correctRejected++;
      r.maxDecimals = Math.max(r.maxDecimals, ...Object.values(q.dps));
    }
  }
  console.log(`\n${diff.toUpperCase()} — ${SEEDS} tests × 10 questions`);
  console.table(rows);
  for (const r of Object.values(rows)) hard += r.sameAsOriginal + r.choicesUnder4 + r.correctRejected;
}

console.log(hard ? `\n✗ ${hard} hard failures` : '\n✓ No hard failures (check the "ambiguous" column — those variants need a fix)');
process.exit(hard ? 1 : 0);
