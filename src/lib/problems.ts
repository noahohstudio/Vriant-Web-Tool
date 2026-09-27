// Problem engine: templates → variants → grading.
// Answers are always computed from the formula (never "generated"), so grading is exact.

export type Difficulty = 'easier' | 'same' | 'harder';
export type Values = Record<string, number>;
type Param = { min: number; max: number; step: number; dp: number; unit: string };
type PromptToken = string | { k: string };
export type Step = { tex: string; note?: string };
type Mistake = { value: number; why: string; partial?: boolean };

export type Template = {
  id: string;
  title: string;
  topic: string;
  params: Record<string, Param>;
  prompt: PromptToken[];
  answer: (v: Values) => number;
  unit: string;
  steps: (f: (k: string) => string, ans: string, v: Values) => Step[];
  mistakes: (v: Values) => Mistake[];
  valid?: (v: Values) => boolean;
  hint: string;
};

const G = 9.81;

export const TEMPLATES: Record<string, Template> = {
  carAccel: {
    id: 'carAccel',
    title: 'Car from rest',
    topic: 'Kinematics',
    params: {
      v: { min: 12, max: 36, step: 1, dp: 0, unit: 'm/s' },
      t: { min: 3, max: 9, step: 0.5, dp: 1, unit: 's' },
    },
    prompt: ['A car speeds up from 0 to ', { k: 'v' }, ' in ', { k: 't' }, '. Find its acceleration.'],
    answer: (v) => v.v / v.t,
    unit: 'm/s²',
    steps: (f, ans) => [
      { tex: 'a = \\dfrac{\\Delta v}{\\Delta t}', note: 'Acceleration is the change in velocity per second.' },
      { tex: `a = \\dfrac{${f('v')} - 0}{${f('t')}}`, note: 'It starts from rest, so Δv is just the final speed.' },
      { tex: `a = ${ans}\\ \\text{m/s}^2` },
    ],
    mistakes: (v) => [
      { value: v.v * v.t, why: 'You multiplied speed by time. Acceleration divides the change in speed by the time taken.' },
      { value: v.t / v.v, why: 'Flipped: it’s change in speed ÷ time, not time ÷ speed.' },
      { value: v.v / (2 * v.t), why: 'No halving needed here — a = Δv ÷ Δt.' },
    ],
    hint: 'Acceleration = change in velocity ÷ time taken.',
  },
  droppedBall: {
    id: 'droppedBall',
    title: 'Dropped ball',
    topic: 'Kinematics',
    params: { h: { min: 5, max: 60, step: 1, dp: 0, unit: 'm' } },
    prompt: ['A ball is dropped from a ', { k: 'h' }, ' ledge. How long does it take to reach the ground? Use g = 9.81 m/s².'],
    answer: (v) => Math.sqrt((2 * v.h) / G),
    unit: 's',
    steps: (f, ans) => [
      { tex: 'h = \\tfrac{1}{2}\\, g t^2', note: 'Dropped means it starts from rest.' },
      { tex: `t = \\sqrt{\\dfrac{2h}{g}} = \\sqrt{\\dfrac{2 \\times ${f('h')}}{9.81}}`, note: 'Solve for t first, then substitute.' },
      { tex: `t = ${ans}\\ \\text{s}` },
    ],
    mistakes: (v) => [
      { value: Math.sqrt(v.h / G), why: 'Missing the 2 — from h = ½gt², t = √(2h/g).' },
      { value: (2 * v.h) / G, why: 'Don’t forget the square root at the end.' },
      { value: v.h / G, why: 'Solve h = ½gt² for t rather than dividing h by g.' },
    ],
    hint: 'Start from h = ½gt² and solve for t.',
  },
  cyclist: {
    id: 'cyclist',
    title: 'Cyclist from rest',
    topic: 'Kinematics',
    params: {
      v: { min: 6, max: 16, step: 0.1, dp: 1, unit: 'm/s' },
      t: { min: 3, max: 8, step: 0.5, dp: 1, unit: 's' },
    },
    prompt: ['A cyclist accelerates uniformly from rest to ', { k: 'v' }, ' in ', { k: 't' }, '. How far does she travel in that time?'],
    answer: (v) => 0.5 * v.v * v.t,
    unit: 'm',
    steps: (f, ans) => [
      { tex: '\\Delta x = \\tfrac{1}{2}(v_0 + v)\\,t', note: 'Acceleration is uniform, so use the average velocity.' },
      { tex: `\\Delta x = \\tfrac{1}{2}(0 + ${f('v')})(${f('t')})`, note: 'Starts from rest: v₀ = 0.' },
      { tex: `\\Delta x = ${ans}\\ \\text{m}` },
    ],
    mistakes: (v) => [
      { value: v.v * v.t, why: 'You multiplied top speed by time. With uniform acceleration from rest, use the average speed — half the top speed.' },
      { value: v.v / v.t, why: 'That’s the acceleration, not the distance.' },
      { value: 0.25 * v.v * v.t, why: 'Halved twice — the average speed is ½ × top speed, once.' },
    ],
    hint: 'Average speed = ½ × (start speed + end speed).',
  },
  braking: {
    id: 'braking',
    title: 'Braking distance',
    topic: 'Kinematics',
    params: {
      v: { min: 10, max: 32, step: 1, dp: 0, unit: 'm/s' },
      a: { min: 3, max: 8, step: 0.5, dp: 1, unit: 'm/s²' },
    },
    prompt: ['A car travelling at ', { k: 'v' }, ' brakes with a constant deceleration of ', { k: 'a' }, '. How far does it travel before stopping?'],
    answer: (v) => (v.v * v.v) / (2 * v.a),
    unit: 'm',
    steps: (f, ans) => [
      { tex: 'v^2 = v_0^2 - 2ad', note: 'It stops, so the final speed v is 0.' },
      { tex: `d = \\dfrac{v_0^2}{2a} = \\dfrac{${f('v')}^2}{2 \\times ${f('a')}}` },
      { tex: `d = ${ans}\\ \\text{m}` },
    ],
    mistakes: (v) => [
      { value: (v.v * v.v) / v.a, why: 'Missing the 2 — from v² = v₀² − 2ad, d = v₀² ÷ 2a.' },
      { value: v.v / v.a, why: 'That’s the stopping time, not the distance.' },
      { value: v.v / (2 * v.a), why: 'Square the speed: d = v₀² ÷ 2a.' },
    ],
    hint: 'Use v² = v₀² − 2ad with a final speed of 0.',
  },
  twoTrains: {
    id: 'twoTrains',
    title: 'Two trains',
    topic: 'Kinematics',
    params: {
      d: { min: 20, max: 90, step: 5, dp: 0, unit: 'km' },
      v1: { min: 60, max: 120, step: 5, dp: 0, unit: 'km/h' },
      v2: { min: 60, max: 140, step: 5, dp: 0, unit: 'km/h' },
    },
    prompt: ['Two trains start ', { k: 'd' }, ' apart and head toward each other at ', { k: 'v1' }, ' and ', { k: 'v2' }, '. How many minutes until they meet?'],
    answer: (v) => (v.d / (v.v1 + v.v2)) * 60,
    unit: 'min',
    valid: (v) => v.v1 !== v.v2,
    steps: (f, ans, v) => [
      { tex: 't = \\dfrac{d}{v_1 + v_2}', note: 'Moving toward each other, their speeds add.' },
      { tex: `t = \\dfrac{${f('d')}}{${f('v1')} + ${f('v2')}} = ${fmtSig(v.d / (v.v1 + v.v2))}\\ \\text{h}` },
      { tex: `t = ${ans}\\ \\text{min}`, note: 'Hours × 60 = minutes.' },
    ],
    mistakes: (v) => [
      { value: (v.d / v.v1) * 60, why: 'Both trains move — use the closing speed, v₁ + v₂.' },
      { value: (v.d / Math.abs(v.v1 - v.v2)) * 60, why: 'They head toward each other, so the speeds add rather than subtract.' },
      { value: v.d / (v.v1 + v.v2), why: 'Right method — but that’s in hours. Convert to minutes.', partial: true },
    ],
    hint: 'When two things move toward each other, their speeds add.',
  },
};

