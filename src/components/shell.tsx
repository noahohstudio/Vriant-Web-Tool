import { useEffect, useState, type ReactNode } from 'react';
import type { Result } from '../lib/problems';
import { dismissToast, go, resetDemo, setTheme, useStore, type ArchiveItem, type Theme, type Toast } from '../lib/store';
import { Button, Icon, Logo, Mark, Menu, MenuItem, Segmented, type IconName } from './ui';

const THEMES: { value: Theme; label: string; icon: IconName; iconOnly: true }[] = [
  { value: 'signature', label: 'Signature', icon: 'signature', iconOnly: true },
  { value: 'light', label: 'Light', icon: 'sun', iconOnly: true },
  { value: 'dark', label: 'Dark', icon: 'moon', iconOnly: true },
];

/** Fixed-width icons, so nothing shifts; each theme's name shows as a tooltip after a short hover. */
function ThemeSwitch() {
  const theme = useStore((s) => s.theme);
  return <Segmented label="Theme" className="seg--theme" options={THEMES} value={theme} onChange={setTheme} />;
}

/** The current section's tab is inert: clicking where you already are does nothing. */
function NavItem({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="nav-item" aria-current={active ? 'page' : undefined} disabled={disabled} onClick={active ? undefined : onClick}>
      {label}
    </button>
  );
}

export function Header() {
  const route = useStore((s) => s.route);
  const hasTest = useStore((s) => !!s.test);
  const hasResults = useStore((s) => !!s.results);
  const section = route === 'intake' || route === 'review' ? 'intake' : route === 'archive' ? 'archive' : 'practice';
  return (
    <header className="header">
      <div className="header__brand">
        <button type="button" className="logo-btn" aria-label="Vriant — go to intake" onClick={() => go('intake')}>
          <Logo />
        </button>
      </div>
      <nav className="header__nav" aria-label="Main">
        <NavItem label="Intake" active={section === 'intake'} onClick={() => go('intake')} />
        <NavItem label="Practice" active={section === 'practice'} disabled={!hasTest} onClick={() => go(hasResults ? 'results' : 'practice')} />
        <NavItem label="Archive" active={section === 'archive'} onClick={() => go('archive')} />
      </nav>
      <div className="header__actions">
        <ThemeSwitch />
        <Menu label="Settings" icon="sliders" size="m">
          {(close) => (
            <MenuItem
              icon="refresh"
              onSelect={() => {
                close();
                resetDemo();
              }}
            >
              Reset demo data
            </MenuItem>
          )}
        </Menu>
        <Button size="s" icon="plus" onClick={() => go('intake')}>
          New sheet
        </Button>
      </div>
    </header>
  );
}

export function RailRow({
  index,
  dot,
  mark,
  label,
  meta,
  metaTone,
  active,
  muted,
  onClick,
}: {
  index?: string;
  dot?: string;
  mark?: Result;
  label: ReactNode;
  meta?: ReactNode;
  metaTone?: 'partial' | 'accent';
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      {index && <span className="rail-row__idx">{index}</span>}
      {dot && <span className="dot" style={{ background: dot }} />}
      {mark && <Mark result={mark} small />}
      <span className="rail-row__label">{label}</span>
      {meta !== undefined && <span className={`rail-row__meta${metaTone ? ` c-${metaTone}` : ''}`}>{meta}</span>}
    </>
  );
  const cls = `rail-row${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}`;
  return onClick ? (
    <button type="button" className={cls} aria-current={active || undefined} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function ToastHost() {
  const current = useStore((s) => s.toast);
  const [shown, setShown] = useState<Toast | null>(current);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (current) {
      setShown(current);
      setLeaving(false);
      const t = window.setTimeout(() => setLeaving(true), 5000);
      return () => window.clearTimeout(t);
    }
    setLeaving(true);
  }, [current]);

  useEffect(() => {
    if (!leaving || !shown) return;
    const t = window.setTimeout(() => {
      dismissToast(shown.id);
      setShown(null);
      setLeaving(false);
    }, 180);
    return () => window.clearTimeout(t);
  }, [leaving, shown]);

  if (!shown) return null;
  return (
    <div className={`toast${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <Icon name="check" size={16} />
      <span>{shown.message}</span>
      {shown.undo && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            shown.undo?.();
            setLeaving(true);
          }}
        >
          Undo
        </button>
      )}
    </div>
  );
}

/** Ticks once a second; only this text node re-renders. */
export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return (
    <>
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </>
  );
}

export const countBy = (items: ArchiveItem[]) =>
  items.reduce<Record<string, number>>((m, i) => {
    m[i.classId] = (m[i.classId] ?? 0) + 1;
    return m;
  }, {});
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const fmtDate = (t: number) => new Date(t).toLocaleDateString('en', { month: 'short', day: 'numeric' });
export const fmtTime = (t: number) => new Date(t).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
