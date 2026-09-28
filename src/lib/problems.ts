// Problem engine: templates → variants → grading.
// Answers are always computed from the formula (never "generated"), so grading is exact.
// The templates themselves live in the bank (src/bank), one lazily loaded file per course.
import { getTemplate, templatesFor } from './bank';

export type Difficulty = 'easier' | 'same' | 'harder';
export type Tier = 1 | 2 | 3;
export type Values = Record<string, number>;
/** Values worked out from the drawn ones, for the prompt and steps: a number, or ready-made text/TeX such as "x^2 - 5x + 6". */
export type Derived = Record<string, number | string>;
/** `fixed` ranges ignore difficulty; `int` values stay whole; `nz` values are never 0. */
export type Param = { min: number; max: number; step: number; dp: number; unit: string; fixed?: boolean; int?: boolean; nz?: boolean };
/** Plain text, a value with its unit, or inline TeX (values written as \p{key}). */
export type PromptToken = string | { k: string } | { tex: string };
export type Step = { tex: string; note?: string };
export type Mistake = { value: number; why: string; partial?: boolean };
/** A wrong option in a worded ("which one?") question, with the feedback for choosing it. */
export type Choice = { text: string; why: string };

export type Template = {
  id: string;
  concept: string;
  tier: Tier;
  title: string;
  params: Record<string, Param>;
  prompt: PromptToken[];
  /** The numeric answer. Worded templates (`pick`) don't have one. */
  answer: (v: Values) => number;
  unit: string;
  /** Maths answers: whole numbers stay whole, and fractions, π and roots show exactly (8π/3, not 8.38). */
  exact?: boolean;
  /** Worded questions: the right option and the wrong ones (text, with $…$ for inline TeX). Always multiple choice. */
  pick?: (v: Values) => { answer: string; wrong: Choice[] };
  /** Extra values for the prompt and steps, worked out from the drawn ones. */
  derive?: (v: Values) => Derived;
  /** Relative grading tolerance, when answers depend on table lookups or rounding (0.02 = 2%). */
  tol?: number;
  steps: (f: (k: string) => string, ans: string, v: Values) => Step[];
  mistakes: (v: Values) => Mistake[];
  valid?: (v: Values) => boolean;
  hint: string;
  /** Hand-checked cases; `npm run check:generator` confirms the formula (or `pick`) reproduces them. */
  ref?: { v: Values; a: number | string }[];
};

// ——— Sheets ————————————————————————————————————————————————

/** One problem found on a sheet. `concept` decides what gets practised; `templateId` is set only when the
 *  problem is itself one of the bank's templates (the sample sheet), so its own numbers aren't reused. */
export type Problem = { n: number; page: number; concept: string | null; templateId: string | null; values: Values; supported: boolean; text: string; reason?: string };
export type Sheet = { id: string; title: string; course: string; fileName: string; pages: number; scannedAt: number; problems: Problem[]; source: 'sample' | 'upload' | 'topics' };

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
      { n: 1, page: 1, concept: 'phys1.kin1d.constAccel', templateId: 'phys1.carAccel', values: { v: 24, t: 6 }, supported: true, text: 'A car speeds up from 0 to 24 m/s in 6.0 s. Find its acceleration.' },
      { n: 2, page: 1, concept: 'phys1.kin1d.freeFall', templateId: 'phys1.droppedBall', values: { h: 20 }, supported: true, text: 'A ball is dropped from a 20 m ledge. How long does it take to reach the ground? Use g = 9.81 m/s².' },
      { n: 3, page: 1, concept: 'phys1.kin1d.constAccel', templateId: 'phys1.cyclist', values: { v: 9, t: 4 }, supported: true, text: 'A cyclist accelerates uniformly from rest to 9.0 m/s in 4.0 s. How far does she travel in that time?' },
      { n: 4, page: 1, concept: null, templateId: null, values: {}, supported: false, text: 'Sketch the v–t graph for the car in problem 1.', reason: 'sketch — not supported yet' },
      { n: 5, page: 2, concept: 'phys1.kin1d.constAccel', templateId: 'phys1.braking', values: { v: 18, a: 6 }, supported: true, text: 'A car travelling at 18 m/s brakes with a constant deceleration of 6.0 m/s². How far does it travel before stopping?' },
      { n: 6, page: 2, concept: 'phys1.kin2d.relative', templateId: 'phys1.twoTrains', values: { d: 30, v1: 80, v2: 100 }, supported: true, text: 'Two trains start 30 km apart and head toward each other at 80 km/h and 100 km/h. How many minutes until they meet?' },
    ],
  };
}

