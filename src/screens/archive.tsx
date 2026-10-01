import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { countBy, fmtDate, plural, RailRow } from '../components/shell';
import { Button, ClassTag, Icon, Menu, MenuItem, SectionLabel, Segmented, Tag } from '../components/ui';
import { addClass, deleteClass, deleteItem, HUES, moveItem, openArchived, renameClass, setActiveClass, setClassHue, UNSORTED, useStore, type ArchiveItem, type ClassItem } from '../lib/store';

type Filter = 'all' | 'graded' | 'ungraded';
const hueVar = (cls: ClassItem) => ({ '--hue': `var(--tag-${cls.hue})` }) as CSSProperties;

/** Inline name editor: Enter or blur saves, Esc cancels. */
function NameInput({ initial, placeholder, className, onDone }: { initial: string; placeholder?: string; className: string; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const finish = (value: string | null) => {
    if (finished.current) return;
    finished.current = true;
    onDone(value);
  };
  return (
    <input
      ref={ref}
      className={className}
      defaultValue={initial}
      placeholder={placeholder}
      aria-label="Class name"
      maxLength={40}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(e.currentTarget.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(null);
        }
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
    />
  );
}

// ——— Class menu: rename, colour, delete (shared by folder cards and rail rows) ———
function ClassMenuBody({ cls, count, close, onRename }: { cls: ClassItem; count: number; close: () => void; onRename: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const fixed = cls.id === UNSORTED;
  if (confirm) {
    return (
      <>
        <p className="menu__prompt">
          Delete “{cls.name}”?{count ? ` Its ${plural(count, 'sheet')} will move to Unsorted.` : ''}
        </p>
        <MenuItem
          icon="trash"
          danger
          onSelect={() => {
            close();
            deleteClass(cls.id);
          }}
        >
          Delete class
        </MenuItem>
        <MenuItem icon="close" onSelect={() => setConfirm(false)}>
          Keep it
        </MenuItem>
      </>
    );
  }
  return (
    <>
      {!fixed && (
        <MenuItem
          icon="edit"
          onSelect={() => {
            close();
            onRename();
          }}
        >
          Rename
        </MenuItem>
      )}
      <p className="menu__note">Colour</p>
      <div className="menu__hues" role="group" aria-label="Class colour">
        {HUES.map((h) => (
          <button
            key={h}
            type="button"
            className={`hue${h === cls.hue ? ' is-on' : ''}`}
            style={{ '--hue': `var(--tag-${h})` } as CSSProperties}
            aria-label={h}
            aria-pressed={h === cls.hue}
            onClick={() => {
              setClassHue(cls.id, h);
              close();
            }}
          />
        ))}
      </div>
      <div className="menu__divider" />
      {fixed ? (
        <p className="menu__prompt">Unsorted catches sheets from removed classes, so it can’t be renamed or deleted.</p>
      ) : (
        <MenuItem icon="trash" danger onSelect={() => setConfirm(true)}>
          Delete class…
        </MenuItem>
      )}
    </>
  );
}

const ClassMenu = ({ cls, count, onRename }: { cls: ClassItem; count: number; onRename: () => void }) => (
  <Menu label={`Options for ${cls.name}`}>{(close) => <ClassMenuBody cls={cls} count={count} close={close} onRename={onRename} />}</Menu>
);

function FolderCard({ cls, count, active, onOpen }: { cls: ClassItem; count: number; active: boolean; onOpen: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={`folder${active ? ' is-active' : ''}`} style={hueVar(cls)}>
      <button type="button" className="folder__hit" aria-label={`Show ${cls.name}`} aria-current={active || undefined} onClick={onOpen} />
      <span className="folder__tab" aria-hidden="true" />
      {editing ? (
        <NameInput
          className="folder__input"
          initial={cls.name}
          onDone={(name) => {
            setEditing(false);
            if (name !== null) renameClass(cls.id, name);
          }}
        />
      ) : (
        <span className="folder__name t-heading-s">{cls.name}</span>
      )}
      <span className="folder__count t-body-s c-tertiary">{plural(count, 'sheet')}</span>
      <span className="folder__sheets" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className="folder__menu">
        <ClassMenu cls={cls} count={count} onRename={() => setEditing(true)} />
      </div>
    </div>
  );
}

function NewClassTile() {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="folder folder--new is-editing">
        <span className="t-caption c-tertiary">New class</span>
        <NameInput
          className="folder__input"
          initial=""
          placeholder="Class name"
          onDone={(name) => {
            setEditing(false);
            if (name?.trim()) addClass(name);
          }}
        />
        <span className="t-body-s c-tertiary">Enter to create · Esc to cancel</span>
      </div>
    );
  }
  return (
    <button type="button" className="folder folder--new" onClick={() => setEditing(true)}>
      <Icon name="plus" />
      <span className="t-label-m">New class</span>
    </button>
  );
}

