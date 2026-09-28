// Authoring helpers for bank templates: compact params, prompts written as plain strings, and shared maths.
// The full guide, with examples of every kind of template, is docs/authoring.md.
import { fmtExact, fmtSig, type Choice, type Derived, type Mistake, type Param, type PromptToken, type Step, type Template, type Tier, type Values } from '../lib/problems';

type Flags = { dp?: number; fixed?: boolean; int?: boolean; nz?: boolean };
/** [min, max, step, unit, flags]. Decimals shown default to the step's decimals. */
export type P = [min: number, max: number, step: number, unit?: string, flags?: Flags];

type Base = {
  id: string;
  concept: string;
  tier: Tier;
  title: string;
  params: Record<string, P>;
  /** "{v}" shows a value with its unit; "$…$" is inline TeX, with values written as \p{v}. Derived keys work in both. */
  prompt: string;
  derive?: (v: Values) => Derived;
  steps: (f: (k: string) => string, ans: string, v: Values) => Step[];
  valid?: (v: Values) => boolean;
  hint: string;
};
/** A numeric answer, typed or chosen from four. */
type NumericSpec = Base & {
  answer: (v: Values) => number;
  unit?: string;
  exact?: boolean;
  tol?: number;
  mistakes: (v: Values) => Mistake[];
  ref: { v: Values; a: number }[];
  pick?: never;
};
/** A worded answer, always chosen from the right option and up to three wrong ones. */
type WordedSpec = Base & {
  pick: (v: Values) => { answer: string; wrong: Choice[] };
  ref: { v: Values; a: string }[];
  answer?: never;
  mistakes?: never;
};

const decimals = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

