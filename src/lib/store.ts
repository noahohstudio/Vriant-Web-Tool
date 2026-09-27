// App state: a tiny external store read through useSyncExternalStore.
// Components subscribe to narrow slices, so typing an answer never re-renders the whole app.
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { buildFrom, buildQuestions, grade, POINTS, sampleSheet, TEMPLATES, type Difficulty, type Grade, type Problem, type Question, type Result, type Sheet } from './problems';

export type Route = 'intake' | 'review' | 'practice' | 'handin' | 'results' | 'archive';
const ROUTES: Route[] = ['intake', 'review', 'practice', 'handin', 'results', 'archive'];
export type Theme = 'signature' | 'light' | 'dark';
export type Hue = 'clay' | 'ochre' | 'moss' | 'sky' | 'plum' | 'slate';
export const HUES: Hue[] = ['sky', 'ochre', 'clay', 'moss', 'plum', 'slate'];
export const UNSORTED = 'unsorted';
export type ClassItem = { id: string; name: string; hue: Hue };
export type Tone = 'neutral' | 'correct' | 'partial' | 'incorrect';
/** What an archive entry can bring back: a whole graded test, or just its source sheet. */
export type ArchivedData = { sheet: Sheet; test?: Test; attempt?: Attempt; results?: Results };
export type ArchiveItem = { id: string; title: string; classId: string; detail: string; createdAt: number; tone: Tone; label: string; kind?: 'test' | 'sheet'; data?: ArchivedData };
export type Setup = { selected: Record<number, boolean>; count: number; difficulty: Difficulty; timer: boolean };
export type Test = { id: string; title: string; sheetTitle: string; classId: string; createdAt: number; questions: Question[]; timer: boolean };
export type Attempt = { answers: Record<string, string>; choices: Record<string, number>; flagged: Record<string, boolean>; startedAt: number; current: number };
export type Results = { grades: Record<string, Grade>; score: number; counts: Record<Result, number>; gradedAt: number; via: 'typed' | 'paper'; filed: boolean; filedTo?: string };
export type Toast = { id: number; message: string; undo?: () => void };
export type Upload = { name: string; url: string | null; kind: 'image' | 'pdf' | 'other' };

export type State = {
  route: Route;
  theme: Theme;
  sheet: Sheet | null;
  upload: Upload | null;
  page: number;
  setup: Setup;
  test: Test | null;
  attempt: Attempt | null;
  results: Results | null;
  focus: string | null;
  classes: ClassItem[];
  items: ArchiveItem[];
  activeClass: string;
  toast: Toast | null;
};

// ——— Persistence: the archive lives on this device; the working session only lasts for this tab. ———
const KEY = { archive: 'vriant:archive:v1', session: 'vriant:session:v1', theme: 'vriant:theme' };
function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked or full — the app keeps working in memory */
  }
}

const DAY = 86_400_000;
const NOW = Date.now();
const SEED_CLASSES: ClassItem[] = [
  { id: 'physics-1', name: 'Physics 1', hue: 'sky' },
  { id: 'calc-ab', name: 'Calculus AB', hue: 'ochre' },
  { id: 'chem', name: 'Chemistry', hue: 'clay' },
  { id: 'unsorted', name: 'Unsorted', hue: 'slate' },
];
const SEED_ITEMS: ArchiveItem[] = [
  { id: 'seed-1', title: 'Forces & friction — Quiz prep', classId: 'physics-1', detail: '8 problems', createdAt: NOW - 7 * DAY, tone: 'partial', label: '5/8' },
  { id: 'seed-2', title: 'Energy — Worksheet 2', classId: 'physics-1', detail: '10 problems', createdAt: NOW - 14 * DAY, tone: 'neutral', label: 'Not graded' },
  { id: 'seed-3', title: 'Derivatives — Set B', classId: 'calc-ab', detail: '12 problems', createdAt: NOW - 9 * DAY, tone: 'correct', label: '11/12' },
  { id: 'seed-4', title: 'Limits — Warm-up', classId: 'calc-ab', detail: '6 problems', createdAt: NOW - 20 * DAY, tone: 'neutral', label: 'Not graded' },
  { id: 'seed-5', title: 'Stoichiometry — Worksheet 1', classId: 'chem', detail: '6 problems', createdAt: NOW - 11 * DAY, tone: 'correct', label: '6/6' },
];
const DEFAULT_SETUP: Setup = { selected: { 1: true, 2: true, 3: true, 5: true }, count: 10, difficulty: 'same', timer: true };

