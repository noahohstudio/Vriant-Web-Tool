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
import { countBy, fmtDate, fmtTime, plural, RailRow } from '../components/shell';
import { Button, Checkbox, ClassTag, Icon, SectionLabel, Segmented, Slider, Tag } from '../components/ui';
import { CONCEPTS, conceptName } from '../bank/taxonomy';
import { problemText, type Difficulty, type Sheet } from '../lib/problems';
import { generate, go, loadSheet, openArchived, pickClassId, practiceTopics, setActiveClass, setPage, setSetup, toggleProblem, useStore, type Upload } from '../lib/store';
import { NotYet } from './topics';

function onFile(file: File | null) {
  if (!file) return loadSheet(null);
  const kind: Upload['kind'] = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other';
  loadSheet({ name: file.name, url: kind === 'image' ? URL.createObjectURL(file) : null, kind });
}

// ——— 01 Intake ———
export function IntakeMain() {
  return (
    <div className="screen">
      <SectionLabel index="01" title="Intake" meta="Step 1 of 4" />
      <div className="stack-12">
        <h1 className="t-display-m">Drop in this week’s sheet.</h1>
        <p className="t-body-l c-secondary measure">We’ll find the problems, write new versions with different numbers, and grade them when you hand the test back.</p>
      </div>
      <Dropzone title="Drop in your homework" subtitle="PDF, PNG or JPG · up to 20 pages · handwriting is fine" onFile={onFile} allowSample />
      <div className="row">
        <Button variant="secondary" icon="search" onClick={() => go('topics')}>
          Pick topics instead
        </Button>
        <span className="t-body-s c-tertiary">No sheet handy? Choose what you’re studying.</span>
      </div>
      <p className="t-mono-s c-tertiary">Tips — flat, well-lit photos · one sheet per upload · handwriting is fine</p>
    </div>
  );
}

export function IntakeRail() {
  const items = useStore((s) => s.items);
  const classes = useStore((s) => s.classes);
  const recent = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [items]);
  const counts = useMemo(() => countBy(items), [items]);
  const hueOf = (id: string) => `var(--tag-${classes.find((c) => c.id === id)?.hue ?? 'slate'})`;
  const open = (classId: string) => {
    setActiveClass(classId);
    go('archive');
  };
  return (
    <>
      <SectionLabel index="01" title="Recent" meta={String(recent.length)} />
      <div className="rail-list">
        {recent.map((i) => (
          <RailRow key={i.id} dot={hueOf(i.classId)} label={i.title} meta={fmtDate(i.createdAt)} onClick={() => (i.data ? openArchived(i.id, i.data.test ? 'results' : 'newTest') : open(i.classId))} />
        ))}
      </div>
      <SectionLabel index="02" title="Classes" meta={String(classes.length)} />
      <div className="rail-list">
        {classes.map((c) => (
          <RailRow key={c.id} dot={`var(--tag-${c.hue})`} label={c.name} meta={String(counts[c.id] ?? 0)} onClick={() => open(c.id)} />
        ))}
      </div>
    </>
  );
}

export const IntakeStatus = () => <>archive stored on this device</>;

// ——— 02 Review scan ———
function Paper({ sheet, page, selected }: { sheet: Sheet; page: number; selected: Record<number, boolean> }) {
  const problems = sheet.problems.filter((p) => p.page === page);
  return (
    <div className="paper" aria-label={`Page ${page} of ${sheet.pages}`}>
      <header className="paper__head">
        <p className="t-label-m">
          {sheet.course} — {sheet.title.replace(' — ', ', ')}
        </p>
        <p className="t-mono-s c-tertiary">Name ____________________ Date __________</p>
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
                {p.reason ? ` · ${p.reason}` : ''}
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
      <footer className="paper__foot t-mono-s c-tertiary">
        page {page} of {sheet.pages}
      </footer>
    </div>
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
                  {c.course.code} · {c.unit.label}
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
  if (!sheet) return null;
  const topics = sheet.source === 'topics';
  const n = sheet.problems.length;
  const picked = sheet.problems.filter((p) => p.supported && p.concept && setup.selected[p.n]).length;
  return (
    <div className="screen screen--split">
      <section className="split__left">
        <SectionLabel index="02" title={topics ? 'Topics' : 'Detected'} meta={topics ? plural(n, 'topic') : `${n} problems · page ${page} of ${sheet.pages}`} />
        {topics ? <TopicSheet sheet={sheet} /> : upload ? <UploadPreview upload={upload} /> : <Paper sheet={sheet} page={page} selected={setup.selected} />}
      </section>
      <div className="split__rule" aria-hidden="true" />
      <section className="split__right">
        <SectionLabel index="03" title="Make a test" />
        <div className="stack-6">
          <h2 className="t-heading-s">{topics ? `${plural(n, 'topic')} to practice` : `We found ${n} problems`}</h2>
          <p className="t-body-s c-secondary">{topics ? 'Untick any you want to leave out.' : 'Pick what goes into the test. Sketches and proofs aren’t supported yet.'}</p>
        </div>
        <div className="stack-10">
          {sheet.problems.map((p) => (
            <Checkbox key={p.n} checked={p.supported && !!p.concept && !!setup.selected[p.n]} disabled={!p.supported || !p.concept} onChange={() => toggleProblem(p.n)}>
              {topics ? '' : `Q${p.n} · `}
              {p.concept ? conceptName(p.concept) : (p.reason ?? 'not supported yet')}
              {topics && !p.supported ? ' — not in Vriant yet' : ''}
            </Checkbox>
          ))}
        </div>
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
        <p className="t-mono-s c-tertiary">
          {picked} problems · {setup.count} questions · about {Math.round(setup.count * 1.5)} minutes
        </p>
      </section>
    </div>
  );
}

export function ReviewRail() {
  const sheet = useStore((s) => s.sheet);
  const page = useStore((s) => s.page);
  const classes = useStore((s) => s.classes);
  if (!sheet) return null;
  const cls = classes.find((c) => c.id === pickClassId(classes, sheet.course)) ?? classes[0];
  if (sheet.source === 'topics') {
    return (
      <>
        <SectionLabel index="01" title="Topics" meta={String(sheet.problems.length)} />
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
      <SectionLabel index="01" title="Sheet" />
      <div className="rail-file">
        <Icon name="sheet" />
        <div>
          <p className="t-label-s">{sheet.fileName}</p>
          <p className="t-mono-s c-tertiary">
            {sheet.pages} pages · scanned {fmtTime(sheet.scannedAt)}
          </p>
        </div>
      </div>
      <div className="rail-save">
        <span className="t-label-s c-secondary">Save to</span>
        <ClassTag hue={cls.hue}>{cls.name}</ClassTag>
      </div>
      <SectionLabel index="02" title="Pages" meta={String(sheet.pages)} />
      <div className="thumbs">
        {Array.from({ length: sheet.pages }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={`thumb${n === page ? ' is-active' : ''}`} aria-label={`Page ${n}`} aria-current={n === page || undefined} onClick={() => setPage(n)}>
            <span className="thumb__page" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="t-mono-s">{n}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function ReviewStatus() {
  const sheet = useStore((s) => s.sheet);
  if (sheet?.source === 'topics') return <>{plural(sheet.problems.length, 'topic')} picked</>;
  return <>{sheet ? `${sheet.fileName} · ${sheet.pages} pages` : ''}</>;
}