// ——— Sheets ————————————————————————————————————————————————

export type Problem = { n: number; page: number; templateId: string | null; values: Values; supported: boolean; text?: string; reason?: string };
export type Sheet = { id: string; title: string; course: string; fileName: string; pages: number; scannedAt: number; problems: Problem[]; source: 'sample' | 'upload' };

export function sampleSheet(fileName = 'kinematics-ws4.pdf', source: Sheet['source'] = 'sample'): Sheet {
  return {
    id: `sheet-${Date.now().toString(36)}`,
    title: 'Kinematics — Worksheet 4',
    course: 'Physics 1',
    fileName,
    pages: 2,
    scannedAt: Date.now(),
    source,
    problems: [
      { n: 1, page: 1, templateId: 'carAccel', values: { v: 24, t: 6 }, supported: true },
      { n: 2, page: 1, templateId: 'droppedBall', values: { h: 20 }, supported: true },
      { n: 3, page: 1, templateId: 'cyclist', values: { v: 9, t: 4 }, supported: true },
      { n: 4, page: 1, templateId: null, values: {}, supported: false, text: 'Sketch the v–t graph for the car in problem 1.', reason: 'sketch — not supported yet' },
      { n: 5, page: 2, templateId: 'braking', values: { v: 18, a: 6 }, supported: true },
      { n: 6, page: 2, templateId: 'twoTrains', values: { d: 30, v1: 80, v2: 100 }, supported: true },
    ],
  };
}

