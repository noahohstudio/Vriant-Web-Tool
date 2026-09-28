// Authoring helpers for bank templates: compact params, prompts written as plain strings.
import { fmtSig, type Mistake, type Param, type PromptToken, type Step, type Template, type Tier, type Values } from '../lib/problems';

type Flags = { dp?: number; fixed?: boolean; int?: boolean; nz?: boolean };
/** [min, max, step, unit, flags]. Decimals shown default to the step's decimals. */
export type P = [min: number, max: number, step: number, unit?: string, flags?: Flags];

type Spec = {
  id: string;
  concept: string;
  tier: Tier;
  title: string;
  params: Record<string, P>;
  /** "{v}" shows a value with its unit; "$…$" is inline TeX, with values written as \p{v}. */
  prompt: string;
  answer: (v: Values) => number;
  unit?: string;
  exact?: boolean;
  steps: (f: (k: string) => string, ans: string, v: Values) => Step[];
  mistakes: (v: Values) => Mistake[];
  valid?: (v: Values) => boolean;
  hint: string;
  ref?: { v: Values; a: number }[];
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

export function tpl(s: Spec): Template {
  const params: Record<string, Param> = {};
  for (const [k, [min, max, step, unit = '', fl = {}]] of Object.entries(s.params)) {
    params[k] = { min, max, step, unit, dp: fl.dp ?? decimals(step), fixed: fl.fixed, int: fl.int, nz: fl.nz };
  }
  return { ...s, unit: s.unit ?? '', params, prompt: parsePrompt(s.prompt) };
}

export const G = 9.81;
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
/** An intermediate value for a worked step: 3 significant figures, TeX-ready. */
export const n = (x: number) => fmtSig(x, 3, true);
/** Wrap a negative value in parentheses before substituting it into TeX. */
export const par = (s: string) => (s.startsWith('-') ? `(${s})` : s);
