import { memo, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { unitLabel } from '../bank/taxonomy';
import { getTemplate } from '../lib/bank';
import { choiceText, fmtAnswer, fmtApprox, promptParts, richParts, workedSteps, type Grade, type Question } from '../lib/problems';
import { answer, choose, nextQuestion, toggleFlag, useStore } from '../lib/store';
import { Button, Icon, IconButton, Tag, TeX } from './ui';

const LETTERS = ['A', 'B', 'C', 'D'];
export const pad = (n: number) => String(n).padStart(2, '0');

/** The prompt, with every value that changed from the original problem set in ink. Maths renders inline with KaTeX. */
export const Prompt = memo(function Prompt({ q }: { q: Question }) {
  const t = getTemplate(q.templateId);
  return (
    <>
      {promptParts(t, q.values, q.dps, true).map((p, i) =>
        'tex' in p ? (
          <TeX key={i} tex={p.tex} />
        ) : p.changed ? (
          <span key={i} className="v">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
});

/** Text with $…$ inline TeX: worded options and their labels. */
export const Rich = memo(function Rich({ text }: { text: string }) {
  if (!text.includes('$')) return <>{text}</>;
  return (
    <>
      {richParts(text).map((p, i) => ('tex' in p ? <TeX key={i} tex={p.tex} /> : <span key={i}>{p.text}</span>))}
    </>
  );
});

function AnswerInput({ q }: { q: Question }) {
  const value = useStore((s) => s.attempt?.answers[q.id] ?? '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), [q.id]);
  return (
    <label className="answer">
      <span className="answer__prefix">Ans</span>
      <span className="answer__div" aria-hidden="true" />
      <input
        ref={ref}
        className="answer__input"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder="Type your answer"
        aria-label="Your answer"
        value={value}
        onChange={(e) => answer(q.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.repeat) {
            e.preventDefault();
            nextQuestion();
          }
        }}
      />
      {getTemplate(q.templateId).unit && <span className="answer__unit">{getTemplate(q.templateId).unit}</span>}
    </label>
  );
}

/** How many options a multiple-choice or worded question has. */
export const optionCount = (q: Question) => (q.kind === 'text' ? (q.options?.length ?? 0) : (q.choices?.length ?? 0));

function Choices({ q }: { q: Question }) {
  const chosen = useStore((s) => s.attempt?.choices[q.id]);
  return (
    <div className={`choices${q.kind === 'text' ? ' choices--text' : ''}`} role="radiogroup" aria-label="Choices">
      {Array.from({ length: optionCount(q) }, (_, i) => (
        <button key={i} type="button" role="radio" aria-checked={chosen === i} className="choice" onClick={() => choose(q.id, i)}>
          <span className="choice__badge">{LETTERS[i]}</span>
          <span className="choice__text">
            <Rich text={choiceText(q, i)} />
          </span>
        </button>
      ))}
    </div>
  );
}

export function QuestionCard({ q, sheetTitle, hintOpen, onHint, isLast }: { q: Question; sheetTitle: string; hintOpen: boolean; onHint: () => void; isLast: boolean }) {
  const t = getTemplate(q.templateId);
  const flagged = useStore((s) => !!s.attempt?.flagged[q.id]);
  // "Variant" when this is the sheet problem itself with new numbers; "Practice" when it's another problem on the same concept.
  const sameProblem = useStore((s) => s.sheet?.problems.find((p) => p.n === q.problemN)?.templateId === t.id);
  return (
    <article className="qcard" aria-label={`Question ${q.n}`}>
      <div className="qcard__body">
        <header className="qcard__head">
          <span className="t-caption c-secondary">{unitLabel(t.concept)}</span>
          <span className="qcard__rule" aria-hidden="true" />
          <IconButton icon="flag" size="s" label={flagged ? 'Unflag (F)' : 'Flag for review (F)'} pressed={flagged} onClick={() => toggleFlag(q.id)} />
        </header>
        <div className="qcard__prov">
          <Tag tone="highlight" icon="shuffle">
            {sameProblem ? 'Variant' : 'Practice'}
          </Tag>
          <span className="t-body-s c-tertiary">
            {q.problemN ? `${sameProblem ? 'of' : 'for'} problem ${q.problemN} · ${sheetTitle}` : sheetTitle}
          </span>
        </div>
        <p className="qcard__prompt t-body-l">
          <Prompt q={q} />
        </p>
        {q.kind === 'free' ? <AnswerInput q={q} /> : <Choices q={q} />}
        <div className="reveal" data-open={hintOpen || undefined} aria-hidden={!hintOpen}>
          <div className="reveal__inner">
            <p className="qcard__hint t-body-s">
              <Icon name="hint" size={16} />
              {t.hint}
            </p>
          </div>
        </div>
      </div>
      <footer className="qcard__foot">
        <Button variant="ghost" icon="hint" onClick={onHint} aria-expanded={hintOpen}>
          {hintOpen ? 'Hide hint' : 'Show hint'}
        </Button>
        <span className="spacer" />
        <Button variant="ghost" onClick={nextQuestion}>
          Skip
        </Button>
        <Button trailing="arrowRight" onClick={nextQuestion}>
          {isLast ? 'Finish' : 'Next question'}
        </Button>
      </footer>
    </article>
  );
}

export function TestProgress({ questions, current, onPick, label, meta, grades }: { questions: Question[]; current?: number; onPick?: (i: number) => void; label: string; meta?: ReactNode; grades?: Record<string, Grade> }) {
  const answers = useStore((s) => s.attempt?.answers);
  const choices = useStore((s) => s.attempt?.choices);
  return (
    <div className="tprog">
      <span className="t-label-s">{label}</span>
      <div className="tprog__segs">
        {questions.map((q, i) => {
          const state = grades
            ? grades[q.id]?.result
            : i === current
              ? 'current'
              : (answers?.[q.id] ?? '').trim() || choices?.[q.id] !== undefined
                ? 'answered'
                : 'upcoming';
          return <button key={q.id} type="button" className={`tprog__seg tprog__seg--${state}`} aria-label={`Question ${i + 1}`} aria-current={i === current ? 'step' : undefined} onClick={() => onPick?.(i)} />;
        })}
      </div>
      {meta && <span className="tprog__meta t-mono-s c-secondary">{meta}</span>}
    </div>
  );
}

export function GradedAnswer({ q, g }: { q: Question; g: Grade }) {
  const typed = useStore((s) => s.attempt?.answers[q.id] ?? '');
  const chosen = useStore((s) => s.attempt?.choices[q.id]);
  const t = getTemplate(q.templateId);
  const unit = t.unit;
  if (q.kind !== 'free') {
    return (
      <div className={`choices${q.kind === 'text' ? ' choices--text' : ''}`}>
        {Array.from({ length: optionCount(q) }, (_, i) => {
          const state = i === q.correct ? 'correct' : i === chosen ? 'incorrect' : '';
          return (
            <div key={i} className={`choice choice--static${state ? ` choice--${state}` : ''}`}>
              <span className="choice__badge">{LETTERS[i]}</span>
              <span className="choice__text">
                <Rich text={choiceText(q, i)} />
              </span>
              {state && <Icon name={state === 'correct' ? 'check' : 'close'} className={`c-${state}`} />}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className={`answer answer--${g.result}`}>
      <span className="answer__prefix">Ans</span>
      <span className="answer__div" aria-hidden="true" />
      <span className="answer__value">{typed.trim() || '—'}</span>
      <span className="spacer" />
      {g.result !== 'correct' && (
        <span className="answer__expected">
          expected {fmtAnswer(t, q.answer)}
          {fmtApprox(t, q.answer) && <span className="c-tertiary"> {fmtApprox(t, q.answer)}</span>}
        </span>
      )}
      {unit && <span className="answer__unit">{unit}</span>}
      {g.result === 'partial' ? <span className="answer__half">½</span> : g.result !== 'skipped' && <Icon name={g.result === 'correct' ? 'check' : 'close'} className={`c-${g.result}`} />}
    </div>
  );
}

export const WorkedSolution = memo(function WorkedSolution({ q }: { q: Question }) {
  const steps = useMemo(() => workedSteps(q), [q]);
  return (
    <section className="worked" aria-label="Worked solution">
      <header className="worked__head">
        <span className="t-label-s c-secondary">Worked solution</span>
        <span className="t-mono-s c-tertiary">{steps.length} steps</span>
      </header>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i} className="step">
            <span className="step__dot" aria-hidden="true" />
            <div className="step__body">
              <TeX tex={s.tex} className={i === steps.length - 1 ? 'is-final' : ''} />
              {s.note && <p className="step__note">{s.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
});