// ——— Sheet rows ———
function SheetMenuBody({ item, close }: { item: ArchiveItem; close: () => void }) {
  const classes = useStore((s) => s.classes);
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <>
        <p className="menu__prompt">Delete “{item.title}”?</p>
        <MenuItem
          icon="trash"
          danger
          onSelect={() => {
            close();
            deleteItem(item.id);
          }}
        >
          Yes, delete it
        </MenuItem>
        <MenuItem icon="close" onSelect={() => setConfirm(false)}>
          Keep it
        </MenuItem>
      </>
    );
  }
  const hasTest = !!item.data?.test;
  return (
    <>
      {hasTest && (
        <MenuItem
          icon="arrowRight"
          onSelect={() => {
            close();
            openArchived(item.id, 'results');
          }}
        >
          Review results
        </MenuItem>
      )}
      {item.data && (
        <MenuItem
          icon="shuffle"
          onSelect={() => {
            close();
            openArchived(item.id, 'newTest');
          }}
        >
          New test from this sheet
        </MenuItem>
      )}
      {item.data && <div className="menu__divider" />}
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
  );
}

function SheetRow({ item }: { item: ArchiveItem }) {
  const cls = useStore((s) => s.classes.find((c) => c.id === item.classId));
  const openable = !!item.data;
  const action = item.data?.test ? 'Review results' : 'Make a new test';
  return (
    <li className={`sheet-row${openable ? ' sheet-row--open' : ''}`}>
      {openable && <button type="button" className="sheet-row__hit" aria-label={`${action}: ${item.title}`} onClick={() => openArchived(item.id, item.data?.test ? 'results' : 'newTest')} />}
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
            {fmtDate(item.createdAt)}
          </span>
        </span>
      </span>
      <span className="sheet-row__end">
        <Tag tone={item.tone}>{item.label}</Tag>
        {openable && (
          <span className="sheet-row__go" aria-hidden="true">
            {action}
            <Icon name="chevronRight" size={16} />
          </span>
        )}
      </span>
      <Menu label={`Actions for ${item.title}`}>{(close) => <SheetMenuBody item={item} close={close} />}</Menu>
    </li>
  );
}

// ——— Screen ———
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
      <SectionLabel title="Archive" />
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
          <FolderCard
            key={c.id}
            cls={c}
            count={counts[c.id] ?? 0}
            active={c.id === cls?.id && !query}
            onOpen={() => {
              setQuery('');
              setActiveClass(c.id);
            }}
          />
        ))}
        <NewClassTile />
      </div>
      <SectionLabel title={query ? 'Search' : (cls?.name ?? 'Archive')} />
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

function RailClass({ cls, count, active }: { cls: ClassItem; count: number; active: boolean }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <NameInput
        className="rail-add__input"
        initial={cls.name}
        onDone={(name) => {
          setEditing(false);
          if (name !== null) renameClass(cls.id, name);
        }}
      />
    );
  }
  return (
    <div className="rail-item">
      <RailRow dot={`var(--tag-${cls.hue})`} label={cls.name} active={active} onClick={() => setActiveClass(cls.id)} />
      <div className="rail-item__menu">
        <ClassMenu cls={cls} count={count} onRename={() => setEditing(true)} />
      </div>
    </div>
  );
}

export function ArchiveRail() {
  const classes = useStore((s) => s.classes);
  const items = useStore((s) => s.items);
  const activeClass = useStore((s) => s.activeClass);
  const counts = useMemo(() => countBy(items), [items]);
  const [adding, setAdding] = useState(false);
  return (
    <>
      <SectionLabel title="Classes" />
      <div className="rail-list">
        {classes.map((c) => (
          <RailClass key={c.id} cls={c} count={counts[c.id] ?? 0} active={c.id === activeClass} />
        ))}
      </div>
      {adding ? (
        <NameInput
          className="rail-add__input"
          initial=""
          placeholder="Class name, then Enter"
          onDone={(name) => {
            setAdding(false);
            if (name?.trim()) addClass(name);
          }}
        />
      ) : (
        <Button variant="ghost" size="s" icon="plus" onClick={() => setAdding(true)}>
          New class
        </Button>
      )}
    </>
  );
}

export function ArchiveStatus() {
  return (
    <>
      stored on this device
    </>
  );
}