const isTheme = (t: unknown): t is Theme => t === 'signature' || t === 'light' || t === 'dark';
const routeFromHash = (): Route | null => {
  const r = location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(r) ? (r as Route) : null;
};

function guard(route: Route, s: State): Route {
  if (route === 'review' && !s.sheet) return 'intake';
  if ((route === 'practice' || route === 'handin') && !(s.test && s.attempt)) return s.sheet ? 'review' : 'intake';
  if (route === 'results' && !(s.results && s.test)) return s.test ? 'practice' : 'intake';
  return route;
}

function initialState(): State {
  const archive = read<{ classes: ClassItem[]; items: ArchiveItem[] }>(() => localStorage, KEY.archive);
  const session = read<Partial<State>>(() => sessionStorage, KEY.session);
  let theme: Theme = 'signature';
  try {
    const t = localStorage.getItem(KEY.theme);
    if (isTheme(t)) theme = t;
  } catch {
    /* ignore */
  }
  const s: State = {
    route: 'intake',
    theme,
    sheet: session?.sheet ?? null,
    upload: session?.upload ? { ...session.upload, url: null } : null,
    page: 1,
    setup: session?.setup ?? DEFAULT_SETUP,
    test: session?.test ?? null,
    attempt: session?.attempt ?? null,
    results: session?.results ?? null,
    focus: session?.focus ?? null,
    classes: archive?.classes ?? SEED_CLASSES,
    items: archive?.items ?? SEED_ITEMS,
    activeClass: 'physics-1',
    toast: null,
  };
  s.route = guard(routeFromHash() ?? session?.route ?? 'intake', s);
  return s;
}

// ——— Store ———
let state = initialState();
const listeners = new Set<() => void>();
let persistTimer = 0;

function set(update: (s: State) => State) {
  const next = update(state);
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(persist, 250);
}
function persist() {
  const { route, sheet, upload, setup, test, attempt, results, focus, classes, items } = state;
  write(() => sessionStorage, KEY.session, { route, sheet, upload: upload && { ...upload, url: null }, setup, test, attempt, results, focus });
  write(() => localStorage, KEY.archive, { classes, items });
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const getState = () => state;
/** Select a slice. The selector must return a primitive or an existing object (never a fresh array). */
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}
const commit = (fn: (s: State) => State) => flushSync(() => set(fn));

// ——— Transitions ———
// View Transitions snapshot the page and animate the snapshots on the compositor, so theme changes and
// screen changes never repaint every element frame by frame. Browsers without support switch instantly.
type VT = { finished: Promise<void>; ready: Promise<void> };
type VTDocument = Document & { startViewTransition?: (update: () => void) => VT };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function transition(kind: 'nav' | 'theme', update: () => void) {
  const doc = document as VTDocument;
  if (!doc.startViewTransition || reducedMotion()) {
    update();
    return;
  }
  const root = document.documentElement;
  root.classList.add(`vt-${kind}`);
  const vt = doc.startViewTransition(update);
  vt.ready.catch(() => {});
  vt.finished.finally(() => root.classList.remove(`vt-${kind}`));
}

export function go(route: Route, mutate?: (s: State) => State) {
  transition('nav', () => {
    commit((s) => {
      const n = mutate ? mutate(s) : s;
      return { ...n, route: guard(route, n) };
    });
    const url = `#/${state.route}`;
    if (location.hash !== url) history.pushState(null, '', url);
    document.getElementById('main')?.scrollTo({ top: 0 });
  });
}

window.addEventListener('popstate', () => {
  const r = routeFromHash();
  if (r) transition('nav', () => commit((s) => ({ ...s, route: guard(r, s) })));
});
if (routeFromHash() !== state.route) history.replaceState(null, '', `#/${state.route}`);

