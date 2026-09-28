// Test sheet detection against sample homework: `npm run check:detect` (COURSE=phys1 for one course, VERBOSE=1 to list misses).
// Fixtures live in scripts/fixtures/detect/<course id>.json (format: docs/authoring.md §9). For each sample problem,
// the detector must land on the right unit; for each sample sheet, it must find every problem and match each in order.
// Fails (exit 1) when fewer than 90% of problems land in the right unit, or a sheet splits into the wrong number of problems.
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';

const ONLY = process.env.COURSE;
const VERBOSE = !!process.env.VERBOSE;
const TARGET = 0.9;
const server = await createServer({ configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
let hard = 0;
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(0)}%` : '—');

try {
  const d = await server.ssrLoadModule('/src/lib/detect.ts');
  await d.prepare();
  const { CONCEPTS } = await server.ssrLoadModule('/src/bank/taxonomy.ts');
  const dir = new URL('./fixtures/detect/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && (!ONLY || f === `${ONLY}.json`));
  const totals = { n: 0, concept: 0, unit: 0, course: 0, sure: 0 };
  const rows = {};
  for (const file of files) {
    const fx = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    const row = (rows[fx.course] = { problems: 0, concept: 0, unit: 0, course: 0, strong: 0, sheets: 0, sheetProblems: 0, sheetRight: 0 });
    for (const p of fx.problems ?? []) {
      const want = CONCEPTS.get(p.concept);
      if (!want) {
        console.log(`  ✗ ${file}: unknown concept ${p.concept}`);
        hard++;
        continue;
      }
      const m = d.matchProblem(p.text);
      const got = m.concept;
      row.problems++;
      if (got?.id === want.id) row.concept++;
      if (got?.unit.id === want.unit.id) row.unit++;
      else if (VERBOSE) console.log(`  · ${fx.course} miss: wanted ${want.id}, got ${got?.id ?? 'nothing'} (${m.confidence}) — ${p.text.slice(0, 90)}`);
      if (got?.course.id === want.course.id) row.course++;
      if (m.confidence === 'strong') row.strong++;
    }
    for (const sh of fx.sheets ?? []) {
      row.sheets++;
      const sheet = d.detectSheet(sh.text.split('\f'), `${sh.title ?? 'sheet'}.pdf`, 'text');
      if (sheet.problems.length !== sh.expect.length) {
        console.log(`  ✗ ${fx.course} sheet "${sh.title}": found ${sheet.problems.length} problems, expected ${sh.expect.length}`);
        hard++;
      }
      sh.expect.forEach((want, i) => {
        const got = sheet.problems[i];
        row.sheetProblems++;
        const wantUnit = want ? CONCEPTS.get(want)?.unit.id : null;
        const ok = want === null ? !got?.supported : got?.concept && CONCEPTS.get(got.concept)?.unit.id === wantUnit;
        if (ok) row.sheetRight++;
        else if (VERBOSE) console.log(`  · ${fx.course} sheet "${sh.title}" Q${i + 1}: wanted ${want ?? 'left out'}, got ${got?.concept ?? 'nothing'}${got && !got.supported ? ` (left out: ${got.reason})` : ''}`);
      });
    }
    totals.n += row.problems;
    totals.concept += row.concept;
    totals.unit += row.unit;
    totals.course += row.course;
    totals.sure += row.strong;
  }
  const table = Object.fromEntries(
    Object.entries(rows).map(([id, r]) => [id, { problems: r.problems, 'right concept': pct(r.concept, r.problems), 'right unit': pct(r.unit, r.problems), 'right course': pct(r.course, r.problems), sure: pct(r.strong, r.problems), 'sheet problems right': `${r.sheetRight}/${r.sheetProblems}` }]),
  );
  console.table(table);
  const unitRate = totals.n ? totals.unit / totals.n : 1;
  console.log(`\nAll: ${totals.n} problems · concept ${pct(totals.concept, totals.n)} · unit ${pct(totals.unit, totals.n)} · course ${pct(totals.course, totals.n)} · sure ${pct(totals.sure, totals.n)}`);
  if (unitRate < TARGET) {
    console.log(`✗ Unit accuracy ${pct(totals.unit, totals.n)} is below the ${TARGET * 100}% target`);
    hard++;
  }
} finally {
  await server.close();
}
console.log(hard ? `\n✗ ${hard} failures` : '\n✓ Detection meets the target');
process.exit(hard ? 1 : 0);
