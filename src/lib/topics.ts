// Finding concepts by name, and being honest about coverage: which concepts have practice problems yet,
// and which ready concepts sit closest to one that doesn't.
import { CONCEPTS, type Concept, type Course } from '../bank/taxonomy';
import { BANK_COURSES } from './bank';

/** A concept is ready when its course's problem file exists (`check:generator` ensures every concept in it has problems). */
export const isReady = (c: Concept) => BANK_COURSES.includes(c.course.id);
export const courseReady = (c: Course) => BANK_COURSES.includes(c.id);
export const readyCount = () => [...CONCEPTS.values()].filter(isReady).length;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '');
const words = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
const STOP = new Set(['the', 'and', 'of', 'an', 'in', 'on', 'to', 'for', 'with', 'by', 'its', 'from', 'how', 'what', 'is', 'problems', 'practice', 'practise']);

/** Concepts ranked against a free-text query: names count most, then keywords, units and courses. */
export function searchConcepts(query: string): { concept: Concept; score: number; full: boolean }[] {
  const terms = words(query).filter((w) => !STOP.has(w));
  if (!terms.length) return [];
  const phrase = norm(query).trim();
  const out: { concept: Concept; score: number; full: boolean }[] = [];
  for (const c of CONCEPTS.values()) {
    const name = norm(c.name);
    const nameWords = words(c.name);
    const kws = c.kw.map(norm);
    let score = name === phrase ? 30 : name.includes(phrase) ? 14 : 0;
    let hits = 0;
    for (const t of terms) {
      const stem = t.length > 4 ? t.slice(0, -1) : t;
      let s = 0;
      if (nameWords.some((w) => w === t || w.startsWith(stem))) s = 5;
      else if (kws.some((k) => k === t || k.includes(stem))) s = 3;
      else if (words(c.unit.name).some((w) => w.startsWith(stem))) s = 2;
      else if (words(c.course.name).some((w) => w.startsWith(stem)) || norm(c.course.code).includes(t)) s = 1;
      if (s) hits++;
      score += s;
    }
    if (score > 0) out.push({ concept: c, score: score + (isReady(c) ? 0.5 : 0), full: hits === terms.length });
  }
  return out.sort((a, b) => Number(b.full) - Number(a.full) || b.score - a.score);
}

/** Ready concepts most like this one: same unit, then same course, then shared keywords, then same subject. */
export function suggestionsFor(c: Concept, limit = 4): Concept[] {
  const kw = new Set(c.kw.map(norm));
  const nameWords = new Set(words(c.name));
  return [...CONCEPTS.values()]
    .filter((x) => x.id !== c.id && isReady(x))
    .map((x) => {
      let s = 0;
      if (x.unit.id === c.unit.id) s += 6;
      else if (x.course.id === c.course.id) s += 3;
      if (x.course.subject === c.course.subject) s += 1;
      s += x.kw.filter((k) => kw.has(norm(k))).length * 2;
      s += words(x.name).filter((w) => nameWords.has(w) && w.length > 3).length * 2;
      if (x.level === 'core') s += 0.5;
      return { x, s };
    })
    .filter((r) => r.s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x);
}

/** For a query with no good match: the nearest ready concepts, or else the most common ready ones. */
export function suggestionsForQuery(query: string, limit = 4): Concept[] {
  const near = searchConcepts(query)
    .filter((r) => isReady(r.concept))
    .slice(0, limit)
    .map((r) => r.concept);
  if (near.length) return near;
  return [...CONCEPTS.values()].filter((c) => isReady(c) && c.level === 'core').slice(0, limit);
}