export function setTheme(theme: Theme) {
  if (theme === state.theme) return;
  transition('theme', () => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY.theme, theme);
    } catch {
      /* ignore */
    }
    commit((s) => ({ ...s, theme }));
  });
}

// ——— Toasts ———
let toastSeq = 0;
export function toast(message: string, undo?: () => void) {
  set((s) => ({ ...s, toast: { id: ++toastSeq, message, undo } }));
}
export const dismissToast = (id: number) => set((s) => (s.toast?.id === id ? { ...s, toast: null } : s));

// ——— Intake & review ———
export function loadSheet(upload: Upload | null) {
  const prev = state.upload?.url;
  if (prev && prev !== upload?.url) URL.revokeObjectURL(prev);
  const sheet = sampleSheet(upload?.name, upload ? 'upload' : 'sample');
  go('review', (s) => ({ ...s, sheet, upload, page: 1, setup: { ...DEFAULT_SETUP, timer: s.setup.timer } }));
}
export const setPage = (page: number) => set((s) => ({ ...s, page }));
export const toggleProblem = (n: number) =>
  set((s) => ({ ...s, setup: { ...s.setup, selected: { ...s.setup.selected, [n]: !s.setup.selected[n] } } }));
export const setSetup = (patch: Partial<Setup>) => set((s) => ({ ...s, setup: { ...s.setup, ...patch } }));

const newAttempt = (): Attempt => ({ answers: {}, choices: {}, flagged: {}, startedAt: Date.now(), current: 0 });
const newSeed = () => Math.floor(Math.random() * 2 ** 31);
/** The class a sheet files into by default: matching name, then Physics 1, then whatever exists. */
export const pickClassId = (classes: ClassItem[], course?: string) =>
  classes.find((c) => c.name === course)?.id ?? classes.find((c) => c.id === 'physics-1')?.id ?? classes[0]?.id ?? UNSORTED;
const classIdFor = (s: State) => pickClassId(s.classes, s.sheet?.course);

function startTest(questions: Question[], title: string) {
  const s = state;
  if (!questions.length || !s.sheet) return;
  const test: Test = { id: `t${newSeed().toString(36)}`, title, sheetTitle: s.sheet.title, classId: classIdFor(s), createdAt: Date.now(), questions, timer: s.setup.timer };
  go('practice', (st) => ({ ...st, test, attempt: newAttempt(), results: null, focus: null }));
}

export function generate() {
  const s = state;
  if (!s.sheet) return;
  startTest(buildQuestions(s.sheet.problems, s.setup.selected, s.setup.count, s.setup.difficulty, newSeed()), `${s.sheet.title} — practice`);
}

// ——— Practice ———
const patchAttempt = (fn: (a: Attempt) => Attempt) => set((s) => (s.attempt ? { ...s, attempt: fn(s.attempt) } : s));
export const answer = (qid: string, text: string) => patchAttempt((a) => ({ ...a, answers: { ...a.answers, [qid]: text } }));
export const choose = (qid: string, i: number) => patchAttempt((a) => ({ ...a, choices: { ...a.choices, [qid]: i } }));
export const toggleFlag = (qid: string) => patchAttempt((a) => ({ ...a, flagged: { ...a.flagged, [qid]: !a.flagged[qid] } }));
export const goQuestion = (i: number) =>
  patchAttempt((a) => ({ ...a, current: Math.max(0, Math.min(i, (state.test?.questions.length ?? 1) - 1)) }));
let lastAdvance = 0;
export function nextQuestion() {
  // One press = one step: ignore a second advance fired by the same key press or a double click.
  const now = performance.now();
  if (now - lastAdvance < 250) return;
  lastAdvance = now;
  const { test, attempt } = state;
  if (!test || !attempt) return;
  if (attempt.current >= test.questions.length - 1) go('handin');
  else goQuestion(attempt.current + 1);
}