export const problemText = (p: Problem) => p.text ?? '';

// ——— Formatting ———————————————————————————————————————————————

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (e: number) => String(e).replace('-', '⁻').replace(/\d/g, (d) => SUP[+d]);

/** Mantissa and exponent for scientific notation, after rounding to `sig` figures. */
function sci(r: number, sig: number) {
  let e = Math.floor(Math.log10(Math.abs(r)));
  let m = (r / 10 ** e).toFixed(sig - 1);
  if (Math.abs(Number(m)) >= 10) {
    e += 1;
    m = (r / 10 ** e).toFixed(sig - 1);
  }
  return { m, e };
}

/** `sig` significant figures; very large or very small values switch to scientific notation. */
export function fmtSig(x: number, sig = 3, tex = false): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(sig));
  const mag = Math.floor(Math.log10(Math.abs(r)));
  if (mag >= 6 || mag <= -4) {
    const { m, e } = sci(r, sig);
    return tex ? `${m} \\times 10^{${e}}` : `${m} × 10${sup(e)}`;
  }
  return r.toFixed(Math.max(0, sig - 1 - mag));
}

const isWhole = (x: number) => Math.abs(x - Math.round(x)) <= 1e-9 * Math.max(1, Math.abs(x));

/** p/q with q ≤ maxDen when x is (to 1e-9) that fraction, found by continued fractions. */
function ratio(x: number, maxDen: number): [number, number] | null {
  const a = Math.abs(x);
  let [h0, h1, k0, k1, v] = [0, 1, 1, 0, a];
  for (let i = 0; i < 24; i++) {
    const n = Math.floor(v);
    const [h2, k2] = [n * h1 + h0, n * k1 + k0];
    if (k2 > maxDen) return null;
    if (Math.abs(h2 / k2 - a) <= 1e-9 * Math.max(1, a)) return [x < 0 ? -h2 : h2, k2];
    [h0, h1, k0, k1] = [h1, h2, k1, k2];
    const r = v - n;
    if (r < 1e-12) return null;
    v = 1 / r;
  }
  return null;
}

type Form = { kind: 'int' | 'dec' | 'frac' | 'pi' | 'root'; text: string; tex: string };
const ROOTS = [2, 3, 5, 6, 7, 10];

