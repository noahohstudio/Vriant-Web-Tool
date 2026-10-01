import { useMemo, useState } from 'react';

const DIFFICULTY: { value: Difficulty; label: string; mark: string; hint: string }[] = [
  { value: 'easier', label: 'Warm-up', mark: 'Warm-up', hint: 'One idea at a time, with rounder numbers.' },
  { value: 'same', label: 'Standard', mark: 'Standard', hint: 'Typical homework: a step or two per problem.' },
  { value: 'harder', label: 'Challenge', mark: 'Challenge', hint: 'Multi-step problems with untidier numbers.' },
];
const MAX_TYPED = 30;

/** 1–12 on the slider; double-click the number (or press Enter on it) to type any count up to 30. */
function QuestionCount({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const commit = (raw: string) => {
    setEditing(false);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) onChange(Math.min(MAX_TYPED, Math.max(1, n)));
  };
  return (
    <div className="field">
      <div className="row-between">
        <span className="field__label">Questions</span>
        {editing ? (
          <input
            autoFocus
            className="count-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_TYPED}
            defaultValue={value}
            aria-label="Number of questions"
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e.currentTarget.value);
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={(e) => commit(e.currentTarget.value)}
          />
        ) : (
          <button type="button" className="count" data-tip="Double-click to type a number" onDoubleClick={() => setEditing(true)} onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}>
            <span className="count__n">{value}</span> {value === 1 ? 'question' : 'questions'}
          </button>
        )}
      </div>
      <Slider min={1} max={12} value={value} onChange={onChange} label="Number of questions" valueText={(v) => `${v} questions`} />
      <div className="slider__ends t-mono-s c-tertiary">
        <span>1</span>
        <span>12</span>
      </div>
    </div>
  );
}
import { Dropzone } from '../components/dropzone';
import { fmtDate, fmtTime, plural, RailRow } from '../components/shell';
import { Button, Checkbox, ClassTag, Icon, SectionLabel, Segmented, Slider, Tag } from '../components/ui';
import { CONCEPTS, conceptName } from '../bank/taxonomy';
import { problemText, type Difficulty, type Problem, type Sheet } from '../lib/problems';
import { isReady, suggestionsFor } from '../lib/topics';
import { generate, go, loadSheet, openArchived, pickClassId, practiceTopics, scanFile, setActiveClass, setPage, setProblemConcept, setSetup, toggleProblem, useStore, type Upload } from '../lib/store';
import { NotYet, TopicPicker } from './topics';

/** A dropped file is read for real; no file means the sample sheet. */
function onFile(file: File | null, report: (caption: string) => void) {
  if (file) return scanFile(file, report);
  return new Promise<void>((done) => window.setTimeout(() => (loadSheet(null), done()), 1500));
}

// ——— 01 Intake ———
export function IntakeMain() {
  return (
    <div className="screen">
      <SectionLabel title="Intake" />
      <div className="stack-12">
        <h1 className="t-display-m">Drop in this week’s sheet.</h1>
        <p className="t-body-l c-secondary measure">We’ll find the problems, write new versions with different numbers, and grade them when you hand the test back.</p>
      </div>
      <Dropzone
        title="Drop in your homework"
        subtitle="PDF, photo or text · up to 20 pages · typed sheets read best"
        onFile={onFile}
        allowSample
        fallback={{ label: 'Pick topics instead', onClick: () => go('topics') }}
      />
      <div className="row">
        <Button variant="secondary" icon="search" onClick={() => go('topics')}>
          Pick topics instead
        </Button>
        <span className="t-body-s c-tertiary">No sheet handy? Choose what you’re studying.</span>
      </div>
      <p className="t-mono-s c-tertiary">Read on this device — nothing is uploaded · photos: flat, bright, one sheet at a time</p>
    </div>
  );
}

export function IntakeRail() {
  const items = useStore((s) => s.items);
  const classes = useStore((s) => s.classes);
  const recent = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [items]);
  const hueOf = (id: string) => `var(--tag-${classes.find((c) => c.id === id)?.hue ?? 'slate'})`;
  const open = (classId: string) => {
    setActiveClass(classId);
    go('archive');
  };
  return (
    <>
      <SectionLabel title="Recent" />
      <div className="rail-list">
        {recent.map((i) => (
          <RailRow key={i.id} dot={hueOf(i.classId)} label={i.title} meta={fmtDate(i.createdAt)} onClick={() => (i.data ? openArchived(i.id, i.data.test ? 'results' : 'newTest') : open(i.classId))} />
        ))}
      </div>
      <SectionLabel title="Classes" />
      <div className="rail-list">
        {classes.map((c) => (
          <RailRow key={c.id} dot={`var(--tag-${c.hue})`} label={c.name} onClick={() => open(c.id)} />
        ))}
      </div>
    </>
  );
}

