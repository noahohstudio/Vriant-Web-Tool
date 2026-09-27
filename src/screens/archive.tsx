import { useMemo, useState, type CSSProperties } from 'react';
import { countBy, fmtDate, plural, RailRow } from '../components/shell';
import { Button, ClassTag, Icon, Menu, MenuItem, SectionLabel, Segmented, Tag } from '../components/ui';
import { addClass, deleteItem, moveItem, setActiveClass, useStore, type ArchiveItem } from '../lib/store';

type Filter = 'all' | 'graded' | 'ungraded';

function SheetRow({ item }: { item: ArchiveItem }) {
  const classes = useStore((s) => s.classes);
  const [confirm, setConfirm] = useState(false);
  const cls = classes.find((c) => c.id === item.classId);
  return (
    <li className="sheet-row">
      <span className="sheet-row__thumb" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sheet-row__text">
        <span className="t-label-m">{item.title}</span>
        <span className="sheet-row__meta">
          {cls && <ClassTag hue={cls.hue}>{cls.name}</ClassTag>}
          <span className="t-body-s c-tertiary">
            {item.detail} · {fmtDate(item.createdAt)}
          </span>
        </span>
      </span>
      <Tag tone={item.tone}>{item.label}</Tag>
      <Menu label={`Actions for ${item.title}`}>
        {(close) =>
          confirm ? (
            <>
              <p className="menu__note">Delete “{item.title}”?</p>
              <MenuItem
                icon="trash"
                danger
                onSelect={() => {
                  close();
                  setConfirm(false);
                  deleteItem(item.id);
                }}
              >
                Yes, delete it
              </MenuItem>
              <MenuItem icon="close" onSelect={() => setConfirm(false)}>
                Keep it
              </MenuItem>
            </>
          ) : (
            <>
              <p className="menu__note">Move to</p>
              {classes
                .filter((c) => c.id !== item.classId)
                .map((c) => (
                  <MenuItem
                    key={c.id}
                    icon="folder"
                    onSelect={() => {
                      close();
                      moveItem(item.id, c.id);
                    }}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              <div className="menu__divider" />
              <MenuItem icon="trash" danger onSelect={() => setConfirm(true)}>
                Delete…
              </MenuItem>
            </>
          )
        }
      </Menu>
    </li>
  );
}

export function ArchiveMain() {
  const classes = useStore((s) => s.classes);
  const items = useStore((s) => s.items);
  const activeClass = useStore((s) => s.activeClass);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const cls = classes.find((c) => c.id === activeClass) ?? classes[0];
  const counts = useMemo(() => countBy(items), [items]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (q ? i.title.toLowerCase().includes(q) : i.classId === cls?.id))
      .filter((i) => filter === 'all' || (filter === 'graded') === (i.tone !== 'neutral'))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, query, filter, cls]);

  return (
    <div className="screen">
      <SectionLabel index="02" title="Archive" meta={plural(items.length, 'sheet')} />
      <div className="toolbar">
        <label className="field__box search">
          <Icon name="search" size={16} className="c-tertiary" />
          <input className="field__input" type="search" placeholder="Search sheets" aria-label="Search sheets" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <Segmented<Filter>
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'graded', label: 'Graded' },
            { value: 'ungraded', label: 'Not graded' },
          ]}
        />
      </div>
      <div className="folders">
        {classes.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`folder${c.id === cls?.id && !query ? ' is-active' : ''}`}
            style={{ '--hue': `var(--tag-${c.hue})` } as CSSProperties}
            onClick={() => {
              setQuery('');
              setActiveClass(c.id);
            }}
          >
            <span className="folder__tab" aria-hidden="true" />
            <span className="t-heading-s">{c.name}</span>
            <span className="t-body-s c-tertiary">{plural(counts[c.id] ?? 0, 'sheet')}</span>
            <span className="folder__sheets" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        ))}
      </div>
      <SectionLabel index="03" title={query ? 'Search' : (cls?.name ?? 'Archive')} meta={plural(list.length, 'sheet')} />
      {list.length ? (
        <ul className="rows">
          {list.map((i) => (
            <SheetRow key={i.id} item={i} />
          ))}
        </ul>
      ) : (
        <p className="empty t-body-s c-tertiary">{query ? 'Nothing matches that search.' : 'Nothing filed here yet. Finish a practice test and choose “Archive it”.'}</p>
      )}
    </div>
  );
}

export function ArchiveRail() {
  const classes = useStore((s) => s.classes);
  const items = useStore((s) => s.items);
  const activeClass = useStore((s) => s.activeClass);
  const counts = useMemo(() => countBy(items), [items]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  return (
    <>
      <SectionLabel index="01" title="Classes" meta={String(classes.length)} />
      <div className="rail-list">
        {classes.map((c) => (
          <RailRow key={c.id} dot={`var(--tag-${c.hue})`} label={c.name} meta={String(counts[c.id] ?? 0)} active={c.id === activeClass} onClick={() => setActiveClass(c.id)} />
        ))}
      </div>
      {adding ? (
        <form
          className="rail-add"
          onSubmit={(e) => {
            e.preventDefault();
            addClass(name);
            setName('');
            setAdding(false);
          }}
        >
          <input autoFocus className="rail-add__input" placeholder="Class name, then Enter" aria-label="New class name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !name.trim() && setAdding(false)} />
        </form>
      ) : (
        <Button variant="ghost" size="s" icon="plus" onClick={() => setAdding(true)}>
          New class
        </Button>
      )}
    </>
  );
}

export function ArchiveStatus() {
  const items = useStore((s) => s.items);
  const classes = useStore((s) => s.classes);
  return (
    <>
      {plural(items.length, 'sheet')} · {classes.length} {classes.length === 1 ? 'class' : 'classes'} · stored on this device
    </>
  );
}
