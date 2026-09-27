import { memo, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import type { Result } from '../lib/problems';
import type { Hue, Tone } from '../lib/store';

// ——— Icons: the 20px / 1.5 stroke set from the Figma library ———
const ICONS = {
  upload: '<path d="M10 13V3.5M6 7.5l4-4 4 4"/><path d="M3.5 12.5V15c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5v-2.5"/>',
  download: '<path d="M10 3.5V13M6 9l4 4 4-4"/><path d="M3.5 12.5V15c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5v-2.5"/>',
  camera: '<path d="M3 7.5C3 6.67 3.67 6 4.5 6h2l1.2-2h4.6l1.2 2h2c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-11C3.67 16 3 15.33 3 14.5z"/><circle cx="10" cy="10.5" r="2.75"/>',
  scan: '<path d="M3 7V5c0-1.1.9-2 2-2h2M13 3h2c1.1 0 2 .9 2 2v2M17 13v2c0 1.1-.9 2-2 2h-2M7 17H5c-1.1 0-2-.9-2-2v-2M3 10h14"/>',
  sheet: '<path d="M11.5 2.75h-6C4.67 2.75 4 3.42 4 4.25v11.5c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-8.5z"/><path d="M11.5 2.75v4.5H16M7 10.5h6M7 13.5h4"/>',
  plus: '<path d="M10 4v12M4 10h12"/>',
  minus: '<path d="M4 10h12"/>',
  check: '<path d="M4.5 10.5 8 14l7.5-8"/>',
  close: '<path d="m5 5 10 10M15 5 5 15"/>',
  arrowRight: '<path d="M4 10h12M11 5l5 5-5 5"/>',
  arrowLeft: '<path d="M16 10H4M9 5l-5 5 5 5"/>',
  chevronDown: '<path d="M5.5 8 10 12.5 14.5 8"/>',
  chevronRight: '<path d="M8 5.5 12.5 10 8 14.5"/>',
  folder: '<path d="M2.75 6.25c0-1.1.9-2 2-2h3.1l1.8 1.8h5.6c1.1 0 2 .9 2 2v6.7c0 1.1-.9 2-2 2H4.75c-1.1 0-2-.9-2-2z"/>',
  sun: '<circle cx="10" cy="10" r="3"/><path d="M10 2.5V4M10 16v1.5M2.5 10H4M16 10h1.5M4.7 4.7l1.06 1.06M14.24 14.24l1.06 1.06M4.7 15.3l1.06-1.06M14.24 5.76l1.06-1.06"/>',
  moon: '<path d="M16.5 12.2A6.75 6.75 0 0 1 7.8 3.5a6.75 6.75 0 1 0 8.7 8.7z"/>',
  signature: '<path d="M3.5 16.5h13v-13z"/>',
  timer: '<circle cx="10" cy="10.75" r="6.25"/><path d="M10 7.5v3.25l2.25 1.5M8 2.75h4"/>',
  shuffle: '<path d="M3 6.5h2.2c1.4 0 2.7.7 3.5 1.9l2.6 3.2c.8 1.2 2.1 1.9 3.5 1.9H17M3 13.5h2.2c1.4 0 2.7-.7 3.5-1.9M11.3 8.4c.8-1.2 2.1-1.9 3.5-1.9H17M15 4.5l2 2-2 2M15 11.5l2 2-2 2"/>',
  more: '<circle cx="5" cy="10" r=".75"/><circle cx="10" cy="10" r=".75"/><circle cx="15" cy="10" r=".75"/>',
  search: '<circle cx="9" cy="9" r="5.25"/><path d="m13 13 3.5 3.5"/>',
  hint: '<path d="M7.5 12.25c-1.3-.9-2.2-2.4-2.2-4.1a4.7 4.7 0 0 1 9.4 0c0 1.7-.9 3.2-2.2 4.1v1.5h-5z"/><path d="M8.25 16.5h3.5"/>',
  trash: '<path d="M3.5 5.75h13M8 5.75V4.5c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v1.25M5.25 5.75l.7 9.9c.06.8.72 1.35 1.5 1.35h5.1c.78 0 1.44-.55 1.5-1.35l.7-9.9"/>',
  flag: '<path d="M5 17V3.5M5 4h9.5l-2.25 3.5L14.5 11H5"/>',
  sliders: '<path d="M3 6h2M9 6h8M3 14h8M15 14h2"/><circle cx="7" cy="6" r="2"/><circle cx="13" cy="14" r="2"/>',
  refresh: '<path d="M16 10a6 6 0 1 1-1.76-4.24M16 3.5v3h-3"/>',
} as const;
export type IconName = keyof typeof ICONS;

export const Icon = memo(function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
});