// ——— Formatting ———————————————————————————————————————————————

export function fmtSig(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(sig));
  const mag = Math.floor(Math.log10(Math.abs(r)));
  return r.toFixed(Math.max(0, sig - 1 - mag));
}

export const withUnit = (value: string, unit: string) => (unit === '°' ? `${value}°` : `${value} ${unit}`);

const decimals = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/** Text segments for a prompt; `changed` marks values that differ from the original problem. */
export function promptParts(t: Template, values: Values, dps: Record<string, number>, changed: boolean) {
  return t.prompt.map((tok) =>
    typeof tok === 'string'
      ? { text: tok, changed: false }
      : { text: withUnit(values[tok.k].toFixed(dps[tok.k] ?? t.params[tok.k].dp), t.params[tok.k].unit), changed },
  );
}

export const originalDps = (t: Template) => Object.fromEntries(Object.entries(t.params).map(([k, p]) => [k, p.dp]));

export function problemText(p: Problem): string {
  if (!p.templateId) return p.text ?? '';
  const t = TEMPLATES[p.templateId];
  return promptParts(t, p.values, originalDps(t), false).map((s) => s.text).join('');
}

// ——— Variants —————————————————————————————————————————————————

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeValues(t: Template, original: Values, diff: Difficulty, rng: () => number) {
  let last = { values: {} as Values, dps: {} as Record<string, number> };
  for (let tries = 0; tries < 32; tries++) {
    const values: Values = {};
    const dps: Record<string, number> = {};
    for (const [k, p] of Object.entries(t.params)) {
      let { min, max, step } = p;
      if (diff === 'easier') step = step < 1 ? Math.min(1, step * 5) : step * 2;
      if (diff === 'harder') { min *= 0.6; max *= 1.5; step /= 2; }
      const first = Math.ceil(min / step) * step;
      const n = Math.max(0, Math.floor((max - first) / step));
      values[k] = Math.round((first + Math.floor(rng() * (n + 1)) * step) * 1e6) / 1e6;
      dps[k] = Math.max(p.dp, decimals(step));
    }
    last = { values, dps };
    const differs = Object.keys(values).every((k) => Math.abs(values[k] - (original[k] ?? NaN)) > 1e-9);
    if (differs && (t.valid ? t.valid(values) : true)) return last;
  }
  return last;
}

export type Question = {
  id: string;
  n: number;
  problemN: number;
  templateId: string;
  values: Values;
  dps: Record<string, number>;
  kind: 'free' | 'choice';
  answer: number;
  choices?: number[];
  correct?: number;
};

