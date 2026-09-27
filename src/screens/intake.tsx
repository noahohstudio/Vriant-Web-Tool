import { useMemo, useState } from 'react';
import { Dropzone } from '../components/dropzone';
import { countBy, fmtDate, fmtTime, RailRow } from '../components/shell';
import { Button, Checkbox, ClassTag, Icon, SectionLabel, Segmented, Toggle } from '../components/ui';
import { problemText, TEMPLATES, type Difficulty, type Sheet } from '../lib/problems';
import { generate, go, loadSheet, setActiveClass, setPage, setSetup, toggleProblem, useStore, type Upload } from '../lib/store';

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
          <RailRow key={i.id} dot={hueOf(i.classId)} label={i.title} meta={fmtDate(i.createdAt)} onClick={() => open(i.classId)} />
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

export function ReviewMain() {
  const sheet = useStore((s) => s.sheet);
  const upload = useStore((s) => s.upload);
  const page = useStore((s) => s.page);
  const setup = useStore((s) => s.setup);
  const [busy, setBusy] = useState(false);
  if (!sheet) return null;
  const picked = sheet.problems.filter((p) => p.supported && setup.selected[p.n]).length;
  return (
    <div className="screen screen--split">
      <section className="split__left">
        <SectionLabel index="02" title="Detected" meta={`${sheet.problems.length} problems · page ${page} of ${sheet.pages}`} />
        {upload ? <UploadPreview upload={upload} /> : <Paper sheet={sheet} page={page} selected={setup.selected} />}
      </section>
      <div className="split__rule" aria-hidden="true" />
      <section className="split__right">
        <SectionLabel index="03" title="Make a test" />
        <div className="stack-6">
          <h2 className="t-heading-s">We found {sheet.problems.length} problems</h2>
          <p className="t-body-s c-secondary">Pick what goes into the test. Sketches and proofs aren’t supported yet.</p>
        </div>
        <div className="stack-10">
          {sheet.problems.map((p) => (
            <Checkbox key={p.n} checked={p.supported && !!setup.selected[p.n]} disabled={!p.supported} onChange={() => toggleProblem(p.n)}>
              Q{p.n} · {p.templateId ? TEMPLATES[p.templateId].title : 'v–t sketch (not supported)'}
            </Checkbox>
          ))}
        </div>
        <div className="field">
          <span className="field__label">Questions</span>
          <Segmented
            label="Number of questions"
            value={setup.count}
            onChange={(count) => setSetup({ count })}
            options={[5, 10, 15].map((n) => ({ value: n, label: n === setup.count ? `${n} questions` : String(n) }))}
          />
        </div>
        <label className="field">
          <span className="field__label">Difficulty</span>
          <span className="field__box">
            <select className="field__input" value={setup.difficulty} onChange={(e) => setSetup({ difficulty: e.target.value as Difficulty })}>
              <option value="easier">Easier than the original</option>
              <option value="same">Same as the original</option>
              <option value="harder">Harder than the original</option>
            </select>
            <Icon name="chevronDown" className="c-tertiary" />
          </span>
        </label>
        <div className="row-between">
          <span className="t-body-m">Time myself</span>
          <Toggle checked={setup.timer} onChange={(timer) => setSetup({ timer })} label="Time myself" />
        </div>
        <Button
          block
          trailing="arrowRight"
          busy={busy}
          disabled={!picked}
          onClick={() => {
            setBusy(true);
            window.setTimeout(generate, 600);
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
  const cls = classes.find((c) => c.name === sheet.course) ?? classes[0];
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
  return <>{sheet ? `${sheet.fileName} · ${sheet.pages} pages` : ''}</>;
}
