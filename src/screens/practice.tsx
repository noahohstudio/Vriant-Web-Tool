import { useEffect, useState } from 'react';
import { Dropzone } from '../components/dropzone';
import { optionCount, QuestionCard, Rich, TestProgress } from '../components/question';
import { Elapsed, RailRow } from '../components/shell';
import { Button, Icon, Kbd, loadKatex, SectionLabel } from '../components/ui';
import { getTemplate } from '../lib/bank';
import { choiceText, type Question } from '../lib/problems';
import { choose, go, goQuestion, handIn, nextQuestion, toggleFlag, useStore, type Attempt } from '../lib/store';

const isAnswered = (a: Attempt, id: string) => !!a.answers[id]?.trim() || a.choices[id] !== undefined;

// ——— 03 Practice ———
export function PracticeMain() {
  const test = useStore((s) => s.test);
  const current = useStore((s) => s.attempt?.current ?? 0);
  const startedAt = useStore((s) => s.attempt?.startedAt ?? 0);
  const [hintFor, setHintFor] = useState<string | null>(null);
  const q = test?.questions[current];

  // Warm up the maths renderer while the student works, so Results opens instantly.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => void loadKatex());
  }, []);

  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      if (k === 'enter' && el.closest('button')) return;
      if (k === 'h') setHintFor((h) => (h === q.id ? null : q.id));
      else if (k === 'f') toggleFlag(q.id);
      else if (k === 's' || k === 'enter') nextQuestion();
      else if (q.kind !== 'free' && /^[1-4a-d]$/.test(k)) {
        const i = /\d/.test(k) ? Number(k) - 1 : k.charCodeAt(0) - 97;
        if (i < optionCount(q)) choose(q.id, i);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q]);

  if (!test || !q) return null;
  const n = test.questions.length;
  return (
    <div className="screen">
      <SectionLabel title="Practice" />
      <TestProgress
        questions={test.questions}
        current={current}
        onPick={goQuestion}
        label={`Question ${current + 1} of ${n}`}
        meta={
          test.timer ? (
            <>
              <Icon name="timer" size={16} />
              <Elapsed since={startedAt} />
            </>
          ) : undefined
        }
      />
      <div className="practice">
        <QuestionCard key={q.id} q={q} sheetTitle={test.sheetTitle} hintOpen={hintFor === q.id} onHint={() => setHintFor(hintFor === q.id ? null : q.id)} isLast={current === n - 1} />
        <PracticeAside />
      </div>
    </div>
  );
}

const DIFFICULTY = { easier: 'Warm-up', same: 'Standard', harder: 'Challenge' } as const;

function PracticeAside() {
  const test = useStore((s) => s.test);
  const attempt = useStore((s) => s.attempt);
  const difficulty = useStore((s) => s.setup.difficulty);
  if (!test || !attempt) return null;
  const answered = test.questions.filter((q) => isAnswered(attempt, q.id)).length;
  const flagged = Object.values(attempt.flagged).filter(Boolean).length;
  return (
    <aside className="aside">
      <span className="t-caption c-tertiary">This test</span>
      <dl className="stats">
        <div>
          <dt>Answered</dt>
          <dd>
            {answered} of {test.questions.length}
          </dd>
        </div>
        <div>
          <dt>Flagged</dt>
          <dd>{flagged}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{DIFFICULTY[difficulty]}</dd>
        </div>
      </dl>
      <Button variant="secondary" onClick={() => go('handin')}>
        Hand in early
      </Button>
      <p className="t-body-s c-tertiary">Hand in any time — blanks are marked as skipped, not wrong.</p>
    </aside>
  );
}

export function PracticeRail() {
  const test = useStore((s) => s.test);
  const attempt = useStore((s) => s.attempt);
  const route = useStore((s) => s.route);
  if (!test || !attempt) return null;
  const handin = route === 'handin';
  return (
    <>
      <SectionLabel title="Test" />
      <p className="t-body-s c-secondary">Practice from {test.sheetTitle}</p>
      <div className="rail-list">
        {test.questions.map((q, i) => {
          const on = !handin && i === attempt.current;
          const done = isAnswered(attempt, q.id);
          return (
            <RailRow
              key={q.id}
              dot={on ? 'var(--accent-default)' : done ? 'var(--text-primary)' : 'var(--line-strong)'}
              label={getTemplate(q.templateId).title}
              meta={attempt.flagged[q.id] ? 'flagged' : handin && !done ? 'blank' : undefined}
              metaTone={attempt.flagged[q.id] ? 'partial' : undefined}
              active={on}
              muted={!on && !done}
              onClick={() => {
                goQuestion(i);
                if (handin) go('practice');
              }}
            />
          );
        })}
      </div>
      {!handin && (
        <>
          <SectionLabel title="Keys" />
          <ul className="keys">
            <li>
              <Kbd>Enter</Kbd>Next question
            </li>
            <li>
              <Kbd>H</Kbd>Show hint
            </li>
            <li>
              <Kbd>F</Kbd>Flag for review
            </li>
            <li>
              <Kbd>S</Kbd>Skip
            </li>
            <li>
              <Kbd>1–4</Kbd>Pick a choice
            </li>
          </ul>
        </>
      )}
    </>
  );
}

