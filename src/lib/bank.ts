// The problem bank registry. Each course's templates are one lazily loaded file, src/bank/courses/<course id>.ts,
// found automatically: adding a file adds the course. Only the concept map (src/bank/taxonomy.ts) ships with the app.
import type { Template } from './problems';

const FILES = import.meta.glob<{ default: Template[] }>('../bank/courses/*.ts');
const LOADERS: Record<string, () => Promise<{ default: Template[] }>> = Object.fromEntries(
  Object.entries(FILES).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -'.ts'.length), load]),
);

/** Ids from before the bank existed. Archived tests still refer to them. */
const ALIASES: Record<string, string> = {
  carAccel: 'phys1.carAccel',
  droppedBall: 'phys1.droppedBall',
  cyclist: 'phys1.cyclist',
  braking: 'phys1.braking',
  twoTrains: 'phys1.twoTrains',
};

const byId = new Map<string, Template>();
const byConcept = new Map<string, Template[]>();
const loading = new Map<string, Promise<void>>();

const resolve = (id: string) => ALIASES[id] ?? id;
/** Template and concept ids both start with their course: "phys1.carAccel", "phys1.kin1d.freeFall". */
export const courseOf = (id: string) => resolve(id).split('.')[0];

export function registerTemplates(list: Template[]) {
  for (const t of list) {
    if (byId.has(t.id)) continue;
    byId.set(t.id, t);
    byConcept.set(t.concept, [...(byConcept.get(t.concept) ?? []), t]);
  }
}

export function ensureCourse(course: string): Promise<void> {
  const load = LOADERS[course];
  if (!load) return Promise.resolve();
  let p = loading.get(course);
  if (!p) {
    p = load().then((m) => registerTemplates(m.default));
    // A failed load (offline, say) can be retried later.
    p.catch(() => loading.delete(course));
    loading.set(course, p);
  }
  return p;
}

/** Load whichever course files these template or concept ids need. */
export const ensureFor = (ids: string[]) => Promise.all([...new Set(ids.map(courseOf))].map(ensureCourse)).then(() => undefined);

export function getTemplate(id: string): Template {
  const t = byId.get(resolve(id));
  if (!t) throw new Error(`Template “${id}” isn’t loaded — call ensureFor() first`);
  return t;
}

export const hasTemplate = (id: string) => byId.has(resolve(id));
export const templatesFor = (concept: string) => byConcept.get(concept) ?? [];
export const BANK_COURSES = Object.keys(LOADERS);
