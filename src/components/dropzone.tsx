import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Button, Icon, Kbd } from './ui';

type Phase = 'idle' | 'over' | 'scanning' | 'failed';
/** Stock captions advance on this timer until the reader reports what it's actually doing. */
const STEP_MS = 600;

/** The intake stage: drag & drop, file picker, camera or paste (a file, or text). Scanning is a compositor-only animation. */
const SHEET_PHASES = ['Reading the text on each page', 'Finding each problem', 'Matching problems to topics'];

export function Dropzone({
  title,
  subtitle,
  onFile,
  allowSample,
  scanTitle = 'Reading your sheet',
  phases = SHEET_PHASES,
  accept = 'application/pdf,image/*,text/plain,.txt,.md',
  fallback,
}: {
  title: string;
  subtitle: string;
  /** Does the work; resolve when done (the screen usually changes), throw to show why it failed. */
  onFile: (file: File | null, report: (caption: string) => void) => void | Promise<void>;
  allowSample?: boolean;
  scanTitle?: string;
  phases?: string[];
  accept?: string;
  /** Offered beside "Try another file" when reading fails. */
  fallback?: { label: string; onClick: () => void };
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [caption, setCaption] = useState(phases[0]);
  const [failure, setFailure] = useState('');
  const depth = useRef(0);
  const timers = useRef<number[]>([]);
  const alive = useRef(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const start = async (file: File | null) => {
    if (phaseRef.current === 'scanning') return;
    depth.current = 0;
    setPhase('scanning');
    setCaption(phases[0]);
    let reported = false;
    const report = (c: string) => {
      reported = true;
      if (alive.current) setCaption(c);
    };
    timers.current = phases.slice(1).map((p, i) => window.setTimeout(() => !reported && alive.current && setCaption(p), STEP_MS * (i + 1)));
    try {
      await onFile(file, report);
      if (alive.current) setPhase('idle');
    } catch (e) {
      if (!alive.current) return;
      setFailure(e instanceof Error && e.message ? e.message : 'Something went wrong reading that file.');
      setPhase('failed');
    } finally {
      timers.current.forEach(clearTimeout);
    }
  };
  const startRef = useRef(start);
  startRef.current = start;
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void start(file);
  };

  useEffect(() => {
    alive.current = true;
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
      const file = Array.from(e.clipboardData?.files ?? [])[0];
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (file) void startRef.current(file);
      else if (text.trim().length >= 12) void startRef.current(new File([text], 'Pasted text.txt', { type: 'text/plain' }));
    };
    window.addEventListener('paste', onPaste);
    return () => {
      alive.current = false;
      window.removeEventListener('paste', onPaste);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const drag = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      depth.current++;
      if (phaseRef.current === 'idle' || phaseRef.current === 'failed') setPhase('over');
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0 && phaseRef.current === 'over') setPhase('idle');
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void start(file);
      else setPhase('idle');
    },
  };

  return (
    <div className={`dropzone dropzone--${phase}`} {...drag}>
      <span className="dz-corner dz-corner--tl" aria-hidden="true" />
      <span className="dz-corner dz-corner--tr" aria-hidden="true" />
      <span className="dz-corner dz-corner--br" aria-hidden="true" />
      <span className="dz-corner dz-corner--bl" aria-hidden="true" />

      {phase === 'scanning' ? (
        <div className="dz-body" role="status" aria-live="polite">
          <div className="dz-sheet" aria-hidden="true">
            {[56, 96, 80, 60, 96, 72, 50, 90].map((w, i) => (
              <i key={i} style={{ width: w }} />
            ))}
            <b style={{ top: 10, animationDelay: '0.45s' }} />
            <b style={{ top: 62, animationDelay: '0.95s' }} />
            <b style={{ top: 114, animationDelay: '1.4s' }} />
            <span className="dz-sheet__scan" />
          </div>
          <p className="t-heading-s">{scanTitle}…</p>
          <p className="t-body-s c-tertiary dz-caption" key={caption}>
            {caption}
          </p>
          <span className="dz-loader dz-loader--live">
            <i />
          </span>
        </div>
      ) : phase === 'failed' ? (
        <div className="dz-body" role="alert">
          <span className="dz-disc">
            <Icon name="hint" size={22} />
          </span>
          <p className="t-heading-m">We couldn’t read that one</p>
          <p className="t-body-s c-secondary dz-failure">{failure}</p>
          <div className="dz-actions">
            <Button icon="upload" onClick={() => fileRef.current?.click()}>
              Try another file
            </Button>
            {fallback && (
              <Button variant="secondary" icon="search" onClick={fallback.onClick}>
                {fallback.label}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="dz-body">
          <span className="dz-disc">
            <Icon name={phase === 'over' ? 'upload' : 'scan'} size={22} />
          </span>
          <p className="t-heading-m">{phase === 'over' ? 'Let go to read it' : title}</p>
          <p className="t-body-s c-tertiary">{subtitle}</p>
          <div className="dz-actions">
            <Button icon="upload" onClick={() => fileRef.current?.click()}>
              Choose a file
            </Button>
            <Button variant="secondary" icon="camera" onClick={() => camRef.current?.click()}>
              Use camera
            </Button>
          </div>
          <p className="dz-hint t-mono-s c-tertiary">
            or paste a file or text with <Kbd>⌘</Kbd>
            <Kbd>V</Kbd>
            {allowSample && (
              <>
                {' · '}
                <button type="button" className="link" onClick={() => void start(null)}>
                  try the sample sheet
                </button>
              </>
            )}
          </p>
        </div>
      )}

      <input ref={fileRef} type="file" accept={accept} hidden onChange={pick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
    </div>
  );
}
