// Print sample questions from one course file: `COURSE=calc1 npm run sample:bank` (N=5 for the first five templates,
// ID=calc1.limFactor for one). Shows each prompt, the answer or options, and the worked steps, as plain text.
import { createServer } from 'vite';
const server = await createServer({ configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const bank = await server.ssrLoadModule('/src/lib/bank.ts');
  const p = await server.ssrLoadModule('/src/lib/problems.ts');
  const course = process.env.COURSE ?? 'phys1';
  await bank.ensureCourse(course);
  const list = (await server.ssrLoadModule(`/src/bank/courses/${course}.ts`)).default;
  const picked = process.env.ID ? list.filter((t) => t.id === process.env.ID) : list.slice(0, Number(process.env.N ?? list.length));
  for (const t of picked) {
    for (const [seed, kind] of [[11, 'free'], [23, 'choice']]) {
      const diff = process.env.DIFF ?? 'same';
      const q = p.sampleQuestion(t, seed + Number(process.env.SEED ?? 0), diff, kind);
      const prompt = p.promptParts(t, q.values, q.dps, false).map((x) => ('tex' in x ? `$${x.tex}$` : x.text)).join('');
      console.log(`\n[${t.id} · ${q.kind}] ${prompt}`);
      if (q.kind === 'free') console.log(`  answer: ${p.fmtAnswer(t, q.answer)} ${p.fmtApprox(t, q.answer)}`);
      else console.log('  options: ' + (q.kind === 'text' ? q.options : q.choices).map((_, i) => (i === q.correct ? '*' : '') + p.choiceText(q, i)).join(' | '));
      if (kind === 'free' || q.kind === 'text') for (const s of p.workedSteps(q)) console.log('  step: ' + s.tex + (s.note ? `  — ${s.note}` : ''));
      if (q.kind === 'text') break;
    }
  }
} finally {
  await server.close();
}