// ——— Grading ———
export function handIn(via: Results['via']) {
  const { test, attempt } = state;
  if (!test || !attempt) return;
  const grades: Record<string, Grade> = {};
  const counts: Record<Result, number> = { correct: 0, partial: 0, incorrect: 0, skipped: 0 };
  let points = 0;
  for (const q of test.questions) {
    const g = grade(q, attempt.answers[q.id], attempt.choices[q.id]);
    grades[q.id] = g;
    counts[g.result]++;
    points += g.points;
  }
  const firstMiss = test.questions.find((q) => grades[q.id].result !== 'correct') ?? test.questions[0];
  go('results', (s) => ({ ...s, results: { grades, score: points / POINTS, counts, gradedAt: Date.now(), via, filed: false }, focus: firstMiss.id }));
}
export const focusResult = (qid: string) => set((s) => ({ ...s, focus: qid }));

export function trySimilar(qid: string) {
  const { test, sheet } = state;
  const q = test?.questions.find((x) => x.id === qid);
  const p = q && sheet?.problems.find((x) => x.n === q.problemN);
  if (q && p) startTest(buildFrom([p], newSeed(), state.setup.difficulty), `${TEMPLATES[q.templateId].title} — one more`);
}

export function practiceMissed() {
  const { test, results, sheet } = state;
  if (!test || !results || !sheet) return;
  const problems = test.questions
    .filter((q) => results.grades[q.id].result !== 'correct')
    .map((q) => sheet.problems.find((p) => p.n === q.problemN))
    .filter((p): p is Problem => !!p);
  startTest(buildFrom(problems, newSeed(), state.setup.difficulty), `${sheet.title} — the ones you missed`);
}

export const fmtScore = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

// ——— Archive ———
export function fileResults(requested: string) {
  const { test, results, sheet, attempt, classes, items } = state;
  if (!test || !results || !sheet || !attempt) return;
  const classId = classes.some((c) => c.id === requested) ? requested : pickClassId(classes);
  const n = test.questions.length;
  const ratio = results.score / n;
  const stamp = Date.now().toString(36);
  const filed: Results = { ...results, filed: true, filedTo: classId };
  const added: ArchiveItem[] = [
    {
      id: `a-${stamp}`,
      kind: 'test',
      title: test.title,
      classId,
      detail: `${n} questions`,
      createdAt: Date.now(),
      tone: ratio >= 0.85 ? 'correct' : ratio >= 0.5 ? 'partial' : 'incorrect',
      label: `${fmtScore(results.score)}/${n}`,
      data: { sheet, test, attempt, results: filed },
    },
  ];
  if (!items.some((i) => i.title === sheet.title && i.classId === classId)) {
    added.push({ id: `a-${stamp}-s`, kind: 'sheet', title: sheet.title, classId, detail: `${sheet.problems.length} problems`, createdAt: sheet.scannedAt, tone: 'neutral', label: 'Source sheet', data: { sheet } });
  }
  const ids = new Set(added.map((a) => a.id));
  go('archive', (s) => ({ ...s, items: [...added, ...s.items], activeClass: classId, results: s.results && { ...s.results, filed: true, filedTo: classId } }));
  window.setTimeout(
    () =>
      toast(`Filed under ${classes.find((c) => c.id === classId)?.name ?? 'your archive'}`, () =>
        set((s) => ({ ...s, items: s.items.filter((i) => !ids.has(i.id)), results: s.results && { ...s.results, filed: false, filedTo: undefined } })),
      ),
    320,
  );
}

/** Reopen something from the archive: a filed test opens on Results; a source sheet opens in Review for a new test.
 *  Whatever was in progress is replaced, with Undo to get it back. */