export const PracticeStatus = () => <>saved in this tab until you archive it</>;

// ——— 04 Hand in ———
function AnswerPreview({ q, attempt }: { q: Question; attempt: Attempt }) {
  const t = getTemplate(q.templateId);
  const chosen = attempt.choices[q.id];
  return (
    <div className="answer answer--static">
      <span className="answer__prefix">Q{q.n}</span>
      <span className="answer__div" aria-hidden="true" />
      <span className="answer__value">{q.kind !== 'free' ? chosen !== undefined && <Rich text={choiceText(q, chosen)} /> : attempt.answers[q.id]}</span>
      <span className="spacer" />
      {q.kind === 'free' && <span className="answer__unit">{t.unit}</span>}
    </div>
  );
}

export function HandInMain() {
  const test = useStore((s) => s.test);
  const attempt = useStore((s) => s.attempt);
  if (!test || !attempt) return null;
  const n = test.questions.length;
  const answered = test.questions.filter((q) => isAnswered(attempt, q.id));
  const blank = n - answered.length;
  const flagged = Object.values(attempt.flagged).filter(Boolean).length;
  const summary = [answered.length > 3 ? `+ ${answered.length - 3} more` : '', blank ? `${blank} blank` : '', flagged ? `${flagged} flagged` : ''].filter(Boolean).join(' · ');
  return (
    <div className="screen">
      <SectionLabel title="Hand in" meta={`${answered.length} of ${n} answered`} />
      <div className="stack-12">
        <h1 className="t-heading-l">How should we grade it?</h1>
        <p className="t-body-m c-secondary measure">Typed answers are graded instantly. Worked it out on paper? Scan it and we’ll read your working the same way we read your homework.</p>
      </div>
      <div className="handin">
        <section className="stack-12">
          <span className="t-caption c-tertiary">Option A — typed</span>
          <div className="option">
            <h2 className="t-heading-m">Grade my typed answers</h2>
            <p className="t-body-s c-secondary">Instant. Units and significant figures are checked too.</p>
            {answered.length ? (
              <div className="stack-8">
                {answered.slice(0, 3).map((q) => (
                  <AnswerPreview key={q.id} q={q} attempt={attempt} />
                ))}
              </div>
            ) : (
              <p className="t-body-s c-tertiary">No answers yet — everything will count as skipped.</p>
            )}
            {summary && <p className="t-mono-s c-tertiary">{summary}</p>}
            <span className="grow" />
            <Button block trailing="arrowRight" onClick={() => handIn('typed')}>
              Grade now
            </Button>
          </div>
        </section>
        <section className="stack-12">
          <span className="t-caption c-tertiary">Option B — on paper</span>
          <Dropzone
            title="Drop your finished sheet"
            subtitle="Photo or PDF · we match each answer to its question"
            scanTitle="Reading your answers"
            phases={['Matching answers to questions', 'Checking units and significant figures', 'Marking your work']}
            onFile={() => new Promise<void>((done) => window.setTimeout(() => (handIn('paper'), done()), 1800))}
          />
          <p className="notice">
            <Icon name="scan" size={16} />
            Prototype: paper grading reads the answers you typed.
          </p>
        </section>
      </div>
      <div className="row">
        <Button variant="ghost" icon="arrowLeft" onClick={() => go('practice')}>
          Back to the test
        </Button>
        <span className="t-body-s c-tertiary">Blanks count as skipped, not wrong.</span>
      </div>
    </div>
  );
}

export function HandInStatus() {
  const test = useStore((s) => s.test);
  const attempt = useStore((s) => s.attempt);
  if (!test || !attempt) return null;
  return (
    <>
      nothing is graded until you hand in
    </>
  );
}
