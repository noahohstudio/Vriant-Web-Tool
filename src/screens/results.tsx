import { useMemo, useState } from 'react';
import { GradedAnswer, Prompt, WorkedSolution } from '../components/question';
import { fmtTime, RailRow } from '../components/shell';
import { Button, Icon, Mark, SectionLabel, Tag } from '../components/ui';
import { fmtSig, POINTS, TEMPLATES, withUnit, type Grade, type Question } from '../lib/problems';
import { fileResults, fmtScore, focusResult, practiceMissed, trySimilar, useStore } from '../lib/store';

const LETTERS = ['A', 'B', 'C', 'D'];

function ResultRow({ q, g, active }: { q: Question; g: Grade; active: boolean }) {
  const typed = useStore((s) => s.attempt?.answers[q.id] ?? '');
  const chosen = useStore((s) => s.attempt?.choices[q.id]);
  const unit = TEMPLATES[q.templateId].unit;
  const detail =
    g.result === 'skipped'
      ? 'Skipped'
      : q.kind === 'choice'
        ? `You chose ${chosen !== undefined ? LETTERS[chosen] : '—'} · answer ${LETTERS[q.correct ?? 0]}`
        : `You wrote ${typed.trim()} · expected ${withUnit(fmtSig(q.answer), unit)}`;
  return (
    <button type="button" className={`result-row${active ? ' is-active' : ''}`} aria-current={active || undefined} onClick={() => focusResult(q.id)}>
      <Mark result={g.result} />
      <span className="result-row__text">
        <span className="t-label-m">
          Q{q.n} · {TEMPLATES[q.templateId].title}
        </span>
        <span className="t-body-s c-tertiary">{detail}</span>
      </span>
      <span className="t-mono-s c-secondary">
        {g.points}/{POINTS}
      </span>
      <Icon name="chevronRight" size={16} className="c-tertiary" />
    </button>
  );
}

export function ResultsMain() {
  const test = useStore((s) => s.test);
  const results = useStore((s) => s.results);
  const focus = useStore((s) => s.focus);
  const classes = useStore((s) => s.classes);
  const [classId, setClassId] = useState(() => test?.classId ?? classes[0]?.id ?? '');
  const toReview = useMemo(() => (test && results ? test.questions.filter((q) => results.grades[q.id].result !== 'correct') : []), [test, results]);
  if (!test || !results) return null;

  const n = test.questions.length;
  const pct = Math.round((results.score / n) * 100);
  const miss = toReview.length;
  const q = test.questions.find((x) => x.id === focus) ?? test.questions[0];
  const g = results.grades[q.id];
  const message =
    pct >= 90
      ? 'Excellent. Nothing left to fix.'
      : pct >= 70
        ? `Solid work. ${miss === 1 ? 'One is' : `${miss} are`} worth another look.`
        : pct >= 40
          ? `Good start — let’s look at the ${miss} you missed.`
          : 'A tough set. The worked solutions will help.';
  const nextResult = () => {
    const list = toReview.length ? toReview : test.questions;
    const i = list.findIndex((x) => x.id === q.id);
    focusResult(list[(i + 1) % list.length].id);
  };

  return (
    <div className="screen screen--split">
      <section className="split__left">
        <SectionLabel index="04" title="Score" meta={results.via === 'paper' ? 'from your sheet' : 'from typed answers'} />
        <div className="score">
          <span className="t-mono-label c-tertiary">{test.title}</span>
          <div className="score__top">
            <span className="t-numeral">
              {fmtScore(results.score)}
              <span className="c-tertiary">/{n}</span>
            </span>
            <div className="score__msg">
              <Tag tone="accent">{pct}%</Tag>
              <p className="t-body-m c-secondary">{message}</p>
            </div>
          </div>
          <div className="score__bar" aria-hidden="true">
            {(['correct', 'partial', 'incorrect', 'skipped'] as const).map((r) =>
              results.counts[r] ? <i key={r} className={`score__seg score__seg--${r}`} style={{ flexGrow: results.counts[r] }} /> : null,
            )}
          </div>
          <div className="score__legend t-mono-s c-secondary">
            <span>
              <i className="dot" style={{ background: 'var(--status-correct)' }} />
              {results.counts.correct} correct
            </span>
            {results.counts.partial > 0 && (
              <span>
                <i className="dot" style={{ background: 'var(--status-partial)' }} />
                {results.counts.partial} partial
              </span>
            )}
            <span>
              <i className="dot" style={{ background: 'var(--status-incorrect)' }} />
              {results.counts.incorrect + results.counts.skipped} to review
            </span>
          </div>
          <div className="row">
            <Button size="s" disabled={!miss} onClick={() => toReview[0] && focusResult(toReview[0].id)}>
              Review mistakes
            </Button>
            <Button size="s" variant="secondary" icon="shuffle" disabled={!miss} onClick={practiceMissed}>
              Practice these again
            </Button>
          </div>
        </div>

        <SectionLabel index="05" title="To review" meta={String(miss)} />
        {miss ? (
          <div className="rows">
            {toReview.map((x) => (
              <ResultRow key={x.id} q={x} g={results.grades[x.id]} active={x.id === q.id} />
            ))}
          </div>
        ) : (
          <p className="t-body-s c-tertiary">Nothing to review — every answer was right.</p>
        )}

        <div className="keep">
          <div className="stack-4">
            <span className="t-label-m">Keep it?</span>
            <span className="t-body-s c-tertiary">File the test and its sheet under a class. Otherwise it’s gone when you close the tab.</span>
          </div>
          <div className="keep__row">
            <label className="field__box field__box--s">
              <select className="field__input" value={classId} aria-label="Class" onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={16} className="c-tertiary" />
            </label>
            <Button variant="secondary" icon={results.filed ? 'check' : 'folder'} disabled={results.filed} onClick={() => fileResults(classId)}>
              {results.filed ? 'Filed' : 'Archive it'}
            </Button>
          </div>
        </div>
      </section>

      <div className="split__rule" aria-hidden="true" />

      <section className="split__right detail" key={q.id}>
        <SectionLabel index="06" title={`Q${q.n} · ${TEMPLATES[q.templateId].title}`} meta={`${g.points} / ${POINTS} pts`} />
        <p className="t-body-m">
          <Prompt q={q} />
        </p>
        <GradedAnswer q={q} g={g} />
        <p className={`feedback feedback--${g.result}`}>{g.feedback}</p>
        <WorkedSolution q={q} />
        <div className="row">
          <Button variant="secondary" icon="shuffle" onClick={() => trySimilar(q.id)}>
            Try a similar one
          </Button>
          <Button trailing="arrowRight" onClick={nextResult}>
            Next result
          </Button>
        </div>
      </section>
    </div>
  );
}

export function ResultsRail() {
  const test = useStore((s) => s.test);
  const results = useStore((s) => s.results);
  const focus = useStore((s) => s.focus);
  if (!test || !results) return null;
  return (
    <>
      <SectionLabel index="01" title="Results" meta={`${fmtScore(results.score)} / ${test.questions.length}`} />
      <div className="rail-list">
        {test.questions.map((q) => {
          const g = results.grades[q.id];
          return <RailRow key={q.id} mark={g.result} label={TEMPLATES[q.templateId].title} meta={`${g.points}/${POINTS}`} active={q.id === focus} onClick={() => focusResult(q.id)} />;
        })}
      </div>
    </>
  );
}

export function ResultsStatus() {
  const results = useStore((s) => s.results);
  return <>{results ? `graded ${fmtTime(results.gradedAt)}` : ''}</>;
}