export const IntakeStatus = () => <>archive stored on this device</>;

// ——— 02 Review scan ———
/** A region's label: the problem's topic (with "?" when it's only a guess), or why it's left out. */
const regionLabel = (p: Problem) => (p.supported && p.concept ? `${conceptName(p.concept)}${p.confidence === 'weak' ? '?' : ''}` : (p.reason ?? ''));

function Paper({ sheet, page, selected }: { sheet: Sheet; page: number; selected: Record<number, boolean> }) {
  const problems = sheet.problems.filter((p) => p.page === page);
  const scanned = !!sheet.via;
  return (
    <div className={`paper${scanned ? ' paper--read' : ''}`} aria-label={`Page ${page} of ${sheet.pages}`}>
      <header className="paper__head">
        <p className="t-label-m">{scanned ? sheet.title : `${sheet.course} — ${sheet.title.replace(' — ', ', ')}`}</p>
        <p className="t-mono-s c-tertiary">{scanned ? `${sheet.fileName} · as we read it` : 'Name ____________________ Date __________'}</p>
      </header>
      <div className="paper__problems">
        {problems.map((p) => {
          const state = !p.supported ? 'excluded' : selected[p.n] ? 'selected' : 'detected';
          return (
            <button
              key={p.n}
              type="button"
              className={`region region--${state}`}
              disabled={!p.supported}
              aria-pressed={p.supported ? !!selected[p.n] : undefined}
              onClick={() => toggleProblem(p.n)}
            >
              <span className="region__label">
                {state === 'selected' && <Icon name="check" size={12} />}Q{p.n}
                {regionLabel(p) ? ` · ${regionLabel(p)}` : ''}
              </span>
              <span className="region__corners" aria-hidden="true" />
              <span className="paper__text">
                <b>{p.n}.</b> {problemText(p)}
              </span>
              <span className="paper__lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          );
        })}
      </div>
      {!problems.length && <p className="t-body-s c-tertiary">No problems start on this page.</p>}
    </div>
  );
}

const VIA_NOTE: Record<NonNullable<Sheet['via']>, string> = {
  pdf: 'Read from the PDF’s own text, on this device. Check each problem’s topic before you start.',
  ocr: 'Read with text recognition, on this device — exponents and symbols can come out wrong. Check each topic.',
  text: 'Read from your text, on this device. Check each problem’s topic before you start.',
};

/** The page as uploaded, beside what we read from it. */
function OriginalPage({ upload, page }: { upload: Upload; page: number }) {
  const src = upload.pages?.[page - 1] ?? (page === 1 ? upload.url : null);
  if (!src) return <p className="t-body-s c-tertiary">The original isn’t kept after the page reloads — scan it again to see it.</p>;
  return (
    <figure className="upload upload--page">
      <img src={src} alt={`Page ${page} of your sheet`} />
    </figure>
  );
}

function UploadPreview({ upload }: { upload: Upload }) {
  return (
    <>
      {upload.kind === 'image' && upload.url ? (
        <figure className="upload">
          <img src={upload.url} alt="Your uploaded sheet" />
        </figure>
      ) : (
        <div className="upload upload--file">
          <Icon name="sheet" size={24} />
          <p className="t-label-m">{upload.name}</p>
          <p className="t-body-s c-tertiary">{upload.kind === 'pdf' ? 'PDF previews aren’t in the prototype yet.' : 'No preview for this file.'}</p>
        </div>
      )}
      <p className="notice">
        <Icon name="scan" size={16} />
        Prototype: problem detection is simulated — these are the sample worksheet’s problems.
      </p>
    </>
  );
}

/** One detected problem in the setup list: its topic (changeable), and what to do when it can't be practiced as is. */
function DetectedRow({ p, selected }: { p: Problem; selected: boolean }) {
  const c = p.concept ? CONCEPTS.get(p.concept) : undefined;
  const ready = !!c && isReady(c);
  const sketchOrProof = !p.supported && ready && !!p.reason;
  const similar = c && !ready ? suggestionsFor(c, 3) : [];
  return (
    <li className="detect-row">
      <div className="detect-row__main">
        <Checkbox checked={p.supported && !!c && selected} disabled={!p.supported || !c} onChange={() => toggleProblem(p.n)}>
          Q{p.n} · {c ? c.name : 'Topic not recognized'}
        </Checkbox>
        <span className="spacer" />
        {p.supported && p.confidence === 'weak' && <Tag tone="neutral">Check</Tag>}
        {c && !ready && <Tag tone="neutral">Not yet</Tag>}
        <TopicPicker current={p.concept} candidates={p.candidates ?? []} onPick={(id) => setProblemConcept(p.n, id)} label={c ? 'Change' : 'Choose'} />
      </div>
      {sketchOrProof && (
        <p className="detect-row__note t-body-s c-tertiary">
          {p.reason?.replace(' — not supported yet', '')} — can’t be practiced as asked.{' '}
          <button type="button" className="link" onClick={() => setProblemConcept(p.n, c!.id)}>
            Practice its topic anyway
          </button>
        </p>
      )}
      {c && !ready && (
        <div className="detect-row__note">
          <span className="t-body-s c-tertiary">{similar.length ? `Not in Vriant yet (${c.course.name}). Practice something close:` : `Not in Vriant yet — ${c.course.name} problems are still being written.`}</span>
          {similar.map((x) => (
            <Button key={x.id} variant="secondary" size="s" icon="plus" onClick={() => setProblemConcept(p.n, x.id)}>
              {x.name}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

/** Picked topics in place of a scanned page. Topics without problems yet say so and offer a swap. */
function TopicSheet({ sheet }: { sheet: Sheet }) {
  const ids = sheet.problems.map((p) => p.concept).filter((id): id is string => !!id);
  return (
    <div className="stack-12">
      <ul className="topic-list">
        {sheet.problems.map((p) => {
          const c = p.concept ? CONCEPTS.get(p.concept) : undefined;
          if (!c) return null;
          return (
            <li key={p.n} className={`topic-row${p.supported ? '' : ' is-off'}`}>
              <div className="topic-row__main">
                <span className="topic-row__name">{c.name}</span>
                <span className="spacer" />
                <span className="t-body-s c-tertiary topic-row__meta">
                  {c.course.name.split(':')[0]} · {c.unit.label}
                </span>
                {!p.supported && <Tag tone="neutral">Not yet</Tag>}
              </div>
              {!p.supported && <NotYet concept={c} onPick={(id) => practiceTopics([...ids.filter((x) => x !== c.id && x !== id), id])} />}
            </li>
          );
        })}
      </ul>
      <div className="row">
        <Button variant="secondary" icon="search" onClick={() => go('topics')}>
          Change topics
        </Button>
      </div>
    </div>
  );
}

export function ReviewMain() {
  const sheet = useStore((s) => s.sheet);
  const upload = useStore((s) => s.upload);
  const page = useStore((s) => s.page);
  const setup = useStore((s) => s.setup);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'read' | 'original'>('read');
  if (!sheet) return null;
  const topics = sheet.source === 'topics';
  const scanned = !!sheet.via;
  const hasOriginal = !!(upload?.pages?.length || upload?.url);
  const picked = sheet.problems.filter((p) => p.supported && p.concept && setup.selected[p.n]).length;
  return (
    <div className="screen screen--split">
      <section className="split__left">
        <SectionLabel title={topics ? 'Topics' : 'Detected'} />
        {scanned && hasOriginal && (
          <Segmented
            label="Show"
            value={view}
            onChange={setView}
            options={[
              { value: 'read', label: 'What we read' },
              { value: 'original', label: 'Original' },
            ]}
          />
        )}
        {topics ? (
          <TopicSheet sheet={sheet} />
        ) : scanned ? (
          view === 'original' && upload ? <OriginalPage upload={upload} page={page} /> : <Paper sheet={sheet} page={page} selected={setup.selected} />
        ) : upload ? (
          <UploadPreview upload={upload} />
        ) : (
          <Paper sheet={sheet} page={page} selected={setup.selected} />
        )}
        {scanned && sheet.via && (
          <p className="notice">
            <Icon name="scan" size={16} />
            {VIA_NOTE[sheet.via]}
          </p>
        )}
      </section>
      <div className="split__rule" aria-hidden="true" />
      <section className="split__right">
        <SectionLabel title="Make a test" />
        <div className="stack-6">
          <h2 className="t-heading-s">{topics ? 'Topics to practice' : 'Here’s what we found'}</h2>
          <p className="t-body-s c-secondary">
            {topics ? 'Untick any you want to leave out.' : scanned ? 'Pick what goes into the test. “Check” marks a topic we’re not sure of — change it if it’s wrong.' : 'Pick what goes into the test. Sketches and proofs aren’t supported yet.'}
          </p>
        </div>
        {scanned ? (
          <ul className="detect-list">
            {sheet.problems.map((p) => (
              <DetectedRow key={p.n} p={p} selected={!!setup.selected[p.n]} />
            ))}
          </ul>
        ) : (
        <div className="stack-10">
          {sheet.problems.map((p) => (
            <Checkbox key={p.n} checked={p.supported && !!p.concept && !!setup.selected[p.n]} disabled={!p.supported || !p.concept} onChange={() => toggleProblem(p.n)}>
              {topics ? '' : `Q${p.n} · `}
              {p.concept ? conceptName(p.concept) : (p.reason ?? 'not supported yet')}
              {topics && !p.supported ? ' — not in Vriant yet' : ''}
            </Checkbox>
          ))}
        </div>
        )}
        <QuestionCount value={setup.count} onChange={(count) => setSetup({ count })} />
        <div className="field">
          <div className="row-between">
            <span className="field__label">Difficulty</span>
            <span className="t-label-s swap" key={setup.difficulty}>
              {DIFFICULTY.find((d) => d.value === setup.difficulty)?.label}
            </span>
          </div>
          <Slider
            min={0}
            max={2}
            value={Math.max(0, DIFFICULTY.findIndex((d) => d.value === setup.difficulty))}
            onChange={(i) => setSetup({ difficulty: DIFFICULTY[i].value })}
            label="Difficulty"
            valueText={(i) => DIFFICULTY[i].label}
            marks={DIFFICULTY.map((d, i) => ({ value: i, label: d.mark }))}
          />
          <p className="t-body-s c-tertiary swap" key={`h-${setup.difficulty}`}>
            {DIFFICULTY.find((d) => d.value === setup.difficulty)?.hint}
          </p>
        </div>
        <div className="row-between">
          <span className="t-body-m">Time myself</span>
          <Segmented
            label="Time myself"
            value={setup.timer ? 'on' : 'off'}
            onChange={(v) => setSetup({ timer: v === 'on' })}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'on', label: 'On' },
            ]}
          />
        </div>
        <Button
          block
          trailing="arrowRight"
          busy={busy}
          disabled={!picked}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => void generate().then((ok) => ok || setBusy(false)), 600);
          }}
        >
          {busy ? 'Writing variants…' : 'Generate practice test'}
        </Button>
      </section>
    </div>
  );
}

export function ReviewRail() {
  const sheet = useStore((s) => s.sheet);
  const page = useStore((s) => s.page);
  const pages = useStore((s) => s.upload?.pages);
  const classes = useStore((s) => s.classes);
  if (!sheet) return null;
  const cls = classes.find((c) => c.id === pickClassId(classes, sheet.course)) ?? classes[0];
  if (sheet.source === 'topics') {
    return (
      <>
        <SectionLabel title="Topics" />
        <div className="rail-list">
          {sheet.problems.map((p) => (
            <RailRow key={p.n} dot={p.supported ? 'var(--accent-default)' : 'var(--line-strong)'} label={conceptName(p.concept)} meta={p.supported ? undefined : 'not yet'} muted={!p.supported} />
          ))}
        </div>
        <div className="rail-save">
          <span className="t-label-s c-secondary">Save to</span>
          <ClassTag hue={cls.hue}>{cls.name}</ClassTag>
        </div>
      </>
    );
  }
  return (
    <>
      <SectionLabel title="Sheet" />
      <div className="rail-file">
        <Icon name="sheet" />
        <div>
          <p className="t-label-s">{sheet.fileName}</p>
          <p className="t-mono-s c-tertiary">
            {sheet.via === 'ocr' ? 'Text recognized' : sheet.via ? 'Read' : 'Scanned'} {fmtTime(sheet.scannedAt)}
          </p>
        </div>
      </div>
      <div className="rail-save">
        <span className="t-label-s c-secondary">Save to</span>
        <ClassTag hue={cls.hue}>{cls.name}</ClassTag>
      </div>
      <SectionLabel title="Pages" />
      <div className="thumbs">
        {Array.from({ length: sheet.pages }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={`thumb${n === page ? ' is-active' : ''}`} aria-label={`Page ${n}`} aria-current={n === page || undefined} onClick={() => setPage(n)}>
            {pages?.[n - 1] ? (
              <img className="thumb__img" src={pages[n - 1]} alt="" />
            ) : (
              <span className="thumb__page" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

export function ReviewStatus() {
  const sheet = useStore((s) => s.sheet);
  if (sheet?.source === 'topics') return <>{plural(sheet.problems.length, 'topic')} picked</>;
  return <>{sheet ? `${sheet.fileName}${sheet.via ? ' · read on this device' : ''}` : ''}</>;
}