/** Trim a 4-significant-figure decimal: 2.500 → 2.5, 5.000 × 10⁻⁵ → 5 × 10⁻⁵. */
function trimDec(x: number, tex: boolean) {
  const s = fmtSig(x, 4, tex);
  if (/[×\\]/.test(s)) return s.replace(/^(-?\d+)\.?(\d*?)0*(?=\s)/, (_, i: string, d: string) => (d ? `${i}.${d}` : i));
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

/** A multiple of a symbol: 2π/3, −π/4, 3√2/2. */
function symbolic(p: number, q: number, sym: string, texSym: string): { text: string; tex: string } {
  const sign = p < 0 ? '-' : '';
  const n = Math.abs(p) === 1 ? '' : String(Math.abs(p));
  return {
    text: `${sign}${n}${sym}${q === 1 ? '' : `/${q}`}`,
    tex: q === 1 ? `${sign}${n}${texSym}` : `${sign}\\frac{${n}${texSym}}{${q}}`,
  };
}

/** How a maths answer reads exactly: whole numbers, short decimals, fractions, then multiples of π or √n. */
export function exactForm(x: number): Form | null {
  if (!Number.isFinite(x)) return null;
  if (isWhole(x) && Math.abs(x) < 1e6) {
    const s = String(Math.round(x) || 0);
    return { kind: 'int', text: s, tex: s };
  }
  // Decimals that end within three places read best as decimals (0.75, 2.35); others as fractions (1/3, 5/7).
  if (isWhole(x * 1000) && Math.abs(x) >= 1e-3) return { kind: 'dec', text: trimDec(x, false), tex: trimDec(x, true) };
  const r = ratio(x, 60);
  if (r) {
    const [p, q] = r;
    return { kind: 'frac', text: `${p}/${q}`, tex: `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}` };
  }
  const pi = ratio(x / Math.PI, 12);
  if (pi) return { kind: 'pi', ...symbolic(pi[0], pi[1], 'π', '\\pi') };
  for (const n of ROOTS) {
    const rt = ratio(x / Math.sqrt(n), 12);
    if (rt) return { kind: 'root', ...symbolic(rt[0], rt[1], `√${n}`, `\\sqrt{${n}}`) };
  }
  return null;
}

/** A maths value, exactly when it can be (see exactForm), else 4 significant figures. */
export const fmtExact = (x: number, tex: boolean) => {
  const f = exactForm(x);
  return f ? (tex ? f.tex : f.text) : trimDec(x, tex);
};

/** How an answer is shown: 3 significant figures for physics; exact forms for maths (8π/3, 1/3, 12). */
export const fmtAnswer = (t: Template, x: number) => (t.exact ? fmtExact(x, false) : fmtSig(x));
export const fmtAnswerTex = (t: Template, x: number) => (t.exact ? fmtExact(x, true) : fmtSig(x, 3, true));
/** "≈ 8.378" beside an exact form that isn't already a plain decimal; empty otherwise. */
export function fmtApprox(t: Template, x: number) {
  const f = t.exact ? exactForm(x) : null;
  return f && (f.kind === 'frac' || f.kind === 'pi' || f.kind === 'root') ? `≈ ${trimDec(x, false)}` : '';
}

/** Multiple-choice options, formatted alike so the right one never stands out: exact forms only when every
 *  option has the same kind of form (all fractions and decimals, or all multiples of π), otherwise decimals. */
function fmtOptions(t: Template, list: number[]): string[] {
  if (!t.exact) return list.map((x) => fmtSig(x));
  const forms = list.map(exactForm);
  const plain = forms.every((f) => f && (f.kind === 'int' || f.kind === 'dec' || f.kind === 'frac'));
  const same = forms.every((f) => f && f.kind === forms[0]!.kind && (f.kind === 'pi' || f.kind === 'root'));
  return plain || same ? forms.map((f) => f!.text) : list.map((x) => trimDec(x, false));
}

/** An option's label, with its unit. Worded options may contain $…$ inline TeX. */
export function choiceText(q: Question, i: number): string {
  if (q.kind === 'text') return q.options?.[i] ?? '';
  const t = getTemplate(q.templateId);
  return withUnit(fmtOptions(t, q.choices ?? [])[i] ?? '', t.unit);
}

export const withUnit = (value: string, unit: string) => (!unit ? value : unit === '°' || unit === '%' ? `${value}${unit}` : `${value} ${unit}`);

const decimals = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

export type PromptPart = { text: string; changed: boolean } | { tex: string; changed: false };

/** Formats `{k}` / `\p{k}` values: drawn values to their decimals, derived numbers exactly, derived text as written. */
function valueFormatter(t: Template, values: Values, dps: Record<string, number>, tex: boolean) {
  const derived = t.derive?.(values) ?? {};
  return (k: string): { s: string; drawn: boolean; text: boolean } => {
    if (k in t.params) return { s: values[k].toFixed(dps[k] ?? t.params[k].dp), drawn: true, text: false };
    const d = derived[k];
    if (typeof d === 'number') return { s: fmtExact(d, tex), drawn: false, text: false };
    return { s: d ?? `\\p{${k}}`, drawn: false, text: true };
  };
}

/** Prompt segments; `changed` marks values that differ from the original problem. Derived text is never marked. */
export function promptParts(t: Template, values: Values, dps: Record<string, number>, changed: boolean): PromptPart[] {
  const plain = valueFormatter(t, values, dps, false);
  const tex = valueFormatter(t, values, dps, true);
  return t.prompt.map((tok) => {
    if (typeof tok === 'string') return { text: tok, changed: false };
    if ('k' in tok) {
      const v = plain(tok.k);
      return { text: v.drawn ? withUnit(v.s, t.params[tok.k].unit) : v.s, changed: changed && !v.text };
    }
    return {
      tex: tok.tex.replace(/\\p\{(\w+)\}/g, (_, k: string) => {
        const v = tex(k);
        return changed && !v.text ? `\\htmlClass{v}{${v.s}}` : v.s;
      }),
      changed: false,
    };
  });
}

/** Text with $…$ inline TeX, split into parts (worded options). */
export function richParts(s: string): ({ text: string } | { tex: string })[] {
  return s
    .split(/(\$[^$]+\$)/)
    .filter(Boolean)
    .map((p) => (p.length > 2 && p.startsWith('$') && p.endsWith('$') ? { tex: p.slice(1, -1) } : { text: p }));
}

/** A template's prompt as plain text with the given values (used for sheets saved before problems carried text). */
export function promptText(t: Template, values: Values) {
  const dps = Object.fromEntries(Object.entries(t.params).map(([k, p]) => [k, p.dp]));
  return promptParts(t, values, dps, false)
    .map((p) => ('tex' in p ? p.tex : p.text))
    .join('');
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

function shuffle<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** True when a common mistake lands so close to the answer that grading couldn't tell them apart
 *  (for worded questions: when the options aren't distinct). */
export function isAmbiguous(t: Template, values: Values) {
  if (t.pick) {
    const { answer, wrong } = t.pick(values);
    const texts = wrong.map((w) => w.text);
    return !answer || !wrong.length || texts.includes(answer) || new Set(texts).size < texts.length;
  }
  const a = t.answer(values);
  if (!Number.isFinite(a)) return true;
  return t.mistakes(values).some((m) => Number.isFinite(m.value) && Math.abs(m.value - a) <= Math.max(Math.abs(a) * 0.05, 1e-9));
}

function makeValues(t: Template, original: Values, diff: Difficulty, rng: () => number) {
  let last = { values: {} as Values, dps: {} as Record<string, number> };
  for (let tries = 0; tries < 60; tries++) {
    const values: Values = {};
    const dps: Record<string, number> = {};
    for (const [k, p] of Object.entries(t.params)) {
      let { min, max, step } = p;
      if (!p.fixed && diff === 'easier') step = p.int ? step * 2 : step < 1 ? Math.min(1, step * 5) : step * 2;
      if (!p.fixed && diff === 'harder') {
        if (min >= 0) {
          min *= 0.6;
          max *= 1.5;
        } else {
          const pad = (max - min) * 0.25;
          min -= pad;
          max += pad;
        }
        step = p.int ? Math.max(1, Math.round(step / 2)) : step / 2;
      }
      const first = Math.ceil(min / step - 1e-9) * step;
      const n = Math.max(0, Math.floor((max - first) / step + 1e-9));
      const x = round6(first + Math.floor(rng() * (n + 1)) * step);
      values[k] = x;
      // Show as many decimals as the value needs (never fewer than the template's), so "10.50" stays "10.5".
      dps[k] = Math.max(p.dp, Math.min(decimals(step), decimals(x)));
    }
    last = { values, dps };
    const nonzero = Object.entries(t.params).every(([k, p]) => !p.nz || values[k] !== 0);
    const differs = Object.keys(values).every((k) => !(k in original) || Math.abs(values[k] - original[k]) > 1e-9);
    if (nonzero && differs && (!t.valid || t.valid(values)) && !isAmbiguous(t, values)) return last;
  }
  return last;
}

/** `free`: type a number · `choice`: pick one of four numbers · `text`: pick a worded option (always, for `pick` templates). */
export type Question = {
  id: string;
  n: number;
  problemN: number;
  templateId: string;
  values: Values;
  dps: Record<string, number>;
  kind: 'free' | 'choice' | 'text';
  /** The numeric answer (0 for worded questions). */
  answer: number;
  choices?: number[];
  /** Worded options, for `text` questions. */
  options?: string[];
  correct?: number;
};

/** Four options: the answer, the template's common mistakes, then simple scalings. Options are kept at least 4% apart. */
function makeChoices(t: Template, values: Values, answer: number, rng: () => number) {
  const far = (a: number, b: number) => Math.abs(a - b) > Math.max(Math.abs(a), Math.abs(b)) * 0.04 && Math.abs(a - b) > 1e-9;
  // Physical sizes stay positive; maths answers may take either sign.
  const plausible = (c: number) => Number.isFinite(c) && (t.exact || answer <= 0 || c > 0);
  const opts = [answer];
  const scaled = answer === 0 ? [1, -1, 2, 0.5] : [answer * 2, answer / 2, answer * 1.5, answer * 0.75, answer * 3];
  const whole = t.exact && Number.isInteger(Math.round(answer * 1e9) / 1e9) ? [answer + 1, answer - 1, answer + 2] : [];
  const candidates = [...t.mistakes(values).map((m) => m.value), ...(t.exact ? [-answer] : []), ...whole, ...scaled];
  for (const c of candidates) {
    if (opts.length >= 4) break;
    if (plausible(c) && opts.every((o) => far(o, c))) opts.push(c);
  }
  for (let k = 5; opts.length < 4; k++) opts.push(answer === 0 ? k : answer * (1 + k * 0.25));
  const order = shuffle(opts, rng);
  return { choices: order, correct: order.indexOf(answer) };
}

/** A worded question: the right option and up to three wrong ones, in a random order. */
function makeOptions(t: Template, values: Values, rng: () => number) {
  const { answer, wrong } = t.pick!(values);
  const options = shuffle([answer, ...shuffle(wrong, rng).slice(0, 3).map((w) => w.text)], rng);
  return { options, correct: options.indexOf(answer) };
}

function makeQuestion(t: Template, problemN: number, i: number, seed: number, diff: Difficulty, rng: () => number, kind: Question['kind'], original: Values): Question {
  const { values, dps } = makeValues(t, original, diff, rng);
  const id = `q${seed.toString(36)}-${i}`;
  if (t.pick) return { id, n: i + 1, problemN, templateId: t.id, values, dps, kind: 'text', answer: 0, ...makeOptions(t, values, rng) };
  const answer = t.answer(values);
  const q: Question = { id, n: i + 1, problemN, templateId: t.id, values, dps, kind: kind === 'text' ? 'choice' : kind, answer };
  return q.kind === 'choice' ? { ...q, ...makeChoices(t, values, answer, rng) } : q;
}

/** Something to practise: a problem's concept (problemN 0 when a concept was picked without a sheet). */
export type Slot = { problemN: number; concept: string; templateId?: string | null; values?: Values };

const PREFER: Record<Difficulty, Tier[]> = { easier: [1, 2, 3], same: [2, 1, 3], harder: [3, 2, 1] };

/** A template for the concept, favouring the chosen difficulty's tier and avoiding an immediate repeat. */
function pickTemplate(concept: string, diff: Difficulty, rng: () => number, last: Map<string, string>) {
  const all = templatesFor(concept);
  const pool = all.length > 1 ? all.filter((t) => t.id !== last.get(concept)) : all;
  const [first, second] = PREFER[diff];
  const weight = (t: Template) => (t.tier === first ? 4 : t.tier === second ? 1.5 : 0.5);
  let r = rng() * pool.reduce((s, t) => s + weight(t), 0);
  for (const t of pool) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return pool[pool.length - 1];
}

export function buildQuestions(slots: Slot[], count: number, diff: Difficulty, seed: number): Question[] {
  const usable = slots.filter((s) => templatesFor(s.concept).length);
  if (!usable.length) return [];
  const rng = mulberry32(seed);
  // About one question in three is multiple choice, placed at random.
  const kinds = shuffle(Array.from({ length: count }, (_, i): Question['kind'] => (i % 3 === 1 ? 'choice' : 'free')), rng);
  const last = new Map<string, string>();
  let round: Slot[] = [];
  return Array.from({ length: count }, (_, i) => {
    // Each round visits every selected problem once, in a fresh order.
    if (!round.length) round = shuffle(usable, rng);
    const slot = round.shift()!;
    const t = pickTemplate(slot.concept, diff, rng, last);
    last.set(slot.concept, t.id);
    return makeQuestion(t, slot.problemN, i, seed, diff, rng, kinds[i], t.id === slot.templateId ? (slot.values ?? {}) : {});
  });
}

/** One question from a specific template, for `npm run check:generator` and console debugging. */
export const sampleQuestion = (t: Template, seed: number, diff: Difficulty, kind: Question['kind']) => makeQuestion(t, 0, 0, seed, diff, mulberry32(seed), kind, {});

/** New numbers for the same templates (Try a similar one, Practice these again). */
export function buildFrom(items: { templateId: string; problemN: number }[], seed: number, diff: Difficulty = 'same'): Question[] {
  const rng = mulberry32(seed);
  return items.map((it, i) => makeQuestion(getTemplate(it.templateId), it.problemN, i, seed, diff, rng, 'free', {}));
}

// ——— Grading ——————————————————————————————————————————————————

export type Result = 'correct' | 'partial' | 'incorrect' | 'skipped';
export type Grade = { result: Result; points: number; feedback: string };
export const POINTS = 4;

/** Reads the answer a student typed: a number, or simple arithmetic (27/5.5, 3×10^8, π/4, 2√3).
 *  Anything after the value, such as a unit, is ignored. Nothing is ever passed to eval. */
export function parseNumber(raw: string): number | null {
  const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  let s = raw
    .trim()
    .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${m.replace('⁻', '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String(SUPS.indexOf(d)))}`)
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '');
  s = /^-?\d+,\d{1,2}(?!\d)/.test(s) && !/^-?\d+,\d{3}/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  s = s.replace(/(\d)[xX](?=10\^)/g, '$1*').replace(/pi/gi, 'π').replace(/sqrt/gi, '√');
  let i = 0;
  const peek = () => s[i];
  const num = (): number | null => {
    const m = /^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const primary = (): number | null => {
    const c = peek();
    if (c === '(') {
      i++;
      const v = expr();
      if (peek() === ')') i++;
      return v;
    }
    if (c === 'π') {
      i++;
      return Math.PI;
    }
    if (c === '√') {
      i++;
      const v = power();
      return v === null ? null : Math.sqrt(v);
    }
    if (c === 'e' && !/\d/.test(s[i + 1] ?? '')) {
      i++;
      return Math.E;
    }
    return num();
  };
  const power = (): number | null => {
    const base = primary();
    if (base === null) return null;
    if (peek() === '^') {
      i++;
      const e = unary();
      return e === null ? base : base ** e;
    }
    return base;
  };
  const unary = (): number | null => {
    if (peek() === '-' || peek() === '+') {
      const neg = s[i++] === '-';
      const v = unary();
      return v === null ? null : neg ? -v : v;
    }
    return power();
  };
  const term = (): number | null => {
    let v = unary();
    if (v === null) return null;
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') {
        const at = i++;
        const r = unary();
        if (r === null) {
          i = at;
          break;
        }
        v = c === '*' ? v * r : v / r;
      } else if (c === '(' || c === 'π' || c === '√') {
        // Implicit multiplication: 2π, 3√2, 2(4).
        const r = power();
        if (r === null) break;
        v *= r;
      } else break;
    }
    return v;
  };
  function expr(): number | null {
    let v = term();
    if (v === null) return null;
    while (peek() === '+' || peek() === '-') {
      const at = i;
      const neg = s[i++] === '-';
      const r = term();
      if (r === null) {
        i = at;
        break;
      }
      v = neg ? v - r : v + r;
    }
    return v;
  }
  const v = expr();
  return v === null || !Number.isFinite(v) ? null : v;
}

/** How close counts as right. Physics: 1%, or half a unit in the 3rd significant figure. Maths (`exact`): whole
 *  answers must be exact; others to 3 significant figures. A template's `tol` widens either. */
function tolerance(t: Template, ans: number) {
  const mag = Math.floor(Math.log10(Math.abs(ans) || 1));
  const sig3 = 0.5 * 10 ** (mag - 2);
  const base = t.exact ? (isWhole(ans) ? 1e-9 * Math.max(1, Math.abs(ans)) : sig3) : Math.max(Math.abs(ans) * 0.01, sig3);
  return t.tol ? Math.max(base, Math.abs(ans) * t.tol) : base;
}

const G_CORRECT: Grade = { result: 'correct', points: POINTS, feedback: 'Correct.' };

export function grade(q: Question, typed: string | undefined, chosen: number | undefined): Grade {
  const t = getTemplate(q.templateId);
  if (q.kind === 'text') {
    if (chosen === undefined) return { result: 'skipped', points: 0, feedback: 'Skipped — no choice made.' };
    if (chosen === q.correct) return G_CORRECT;
    const w = t.pick?.(q.values).wrong.find((x) => x.text === q.options?.[chosen]);
    return { result: 'incorrect', points: 0, feedback: w?.why ?? 'Not quite — compare your reasoning with the worked solution.' };
  }
  const mistakes = t.mistakes(q.values);
  const tol = tolerance(t, q.answer);
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
  if (q.answer !== 0 && Math.abs(x + q.answer) <= tol) return { result: 'incorrect', points: 0, feedback: 'Right size, wrong sign — check which way it points, or which quantity is larger.' };
  for (const k of [-3, -2, -1, 1, 2, 3]) {
    const scaled = q.answer * 10 ** k;
    if (Math.abs(x - scaled) <= Math.abs(scaled) * 0.01) return { result: 'partial', points: POINTS / 2, feedback: 'Right digits, wrong power of ten — check your units and conversions.' };
  }
  // Rounding is only a near miss when the answer isn't a whole number that should be exact.
  const exactWhole = t.exact && isWhole(q.answer);
  if (!exactWhole && Math.abs(x - q.answer) <= Math.abs(q.answer) * 0.03) return { result: 'partial', points: POINTS / 2, feedback: 'Close — carry more digits until the final step, then round.' };
  return { result: 'incorrect', points: 0, feedback: 'Not quite — compare your method with the worked solution.' };
}

export function workedSteps(q: Question): Step[] {
  const t = getTemplate(q.templateId);
  const fmt = valueFormatter(t, q.values, q.dps, true);
  const f = (k: string) => fmt(k).s;
  const ans = q.kind === 'text' ? (q.options?.[q.correct ?? 0] ?? '') : fmtAnswerTex(t, q.answer);
  return t.steps(f, ans, q.values);
}