function makeChoices(t: Template, values: Values, answer: number, rng: () => number) {
  const far = (a: number, b: number) => Math.abs(a - b) > Math.abs(a) * 0.04;
  const opts = [answer];
  const candidates = [...t.mistakes(values).map((m) => m.value), answer * 2, answer / 2, answer * 1.5, answer * 0.75, answer * 3];
  for (const c of candidates) {
    if (opts.length >= 4) break;
    if (Number.isFinite(c) && c > 0 && opts.every((o) => far(o, c))) opts.push(c);
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { choices: opts, correct: opts.indexOf(answer) };
}

function makeQuestion(p: Problem, i: number, seed: number, diff: Difficulty, rng: () => number, kind: Question['kind']): Question {
  const t = TEMPLATES[p.templateId!];
  const { values, dps } = makeValues(t, p.values, diff, rng);
  const answer = t.answer(values);
  const q: Question = { id: `q${seed.toString(36)}-${i}`, n: i + 1, problemN: p.n, templateId: t.id, values, dps, kind, answer };
  return kind === 'choice' ? { ...q, ...makeChoices(t, values, answer, rng) } : q;
}

export function buildQuestions(problems: Problem[], selected: Record<number, boolean>, count: number, diff: Difficulty, seed: number): Question[] {
  const pool = problems.filter((p) => p.supported && p.templateId && selected[p.n]);
  if (!pool.length) return [];
  const rng = mulberry32(seed);
  // Every third question is multiple choice; the rest are typed.
  return Array.from({ length: count }, (_, i) => makeQuestion(pool[i % pool.length], i, seed, diff, rng, i % 3 === 1 ? 'choice' : 'free'));
}

export function buildFrom(problems: Problem[], seed: number, diff: Difficulty = 'same'): Question[] {
  const rng = mulberry32(seed);
  return problems.map((p, i) => makeQuestion(p, i, seed, diff, rng, 'free'));
}

// ——— Grading ——————————————————————————————————————————————————

export type Result = 'correct' | 'partial' | 'incorrect' | 'skipped';
export type Grade = { result: Result; points: number; feedback: string };
export const POINTS = 4;

export function parseNumber(s: string): number | null {
  const m = s.replace(/[,\s]/g, '').replace(/[×x]10\^?/i, 'e').match(/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i);
  return m ? parseFloat(m[0]) : null;
}

function tolerance(ans: number) {
  const mag = Math.floor(Math.log10(Math.abs(ans) || 1));
  return Math.max(Math.abs(ans) * 0.01, 0.5 * 10 ** (mag - 2));
}

const G_CORRECT: Grade = { result: 'correct', points: POINTS, feedback: 'Correct.' };

export function grade(q: Question, typed: string | undefined, chosen: number | undefined): Grade {
  const t = TEMPLATES[q.templateId];
  const mistakes = t.mistakes(q.values);
  const tol = tolerance(q.answer);
  const matchMistake = (x: number) => mistakes.find((m) => Math.abs(x - m.value) <= Math.max(Math.abs(m.value) * 0.02, tol));

  if (q.kind === 'choice') {
    if (chosen === undefined) return { result: 'skipped', points: 0, feedback: 'Skipped — no choice made.' };
    if (chosen === q.correct) return G_CORRECT;
    const m = matchMistake(q.choices![chosen]);
    return { result: 'incorrect', points: 0, feedback: m?.why ?? 'Not quite — compare your method with the worked solution.' };
  }

  if (!typed || !typed.trim()) return { result: 'skipped', points: 0, feedback: 'Skipped — no answer given.' };
  const x = parseNumber(typed);
  if (x === null) return { result: 'incorrect', points: 0, feedback: 'We couldn’t read a number there. Type just the value — the unit is already filled in.' };
  if (Math.abs(x - q.answer) <= tol) return G_CORRECT;
  const m = matchMistake(x);
  if (m) return { result: m.partial ? 'partial' : 'incorrect', points: m.partial ? POINTS / 2 : 0, feedback: m.why };
  for (const k of [-3, -2, -1, 1, 2, 3]) {
    const scaled = q.answer * 10 ** k;
    if (Math.abs(x - scaled) <= Math.abs(scaled) * 0.01) return { result: 'partial', points: POINTS / 2, feedback: 'Right digits, wrong power of ten — check your units and conversions.' };
  }
  if (Math.abs(x - q.answer) <= Math.abs(q.answer) * 0.03) return { result: 'partial', points: POINTS / 2, feedback: 'Close — carry more digits until the final step, then round.' };
  return { result: 'incorrect', points: 0, feedback: 'Not quite — compare your method with the worked solution.' };
}

export function workedSteps(q: Question): Step[] {
  const t = TEMPLATES[q.templateId];
  const f = (k: string) => q.values[k].toFixed(q.dps[k]);
  return t.steps(f, fmtSig(q.answer), q.values);
}