function parsePrompt(s: string): PromptToken[] {
  const out: PromptToken[] = [];
  const re = /\$([^$]+)\$|\{(\w+)\}/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(m[1] !== undefined ? { tex: m[1] } : { k: m[2] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function tpl(s: NumericSpec | WordedSpec): Template {
  const params: Record<string, Param> = {};
  for (const [k, [min, max, step, unit = '', fl = {}]] of Object.entries(s.params)) {
    params[k] = { min, max, step, unit, dp: fl.dp ?? decimals(step), fixed: fl.fixed, int: fl.int, nz: fl.nz };
  }
  const common = { id: s.id, concept: s.concept, tier: s.tier, title: s.title, params, prompt: parsePrompt(s.prompt), derive: s.derive, steps: s.steps, valid: s.valid, hint: s.hint, ref: s.ref };
  if (s.pick) return { ...common, pick: s.pick, answer: () => 0, unit: '', mistakes: () => [] };
  return { ...common, answer: s.answer, unit: s.unit ?? '', exact: s.exact, tol: s.tol, mistakes: s.mistakes };
}

// ——— Numbers in TeX ————————————————————————————————————————————

export const G = 9.81;
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
/** An intermediate value for a worked step: 3 significant figures, TeX-ready. */
export const n = (x: number) => fmtSig(x, 3, true);
/** Wrap a negative value in parentheses before substituting it into TeX. */
export const par = (s: string) => (s.startsWith('-') ? `(${s})` : s);
/** A unit after a TeX value: `${ans}${u('m/s')}`. */
export const u = (s: string) => `\\ \\text{${s}}`;
/** A maths value in TeX, exactly when it can be: 12, 0.75, \frac{1}{3}, \frac{2\pi}{3}, 3\sqrt{2}; else 4 significant figures. */
export const tn = (x: number) => fmtExact(x, true);
/** " + 3" or " - 3", to append a signed number: `x${sgn(-3)}` → "x - 3". */
export const sgn = (x: number) => (x < 0 ? ` - ${tn(-x)}` : ` + ${tn(x)}`);

/** A signed sum of terms: texSum([[3, 'x^2'], [-1, 'x'], [5, '']]) → "3x^2 - x + 5".
 *  Zero terms drop out, and a coefficient of ±1 is left off unless the term is a bare number. */
export function texSum(terms: [coef: number, body: string][]): string {
  let out = '';
  for (const [c, body] of terms) {
    if (Math.abs(c) < 1e-12) continue;
    const mag = Math.abs(c);
    const term = body && Math.abs(mag - 1) < 1e-12 ? body : `${tn(mag)}${body}`;
    out += out ? (c < 0 ? ` - ${term}` : ` + ${term}`) : c < 0 ? `-${term}` : term;
  }
  return out || '0';
}

/** A polynomial from its coefficients, highest power first: texPoly([1, -5, 6]) → "x^{2} - 5x + 6". */
export const texPoly = (coeffs: number[], x = 'x') =>
  texSum(coeffs.map((c, i): [number, string] => {
    const p = coeffs.length - 1 - i;
    return [c, p === 0 ? '' : p === 1 ? x : `${x}^{${p}}`];
  }));

/** A matrix: \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}. */
export const texMat = (M: number[][]) => `\\begin{bmatrix} ${M.map((r) => r.map(tn).join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
/** A vector in angle brackets: ⟨1, −2, 3⟩. */
export const texVec = (v: number[]) => `\\langle ${v.map(tn).join(', ')} \\rangle`;

// ——— Arithmetic and calculus ————————————————————————————————————

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
export const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
export function nCr(total: number, r: number) {
  if (r < 0 || r > total) return 0;
  let out = 1;
  for (let i = 1; i <= Math.min(r, total - r); i++) out = (out * (total - i + 1)) / i;
  return Math.round(out);
}
export const nPr = (total: number, r: number) => (r < 0 || r > total ? 0 : Math.round(fact(total) / fact(total - r)));
/** Round to `dp` decimal places. */
export const round = (x: number, dp = 0) => Math.round(x * 10 ** dp) / 10 ** dp;

/** ∫ f from a to b by Simpson's rule (n even). */
export function simpson(f: (x: number) => number, a: number, b: number, steps = 2000) {
  const h = (b - a) / steps;
  let s = f(a) + f(b);
  for (let i = 1; i < steps; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** A root of f between a and b, where f changes sign. */
export function bisect(f: (x: number) => number, a: number, b: number) {
  let [lo, hi, flo] = [a, b, f(a)];
  for (let i = 0; i < 200 && hi - lo > 1e-13 * Math.max(1, Math.abs(lo)); i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) [lo, flo] = [mid, fm];
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ——— Probability and statistics ——————————————————————————————————

/** Standard normal cumulative probability P(Z ≤ z), accurate to about 1e-7. */
export function normCdf(z: number) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const erfc =
    t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? 1 - erfc / 2 : erfc / 2;
}

/** The z with P(Z ≤ z) = p. */
export const normInv = (p: number) => bisect((z) => normCdf(z) - p, -10, 10);

function gammaln(x: number) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const k of c) ser += k / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/** Regularized incomplete beta I_x(a, b). */
function betai(a: number, b: number, x: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (a: number, b: number, x: number) => {
    let [c, d] = [1, 1 - ((a + b) * x) / (a + 1)];
    d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d);
    let h = d;
    for (let m = 1; m <= 300; m++) {
      for (const aa of [(m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m)), (-(a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1))]) {
        d = 1 + aa * d;
        d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d);
        c = 1 + aa / c;
        if (Math.abs(c) < 1e-300) c = 1e-300;
        h *= d * c;
      }
      if (Math.abs(d * c - 1) < 1e-14) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? (front * cf(a, b, x)) / a : 1 - (front * cf(b, a, 1 - x)) / b;
}

/** Regularized lower incomplete gamma P(a, x). */
function gammp(a: number, x: number) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let [sum, del, ap] = [1 / a, 1 / a, a];
    for (let k = 0; k < 500 && Math.abs(del) > Math.abs(sum) * 1e-15; k++) sum += del *= x / ++ap;
    return sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
  }
  let [b, c, d] = [x + 1 - a, 1e300, 1 / (x + 1 - a)];
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d);
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    h *= d * c;
    if (Math.abs(d * c - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
}

/** Student's t: P(T ≤ t) with `df` degrees of freedom. */
export function tCdf(t: number, df: number) {
  const tail = betai(df / 2, 0.5, df / (df + t * t)) / 2;
  return t >= 0 ? 1 - tail : tail;
}
/** The t with P(T ≤ t) = p. */
export const tInv = (p: number, df: number) => bisect((t) => tCdf(t, df) - p, -1e3, 1e3);
/** Chi-square: P(X ≤ x) with k degrees of freedom. */
export const chi2Cdf = (x: number, k: number) => gammp(k / 2, x / 2);
export const chi2Inv = (p: number, k: number) => bisect((x) => chi2Cdf(x, k) - p, 0, 1e4);
/** F distribution: P(F ≤ x) with (d1, d2) degrees of freedom. */
export const fCdf = (x: number, d1: number, d2: number) => (x <= 0 ? 0 : betai(d1 / 2, d2 / 2, (d1 * x) / (d1 * x + d2)));
export const fInv = (p: number, d1: number, d2: number) => bisect((x) => fCdf(x, d1, d2) - p, 0, 1e4);

export const binomPmf = (trials: number, k: number, p: number) => nCr(trials, k) * p ** k * (1 - p) ** (trials - k);
export const binomCdf = (trials: number, k: number, p: number) => Array.from({ length: k + 1 }, (_, i) => binomPmf(trials, i, p)).reduce((s, x) => s + x, 0);
export const poissonPmf = (k: number, lam: number) => (Math.exp(-lam) * lam ** k) / fact(k);
export const poissonCdf = (k: number, lam: number) => Array.from({ length: k + 1 }, (_, i) => poissonPmf(i, lam)).reduce((s, x) => s + x, 0);

// ——— Vectors and matrices ———————————————————————————————————————

export const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
export const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: number[]) => Math.hypot(...a);
export const matMul = (A: number[][], B: number[][]) => A.map((row) => B[0].map((_, j) => row.reduce((s, x, k) => s + x * B[k][j], 0)));

/** Determinant by elimination with partial pivoting. */
export function det(M: number[][]) {
  const A = M.map((r) => [...r]);
  const size = A.length;
  let out = 1;
  for (let c = 0; c < size; c++) {
    let p = c;
    for (let r = c + 1; r < size; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return 0;
    if (p !== c) {
      [A[p], A[c]] = [A[c], A[p]];
      out = -out;
    }
    out *= A[c][c];
    for (let r = c + 1; r < size; r++) {
      const k = A[r][c] / A[c][c];
      for (let j = c; j < size; j++) A[r][j] -= k * A[c][j];
    }
  }
  return Math.abs(out) < 1e-9 ? 0 : out;
}

/** Solve A x = b (A square and invertible). */
export function solve(A: number[][], b: number[]) {
  const size = A.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < size; c++) {
    let p = c;
    for (let r = c + 1; r < size; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[p], M[c]] = [M[c], M[p]];
    for (let r = 0; r < size; r++) {
      if (r === c) continue;
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= size; j++) M[r][j] -= k * M[c][j];
    }
  }
  return M.map((r, i) => r[size] / r[i]);
}

// ——— Physical constants (the values students are usually given) ——————————

export const K_E = 8.99e9; // Coulomb constant, N·m²/C²
export const EPS0 = 8.85e-12; // permittivity of free space, C²/(N·m²)
export const MU0 = 4 * Math.PI * 1e-7; // permeability of free space, T·m/A
export const QE = 1.6e-19; // elementary charge, C (also J per eV)
export const ME = 9.11e-31; // electron mass, kg
export const MP = 1.67e-27; // proton mass, kg
export const H_PLANCK = 6.63e-34; // J·s
export const C_LIGHT = 3.0e8; // m/s
export const K_B = 1.38e-23; // Boltzmann, J/K
export const N_A = 6.02e23; // per mol
export const R_GAS = 8.314; // J/(mol·K)