export function Logo() {
  return (
    <span className="logo">
      <svg className="logo__mark" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 17H17V3Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className="logo__word">vriant</span>
    </span>
  );
}

// ——— Buttons ———
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'm' | 's';
  icon?: IconName;
  trailing?: IconName;
  block?: boolean;
  busy?: boolean;
};
export function Button({ variant = 'primary', size = 'm', icon, trailing, block, busy, className = '', children, ...rest }: ButtonProps) {
  const is = size === 's' ? 16 : 20;
  return (
    <button type="button" className={`btn btn--${variant} btn--${size}${block ? ' btn--block' : ''} ${className}`} aria-busy={busy || undefined} {...rest}>
      {busy ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={is} />}
      <span>{children}</span>
      {trailing && !busy && <Icon name={trailing} size={is} />}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; variant?: 'ghost' | 'secondary'; size?: 'm' | 's'; pressed?: boolean };
export function IconButton({ icon, label, variant = 'ghost', size = 'm', pressed, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn--${variant} icon-btn--${size}${pressed ? ' is-pressed' : ''} ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      data-tip={label}
      {...rest}
    >
      <Icon name={icon} size={size === 's' ? 16 : 20} />
    </button>
  );
}

// ——— Labels & tags ———
export function SectionLabel({ index, title, meta }: { index: string; title: string; meta?: ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-label__idx">{index}</span>
      <span className="section-label__title">{title}</span>
      <span className="section-label__rule" aria-hidden="true" />
      {meta !== undefined && <span className="section-label__meta">{meta}</span>}
    </div>
  );
}

export function Tag({ tone, icon, children }: { tone: Tone | 'accent' | 'highlight'; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`tag tag--${tone}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function ClassTag({ hue, children }: { hue: Hue; children: ReactNode }) {
  return (
    <span className="ctag">
      <span className="dot" style={{ background: `var(--tag-${hue})` }} />
      {children}
    </span>
  );
}

export function Mark({ result, small }: { result: Result; small?: boolean }) {
  const label = { correct: 'Correct', partial: 'Partial credit', incorrect: 'Incorrect', skipped: 'Skipped' }[result];
  return (
    <span className={`mark mark--${result}${small ? ' mark--s' : ''}`} role="img" aria-label={label}>
      {result === 'partial' ? <span className="mark__half">½</span> : <Icon name={result === 'correct' ? 'check' : result === 'incorrect' ? 'close' : 'minus'} size={small ? 11 : 14} />}
    </span>
  );
}

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>;

// ——— Controls ———
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: { value: T; label: string; icon?: IconName; iconOnly?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onChange(options[(i + 1) % options.length].value);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onChange(options[(i - 1 + options.length) % options.length].value);
    else return;
    e.preventDefault();
  };
  return (
    <div className={`seg ${className}`} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            tabIndex={on ? 0 : -1}
            className={`seg__opt${o.iconOnly && !on ? ' seg__opt--icon' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {(!o.iconOnly || on) && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

export function Checkbox({ checked, onChange, disabled, children }: { checked: boolean; onChange: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={`check${disabled ? ' is-disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="check__box" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
      <span className="check__label">{children}</span>
    </label>
  );
}

// ——— Maths ———
// KaTeX (~270 kB) is only needed for worked solutions, so it loads on demand and is prefetched during practice.
type KatexModule = typeof import('katex');
let katexModule: KatexModule | null = null;
let katexLoading: Promise<KatexModule> | null = null;
export function loadKatex() {
  katexLoading ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => (katexModule = m));
  return katexLoading;
}

export const TeX = memo(function TeX({ tex, className = '' }: { tex: string; className?: string }) {
  const [ready, setReady] = useState(!!katexModule);
  useEffect(() => {
    if (!ready) loadKatex().then(() => setReady(true));
  }, [ready]);
  const html = useMemo(() => (ready && katexModule ? katexModule.default.renderToString(tex, { throwOnError: false, output: 'html' }) : ''), [ready, tex]);
  return html ? <span className={`tex ${className}`} dangerouslySetInnerHTML={{ __html: html }} /> : <span className={`tex tex--pending ${className}`} aria-busy="true" />;
});

// ——— Menu (popover) ———
export function Menu({ label, icon = 'more', size = 's', children }: { label: string; icon?: IconName; size?: 'm' | 's'; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      <IconButton icon={icon} label={label} size={size} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="menu" role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, children, danger, onSelect }: { icon: IconName; children: ReactNode; danger?: boolean; onSelect: () => void }) {
  return (
    <button type="button" role="menuitem" className={`menu__item${danger ? ' menu__item--danger' : ''}`} onClick={onSelect}>
      <Icon name={icon} size={16} />
      <span>{children}</span>
    </button>
  );
}