export function openArchived(id: string, mode: 'results' | 'newTest' = 'results') {
  const item = state.items.find((i) => i.id === id);
  const data = item?.data;
  if (!item || !data) return;
  const prev = { route: state.route, sheet: state.sheet, upload: state.upload, page: state.page, setup: state.setup, test: state.test, attempt: state.attempt, results: state.results, focus: state.focus };
  const replacing = !!prev.test && prev.test.id !== data.test?.id;
  if (mode === 'results' && data.test && data.attempt && data.results) {
    const { test, attempt, results } = data;
    const firstMiss = test.questions.find((q) => results.grades[q.id]?.result !== 'correct') ?? test.questions[0];
    go('results', (s) => ({ ...s, sheet: data.sheet, upload: null, test, attempt, results: { ...results, filed: true, filedTo: item.classId }, focus: firstMiss.id }));
  } else {
    go('review', (s) => ({ ...s, sheet: { ...data.sheet, scannedAt: Date.now() }, upload: null, page: 1, setup: { ...DEFAULT_SETUP, timer: s.setup.timer }, test: null, attempt: null, results: null, focus: null }));
  }
  if (replacing) {
    window.setTimeout(
      () =>
        toast(`Opened “${item.title}”`, () => {
          set((s) => ({ ...s, ...prev }));
          // Undo takes you back to the work you left, not just the screen you clicked from.
          go(prev.results ? 'results' : prev.attempt ? 'practice' : prev.route);
        }),
      320,
    );
  }
}

export const setActiveClass = (id: string) => set((s) => ({ ...s, activeClass: id }));

export function addClass(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  set((s) => {
    const id = `c-${Date.now().toString(36)}`;
    return { ...s, classes: [...s.classes, { id, name: trimmed, hue: HUES[s.classes.length % HUES.length] }], activeClass: id };
  });
}

export function renameClass(id: string, name: string) {
  const trimmed = name.trim().slice(0, 40);
  const prev = state.classes.find((c) => c.id === id);
  if (!prev || !trimmed || trimmed === prev.name || id === UNSORTED) return;
  const rename = (to: string) => (s: State) => ({ ...s, classes: s.classes.map((c) => (c.id === id ? { ...c, name: to } : c)) });
  set(rename(trimmed));
  toast(`Renamed to “${trimmed}”`, () => set(rename(prev.name)));
}

export const setClassHue = (id: string, hue: Hue) => set((s) => ({ ...s, classes: s.classes.map((c) => (c.id === id ? { ...c, hue } : c)) }));

/** Removing a class never removes work: its sheets move to Unsorted, and Undo puts everything back. */
export function deleteClass(id: string) {
  const index = state.classes.findIndex((c) => c.id === id);
  if (index < 0 || id === UNSORTED) return;
  const cls = state.classes[index];
  const moved = new Set(state.items.filter((i) => i.classId === id).map((i) => i.id));
  set((s) => {
    const classes = s.classes.filter((c) => c.id !== id);
    if (moved.size && !classes.some((c) => c.id === UNSORTED)) classes.push({ id: UNSORTED, name: 'Unsorted', hue: 'slate' });
    return { ...s, classes, items: s.items.map((i) => (moved.has(i.id) ? { ...i, classId: UNSORTED } : i)), activeClass: s.activeClass === id ? UNSORTED : s.activeClass };
  });
  toast(`Deleted “${cls.name}”${moved.size ? ` · ${moved.size} ${moved.size === 1 ? 'sheet' : 'sheets'} moved to Unsorted` : ''}`, () =>
    set((s) => {
      const classes = [...s.classes];
      classes.splice(Math.min(index, classes.length), 0, cls);
      return { ...s, classes, items: s.items.map((i) => (moved.has(i.id) ? { ...i, classId: id } : i)), activeClass: id };
    }),
  );
}

export function moveItem(id: string, classId: string) {
  const prev = state.items.find((i) => i.id === id);
  if (!prev || prev.classId === classId) return;
  set((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, classId } : i)) }));
  toast(`Moved to ${state.classes.find((c) => c.id === classId)?.name}`, () =>
    set((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, classId: prev.classId } : i)) })),
  );
}

export function deleteItem(id: string) {
  const index = state.items.findIndex((i) => i.id === id);
  if (index < 0) return;
  const item = state.items[index];
  set((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  toast(`Deleted “${item.title}”`, () =>
    set((s) => {
      const restored = [...s.items];
      restored.splice(index, 0, item);
      return { ...s, items: restored };
    }),
  );
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY.archive);
    sessionStorage.removeItem(KEY.session);
  } catch {
    /* ignore */
  }
  location.hash = '';
  location.reload();
}
