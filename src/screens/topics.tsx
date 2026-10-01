import { useEffect, useMemo, useRef, useState } from 'react';
import { CONCEPTS, COURSES, type Concept, type Course } from '../bank/taxonomy';
import { RailRow } from '../components/shell';
import { Button, Checkbox, Icon, SectionLabel, Tag, usePresence } from '../components/ui';
import { clearPicks, go, practiceTopics, togglePick, useStore } from '../lib/store';
import { courseReady, isReady, searchConcepts, suggestionsFor, suggestionsForQuery } from '../lib/topics';

/** Shown wherever a concept has no practice problems yet: says so plainly and offers the closest ready ones. */
export function NotYet({ concept, query, onPick }: { concept?: Concept; query?: string; onPick: (id: string) => void }) {
  const picked = useStore((s) => s.picked);
  const suggestions = useMemo(() => (concept ? suggestionsFor(concept) : suggestionsForQuery(query ?? '')), [concept, query]);
  return (
    <div className="notyet" role="status">
      <p className="notyet__title">
        <Icon name="hint" size={16} />
        Not in Vriant yet
      </p>
      <p className="t-body-s c-secondary">
        {concept ? (
          <>
            “{concept.name}” is planned for {concept.course.name}, but its practice problems haven’t been written yet.
          </>
        ) : (
          <>We don’t have practice problems for “{query?.trim()}” yet.</>
        )}
      </p>
      {suggestions.length > 0 && (
        <>
          <p className="t-caption c-tertiary">Closest topics you can practice now</p>
          <div className="notyet__actions">
            {suggestions.map((s) => (
              <Button key={s.id} variant="secondary" size="s" icon={picked.includes(s.id) ? 'check' : 'plus'} onClick={() => onPick(s.id)}>
                {s.name}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Choose a detected problem's topic: the likeliest ones first, then a search over every concept. */
export function TopicPicker({ current, candidates, onPick, label }: { current: string | null; candidates: string[]; onPick: (id: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const presence = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const likely = candidates.map((id) => CONCEPTS.get(id)).filter((c): c is Concept => !!c);
  const found = query.trim() ? searchConcepts(query).slice(0, 6).map((r) => r.concept) : [];
  const list = query.trim() ? found : likely;
  const choose = (id: string) => {
    onPick(id);
    setOpen(false);
    setQuery('');
  };
  return (
    <div className="menu-wrap" ref={ref}>
      <Button variant="ghost" size="s" trailing="chevronDown" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
      </Button>
      {presence.mounted && (
        <div className={`menu picker${presence.closing ? ' is-closing' : ''}`} role="dialog" aria-label="Choose a topic">
          <label className="field__box field__box--s picker__search">
            <Icon name="search" size={16} className="c-tertiary" />
            <input className="field__input" type="search" placeholder="Search all topics" aria-label="Search all topics" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          </label>
          <p className="menu__note">{query.trim() ? (found.length ? 'Matches' : 'No matches') : likely.length ? 'Likely topics' : 'Type to search'}</p>
          {list.map((c) => (
            <button key={c.id} type="button" className={`menu__item picker__item${c.id === current ? ' is-current' : ''}`} onClick={() => choose(c.id)}>
              <Icon name={c.id === current ? 'check' : isReady(c) ? 'plus' : 'minus'} size={16} />
              <span className="picker__name">{c.name}</span>
              <span className="picker__meta">{isReady(c) ? c.course.name.split(':')[0] : 'not yet'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConceptRow({ c, open, onToggleOpen }: { c: Concept; open: boolean; onToggleOpen: () => void }) {
  const picked = useStore((s) => s.picked.includes(c.id));
  const ready = isReady(c);
  return (
    <li className={`topic-row${ready ? '' : ' is-off'}`}>
      <div className="topic-row__main">
        {ready ? (
          <Checkbox checked={picked} onChange={() => togglePick(c.id)}>
            {c.name}
          </Checkbox>
        ) : (
          <span className="topic-row__name">{c.name}</span>
        )}
        <span className="spacer" />
        <span className="t-body-s c-tertiary topic-row__meta">
          {c.course.name.split(':')[0]} · {c.unit.label}
        </span>
        {!ready && (
          <>
            <Tag tone="neutral">Not yet</Tag>
            <Button variant="ghost" size="s" onClick={onToggleOpen} aria-expanded={open}>
              {open ? 'Hide' : 'Similar'}
            </Button>
          </>
        )}
      </div>
      {!ready && open && <NotYet concept={c} onPick={togglePick} />}
    </li>
  );
}

function ConceptList({ concepts }: { concepts: Concept[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="topic-list">
      {concepts.map((c) => (
        <ConceptRow key={c.id} c={c} open={open === c.id} onToggleOpen={() => setOpen((o) => (o === c.id ? null : c.id))} />
      ))}
    </ul>
  );
}

function CourseGrid({ onOpen }: { onOpen: (id: string) => void }) {
  const picked = useStore((s) => s.picked);
  const ordered = [...COURSES].sort((a, b) => Number(courseReady(b)) - Number(courseReady(a)));
  return (
    <div className="course-grid">
      {ordered.map((c) => {
        const concepts = c.units.flatMap((u) => u.concepts);
        const here = concepts.filter((k) => picked.includes(k.id)).length;
        return (
          <button key={c.id} type="button" className={`course-card${courseReady(c) ? '' : ' is-off'}`} onClick={() => onOpen(c.id)}>
            <span className="t-heading-s">{c.name}</span>
            <span className="course-card__meta t-body-s">
              {courseReady(c) ? 'Ready' : 'Not in Vriant yet'}
              {here ? ' · some picked' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CourseTopics({ course, onBack }: { course: Course; onBack: () => void }) {
  const ready = courseReady(course);
  return (
    <div className="stack-12">
      <div className="row">
        <Button variant="ghost" size="s" icon="arrowLeft" onClick={onBack}>
          All courses
        </Button>
      </div>
      <SectionLabel title={course.name} meta={ready ? undefined : 'not in Vriant yet'} />
      {!ready && <p className="t-body-s c-secondary measure">This course’s practice problems haven’t been written yet. Here’s what it will cover — open any topic to see similar ones you can practice now.</p>}
      {course.units.map((u) => (
        <section key={u.id}>
          <p className="topic-unit">{u.name}</p>
          <ConceptList concepts={u.concepts} />
        </section>
      ))}
    </div>
  );
}

function SearchResults({ query }: { query: string }) {
  const results = useMemo(() => searchConcepts(query), [query]);
  const strong = results.filter((r) => r.full);
  // Nothing matches every word: say so first, then show the partial matches.
  const readyStrong = strong.filter((r) => isReady(r.concept));
  return (
    <div className="stack-12">
      {/* A recognised concept that isn't built yet is named, with its course; anything else echoes the query. */}
      {!readyStrong.length && (strong[0] ? <NotYet concept={strong[0].concept} onPick={togglePick} /> : <NotYet query={query} onPick={togglePick} />)}
      {(strong.length ? strong : results).length > 0 && (
        <>
          <SectionLabel title={strong.length ? 'Matches' : 'Partial matches'} />
          <ConceptList concepts={(strong.length ? strong : results).slice(0, 24).map((r) => r.concept)} />
        </>
      )}
    </div>
  );
}

// ——— Screen ———
export function TopicsMain() {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<string | null>(null);
  const open = COURSES.find((c) => c.id === course);
  return (
    <div className="screen">
      <SectionLabel title="Topics" />
      <div className="stack-12">
        <h1 className="t-heading-l">What are you studying?</h1>
        <p className="t-body-l c-secondary measure">Search for a concept in your own words, or browse by course. Pick a few, then make a practice test.</p>
      </div>
      <div className="toolbar">
        <label className="field__box search topics__search">
          <Icon name="search" size={16} className="c-tertiary" />
          <input className="field__input" type="search" placeholder="Try “projectile motion” or “related rates”" aria-label="Search topics" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        </label>
        <Button variant="ghost" icon="upload" onClick={() => go('intake')}>
          Upload a sheet instead
        </Button>
      </div>
      {query.trim() ? <SearchResults query={query} /> : open ? <CourseTopics course={open} onBack={() => setCourse(null)} /> : <CourseGrid onOpen={setCourse} />}
    </div>
  );
}

export function TopicsRail() {
  const picked = useStore((s) => s.picked);
  const concepts = picked.map((id) => CONCEPTS.get(id)).filter((c): c is Concept => !!c);
  const ready = concepts.filter(isReady);
  return (
    <>
      <SectionLabel title="Picked" />
      {concepts.length ? (
        <>
          <div className="rail-list">
            {concepts.map((c) => (
              <RailRow key={c.id} dot={isReady(c) ? 'var(--accent-default)' : 'var(--line-strong)'} label={c.name} meta={isReady(c) ? undefined : 'not yet'} muted={!isReady(c)} onClick={() => togglePick(c.id)} />
            ))}
          </div>
          <p className="t-body-s c-tertiary rail-note">Click a topic to remove it.</p>
        </>
      ) : (
        <p className="t-body-s c-tertiary rail-note">Nothing yet. Tick topics to add them.</p>
      )}
      <div className="rail-actions">
        <Button block trailing="arrowRight" disabled={!ready.length} onClick={() => practiceTopics()}>
          Make a practice test
        </Button>
        {concepts.length > 0 && (
          <Button variant="ghost" size="s" onClick={clearPicks}>
            Clear all
          </Button>
        )}
      </div>
      <SectionLabel title="Coverage" />
      <div className="rail-list">
        {COURSES.map((c) => (
          <RailRow key={c.id} dot={courseReady(c) ? 'var(--status-correct)' : 'var(--line-strong)'} label={c.name} meta={courseReady(c) ? 'ready' : 'later'} muted={!courseReady(c)} />
        ))}
      </div>
    </>
  );
}

export function TopicsStatus() {
  const picked = useStore((s) => s.picked.length);
  return (
    <>
      {picked ? 'topics picked' : 'nothing picked yet'} · courses marked “not yet” are still being written
    </>
  );
}
