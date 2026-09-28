// Reading a sheet's text: split it into problems, then match each problem to a concept in the map.
// Pure functions with no DOM, so `npm run check:detect` can test them against sample sheets.
// Matching uses each concept's keywords (taxonomy.ts), weighted by how distinctive they are,
// plus what the sheet's header says about the course and what the other problems are about.
import { CONCEPTS, COURSES, type Concept } from '../bank/taxonomy';
import { BANK_COURSES, ensureCourse, templatesFor } from './bank';
import type { Problem, Sheet } from './problems';
import { isReady } from './topics';

export type Confidence = 'strong' | 'weak' | 'none';
export type Match = { concept: Concept | null; candidates: Concept[]; confidence: Confidence; score: number };

// ——— Normalizing text ————————————————————————————————————————————

const SUPS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };

/** Lowercase, one spelling for each symbol: x² → x^2, -> → →, sqrt → √, pi → π, μ (micro) → μ. */
export function norm(s: string): string {
  return s
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^${[...m].map((c) => SUPS[c]).join('')}`)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[−–—]/g, '-')
    .replace(/\s*->\s*|\s*→\s*/g, '→')
    .replace(/\bsqrt\b/g, '√')
    .replace(/\bpi\b/g, 'π')
    .replace(/\bint\b/g, '∫')
    .replace(/\binfinity\b/g, '∞')
    .replace(/\s+/g, ' ')
    .trim();
}

// ——— Keyword index ——————————————————————————————————————————————

type Kw = { kw: string; re: RegExp | null; weight: number };
let INDEX: { concept: Concept; kws: Kw[]; name: string }[] | null = null;

/** Words that turn up in problems about almost anything; they count for less wherever a concept lists them. */
const GENERIC = new Set(['velocity', 'speed', 'accelerat', 'acceleration', 'force', 'mass', 'energy', 'time', 'distance', 'angle', 'height', 'length', 'find', 'solve', 'rate', 'area', 'volume', 'value', 'function', 'graph', 'slope', 'equation', 'm/s', 'm/s^2', 'kg', 'how fast', 'how far', 'magnitude', 'vector', 'final speed', 'final velocity', 'from rest', 'at rest']);

/** Plain words match from a word's start ("elastic" won't match "inelastic", "accelerat" still matches
 *  "acceleration"); very short words must match whole ("ln" shouldn't match "kiln"). Symbols match anywhere. */
function matcher(kw: string): RegExp | null {
  if (!/^[a-z0-9]/.test(kw)) return null;
  const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const whole = /^[a-z0-9]+$/.test(kw) && kw.length <= 4;
  return new RegExp(`(^|[^a-z0-9])${esc}${whole ? '($|[^a-z0-9])' : ''}`);
}

function index() {
  if (INDEX) return INDEX;
  const df = new Map<string, number>();
  const lists = [...CONCEPTS.values()].map((c) => ({ c, kws: [...new Set(c.kw.map(norm).filter((k) => k.length > 1))] }));
  for (const { kws } of lists) for (const k of kws) df.set(k, (df.get(k) ?? 0) + 1);
  INDEX = lists.map(({ c, kws }) => ({
    concept: c,
    name: norm(c.name.replace(/\s*\(.*?\)\s*/g, ' ')),
    kws: kws.map((kw) => {
      const base = kw.includes(' ') ? 2 : kw.length >= 7 ? 1.3 : kw.length >= 4 ? 1 : 0.7;
      return { kw, re: matcher(kw), weight: (base * (GENERIC.has(kw) ? 0.5 : 1)) / Math.sqrt(df.get(kw) ?? 1) };
    }),
  }));
  return INDEX;
}

/** Cues in a sheet's header (or a whole problem) that name a course. Codes come from the concept map. */
const COURSE_CUES: Record<string, string[]> = {
  phys1: ['physics i', 'physics 1', 'phys 1', 'mechanics', 'ph 112', 'ph112', 'phys 211', 'phys 2211', '8.01'],
  phys2: ['physics ii', 'physics 2', 'phys 2', 'electricity', 'magnetism', 'e&m', 'electromagnet', 'ph 213', 'ph213', 'phys 212', '8.02'],
  phys3: ['physics iii', 'physics 3', 'optics', 'modern physics', 'ph 214', 'ph214'],
  calc1: ['calculus i', 'calculus 1', 'calc i', 'calc 1', 'ma 111', 'ma111', 'math 1a', 'differential calculus'],
  calc2: ['calculus ii', 'calculus 2', 'calc ii', 'calc 2', 'ma 113', 'ma113', 'math 1b', 'integral calculus'],
  linalg: ['linear algebra', 'ma 110', 'ma110', 'matrices'],
  stats: ['statistics', 'probability', 'ma 224', 'stat ', 'stats'],
  diffeq: ['differential equations', 'ma 240', 'ma240', 'ode'],
  vcalc: ['vector calculus', 'multivariable', 'calculus iii', 'calc iii', 'ma 223', 'ma 225'],
  statics: ['statics', 'strength of materials', 'mechanics of materials', 'me 103', 'esc 201', 'structures'],
  precalc: ['precalculus', 'pre-calculus', 'college algebra', 'trigonometry'],
};

/** How strongly a piece of text points at each course (header cues). */
export function courseCues(text: string): Map<string, number> {
  const t = ` ${norm(text)} `;
  const out = new Map<string, number>();
  for (const c of COURSES) {
    const cues = [...(COURSE_CUES[c.id] ?? []), norm(c.code)].filter((x) => x.length > 2);
    const hits = cues.filter((cue) => t.includes(cue)).length;
    if (hits) out.set(c.id, hits);
  }
  return out;
}

const ASK_START = /^(find|what|how|determine|calculate|compute|evaluate|estimate|show|use|give|express|locate|at what|which|is|does|will)\b/;

/** The question itself, usually the last sentence: its keywords say most about what's being practiced. */
function askOf(t: string) {
  const sentences = t.split(/(?<=[.?!])\s+(?=[a-z(])/).filter((x) => x.length > 3);
  if (sentences.length < 2) return '';
  const asks = sentences.filter((x) => x.includes('?') || ASK_START.test(x));
  return asks.length ? asks.join(' ') : sentences[sentences.length - 1];
}

/** Raw keyword scores for one problem: concept id → score. A concept gains a little from others in its unit that
 *  also match, since a problem about collisions tends to mention several collision ideas. */
export function scoreText(text: string): Map<string, number> {
  const t = norm(text);
  const ask = askOf(t);
  const own = new Map<string, number>();
  for (const { concept, kws, name } of index()) {
    let s = 0;
    let hits = 0;
    for (const k of kws) {
      const hit = (x: string) => (k.re ? k.re.test(x) : x.includes(k.kw));
      if (hit(t)) {
        s += k.weight * (ask && hit(ask) ? 1.4 : 1);
        hits++;
      }
    }
    if (name.length > 6 && t.includes(name)) s += 3;
    if (hits >= 2) s += 0.4 * (hits - 1);
    if (s > 0) own.set(concept.id, s);
  }
  const unit = new Map<string, number>();
  for (const [id, s] of own) {
    const u = CONCEPTS.get(id)!.unit.id;
    unit.set(u, (unit.get(u) ?? 0) + s);
  }
  const out = new Map<string, number>();
  for (const [id, s] of own) out.set(id, s + 0.25 * ((unit.get(CONCEPTS.get(id)!.unit.id) ?? s) - s));
  return out;
}

// ——— Similarity to the bank's own problems ————————————————————————————
// Keywords miss wordings nobody thought of. The bank's templates (titles, prompts, hints) are a few hundred
// problems already sorted by concept, so a problem is also compared, word by word (TF-IDF, cosine), with each
// concept's templates. Concepts without templates yet are described by their name and keywords.

const STOP = new Set('the a an of to in on at by for with from and or is are was be its it this that what how find his her their than then as into onto if when which who does do use using given has have had will would can your you we our each per after before about between above below over under'.split(' '));
const stem = (w: string) => w.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '');
const words = (t: string) => (t.toLowerCase().normalize('NFKC').replace(/\\[a-z]+/g, ' ').match(/[a-zμ]{3,}/g) ?? []).filter((w) => !STOP.has(w)).map(stem);
type Vec = { v: Map<string, number>; n: number; size: number };
let SIM: { df: Map<string, number>; size: number; concepts: Map<string, Vec> } | null = null;

function vectorize(ws: string[], df: Map<string, number>, size: number): Vec {
  const tf = new Map<string, number>();
  for (const w of ws) tf.set(w, (tf.get(w) ?? 0) + 1);
  const v = new Map<string, number>();
  let n2 = 0;
  for (const [w, f] of tf) {
    const x = (1 + Math.log(f)) * Math.log(1 + size / (df.get(w) ?? size));
    v.set(w, x);
    n2 += x * x;
  }
  return { v, n: Math.sqrt(n2) || 1, size: ws.length };
}

/** Load every course's templates and index them. Call before detecting (it's quick once the files are cached). */
export async function prepare() {
  if (SIM) return;
  await Promise.all(BANK_COURSES.map((c) => ensureCourse(c).catch(() => undefined)));
  const docs = new Map<string, string[]>();
  for (const c of CONCEPTS.values()) {
    const parts = [c.name, c.name, c.unit.name, c.kw.join(' ')];
    for (const t of templatesFor(c.id)) parts.push(t.title, t.prompt.map((x) => (typeof x === 'string' ? x : 'tex' in x ? x.tex : '')).join(' '), t.hint);
    docs.set(c.id, words(parts.join(' ')));
  }
  const df = new Map<string, number>();
  for (const ws of docs.values()) for (const w of new Set(ws)) df.set(w, (df.get(w) ?? 0) + 1);
  const size = docs.size;
  SIM = { df, size, concepts: new Map([...docs].map(([id, ws]) => [id, vectorize(ws, df, size)])) };
}

/** Cosine similarity of a problem to each concept's templates (empty until prepare() has run). */
function similarity(text: string): Map<string, number> {
  const out = new Map<string, number>();
  if (!SIM) return out;
  const q = vectorize(words(text), SIM.df, SIM.size);
  for (const [id, c] of SIM.concepts) {
    let s = 0;
    for (const [w, x] of q.v) {
      const y = c.v.get(w);
      if (y) s += x * y;
    }
    // A concept described by a handful of words (no templates yet) matches too easily on one shared word: trust it less.
    if (s > 0) out.set(id, (s / (q.n * c.n)) * Math.min(1, c.size / 60));
  }
  return out;
}

const SIM_WEIGHT = 12;
const STRONG = 4;
const WEAK = 2.6;

/** The best concept for one problem, given optional course weights from the rest of the sheet. */
export function matchProblem(text: string, courseBoost: Map<string, number> = new Map()): Match {
  const raw = scoreText(text);
  for (const [id, x] of similarity(text)) raw.set(id, (raw.get(id) ?? 0) + SIM_WEIGHT * x);
  const ranked = [...raw.entries()]
    .map(([id, s]) => {
      const c = CONCEPTS.get(id)!;
      return { c, s: s * (courseBoost.get(c.course.id) ?? 1) };
    })
    .sort((a, b) => b.s - a.s || Number(isReady(b.c)) - Number(isReady(a.c)));
  const top = ranked[0];
  if (!top) return { concept: null, candidates: [], confidence: 'none', score: 0 };
  const second = ranked.find((r) => r.c.id !== top.c.id)?.s ?? 0;
  const confidence: Confidence = top.s >= STRONG && (top.s - second >= 0.8 || top.s >= 1.8 * second) ? 'strong' : top.s >= WEAK ? 'weak' : 'none';
  const candidates = ranked.filter((r) => r.s >= Math.max(1, top.s * 0.4)).slice(0, 4).map((r) => r.c);
  return { concept: confidence === 'none' ? null : top.c, candidates, confidence, score: top.s };
}

// ——— Splitting a sheet into problems ————————————————————————————————

export type Piece = { n: number; page: number; text: string };

/** "1.", "2)", "(3)", "Problem 4", "Q5", "Exercise 6:" at the start of a line. Parts like "(a)" stay inside. */
const START = [
  /^(?:problem|question|exercise|prob\.?|q)\s*#?\s*(\d{1,2})\b\s*[.:)\-–]?\s*(.*)$/i,
  /^(\d{1,2})\s*[.)]\s+(.+)$/,
  /^\((\d{1,2})\)\s*(.+)$/,
  /^(\d{1,2})\s*[.)]$/,
];

function problemStart(line: string): { n: number; rest: string } | null {
  for (const re of START) {
    const m = re.exec(line);
    if (m) return { n: Number(m[1]), rest: (m[2] ?? '').trim() };
  }
  return null;
}

const NOISE = /^(name|date|section|instructor|professor|due|score|total|page \d+|\d+\s*\/\s*\d+|[-_=.\s]+)[:\s_]*$/i;

/** Problems from page texts. Numbered problems when the sheet numbers them; otherwise one per paragraph. */
export function splitProblems(pages: string[]): { header: string[]; problems: Piece[] } {
  const header: string[] = [];
  const problems: Piece[] = [];
  let cur: Piece | null = null;
  let expected = 1;
  pages.forEach((page, pi) => {
    for (const rawLine of page.split(/\r?\n/)) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) {
        if (cur) cur.text += '\n';
        continue;
      }
      const st = problemStart(line);
      // Numbers must run in order (a small gap is fine) so "2. Use g = 9.8" mid-problem can't split it.
      if (st && st.n >= expected && st.n <= expected + 3 && (st.rest || st.n === expected)) {
        cur = { n: st.n, page: pi + 1, text: st.rest };
        problems.push(cur);
        expected = st.n + 1;
      } else if (cur) {
        const part = /^\(?[a-h]\)\s/.test(line) || /^[a-h][.)]\s/.test(line);
        // A word hyphenated across lines ("coeffi-" / "cient") joins back up.
        if (!part && /[a-z]-$/.test(cur.text) && /^[a-z]/.test(line)) cur.text = cur.text.slice(0, -1) + line;
        else cur.text += part ? `\n${line}` : cur.text && !cur.text.endsWith('\n') ? ` ${line}` : line;
      } else if (!NOISE.test(line)) header.push(line);
    }
  });
  const clean = (p: Piece) => ({ ...p, text: p.text.replace(/\n{2,}/g, '\n').replace(/[ \t]+\n/g, '\n').trim() });
  const numbered = problems.map(clean).filter((p) => p.text.length >= 8);
  if (numbered.length) return { header, problems: numbered.slice(0, 40) };

  // No numbering: treat each paragraph that asks something as a problem.
  const paras: Piece[] = [];
  pages.forEach((page, pi) => {
    for (const block of page.split(/\n\s*\n/)) {
      const text = block.replace(/\s*\n\s*/g, ' ').trim();
      if (text.length >= 20 && ASKS.test(text)) paras.push({ n: paras.length + 1, page: pi + 1, text });
    }
  });
  if (paras.length) return { header: header.slice(0, 3), problems: paras.slice(0, 40) };
  const all = pages.join('\n').replace(/\s+/g, ' ').trim();
  return { header: [], problems: all.length >= 12 ? [{ n: 1, page: 1, text: all }] : [] };
}

const ASKS = /\?|\b(find|calculate|compute|determine|evaluate|solve|what|how (far|fast|long|much|many|high)|estimate|show that|prove|sketch|use)\b/i;
const SKETCH = /^(?:\(?[a-z]\)\s*)?(sketch|draw|graph|plot|label|shade)\b/i;
const PROOF = /\b(prove|show that|verify that|explain (why|how)|in your own words|justify|discuss)\b/i;
const NUMERIC_ASK = /\b(find|calculate|compute|determine|evaluate|solve|what is|what are|how (far|fast|long|much|many|high)|estimate)\b/i;

/** Problems we can't practice yet, by what they ask for. */
function unsupportedReason(text: string): string | null {
  if (SKETCH.test(text.trim())) return 'sketch — not supported yet';
  if (PROOF.test(text) && !NUMERIC_ASK.test(text)) return 'proof or explanation — not supported yet';
  return null;
}

// ——— A whole sheet ————————————————————————————————————————————————

const TITLE_CUE = /\b(homework|hw|problem set|pset|worksheet|quiz|exam|midterm|final|assignment|recitation|review|practice|lab|chapter|unit)\b/i;

function titleFrom(header: string[], fileName: string) {
  const line = header.find((l) => TITLE_CUE.test(l) && l.length <= 90) ?? header.find((l) => l.length >= 4 && l.length <= 70 && !/^(name|date)\b/i.test(l));
  if (line) return line.replace(/\s+/g, ' ').slice(0, 64);
  return fileName.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'Your sheet';
}

/** Detect every problem on a sheet. `pages` are the page texts; `fileName` gives a fallback title. */
export function detectSheet(pages: string[], fileName: string, via: NonNullable<Sheet['via']>): Sheet {
  const { header, problems } = splitProblems(pages);
  const cues = courseCues(header.join(' \n'));
  // First pass: each problem alone. Then favour the course most of the sheet is about.
  const first = problems.map((p) => matchProblem(p.text));
  const weight = new Map<string, number>();
  for (const m of first) if (m.concept) weight.set(m.concept.course.id, (weight.get(m.concept.course.id) ?? 0) + (m.confidence === 'strong' ? 2 : 1));
  for (const [id, hits] of cues) weight.set(id, (weight.get(id) ?? 0) + 3 * hits);
  const total = [...weight.values()].reduce((s, x) => s + x, 0);
  const boost = new Map([...weight.entries()].map(([id, w]) => [id, 1 + 0.6 * (w / Math.max(total, 1))]));
  const matches = problems.map((p) => matchProblem(p.text, boost));

  const dominant = [...weight.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const course = COURSES.find((c) => c.id === dominant);
  const out: Problem[] = problems.map((p, i) => {
    const m = matches[i];
    const reason = unsupportedReason(p.text);
    const c = m.concept;
    return {
      n: p.n,
      page: p.page,
      concept: c?.id ?? null,
      templateId: null,
      values: {},
      text: p.text,
      candidates: m.candidates.map((x) => x.id),
      confidence: m.confidence,
      supported: !reason && !!c && isReady(c),
      reason: reason ?? (!c ? 'topic not recognized' : !isReady(c) ? 'not in Vriant yet' : undefined),
    };
  });
  return {
    id: `sheet-${Date.now().toString(36)}`,
    title: titleFrom(header, fileName),
    course: course?.name ?? 'Unsorted',
    fileName,
    pages: Math.max(1, pages.length),
    scannedAt: Date.now(),
    source: 'upload',
    via,
    problems: out,
  };
}
