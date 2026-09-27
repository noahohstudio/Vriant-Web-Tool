import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Button, Icon, Kbd } from './ui';

type Phase = 'idle' | 'over' | 'scanning';
const SCAN_MS = 1800;

/** The intake stage: drag & drop, file picker, camera or paste. Scanning is a compositor-only animation. */
export function Dropzone({ title, subtitle, onFile, allowSample }: { title: string; subtitle: string; onFile: (file: File | null) => void; allowSample?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [found, setFound] = useState(0);
  const depth = useRef(0);
  const timers = useRef<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const start = (file: File | null) => {
    if (phaseRef.current === 'scanning') return;
    depth.current = 0;
    setPhase('scanning');
    setFound(0);
    timers.current = [
      window.setTimeout(() => setFound(2), 450),
      window.setTimeout(() => setFound(4), 950),
      window.setTimeout(() => setFound(6), 1400),
      window.setTimeout(() => onFile(file), SCAN_MS),
    ];
  };
  const startRef = useRef(start);
  startRef.current = start;
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) start(file);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? [])[0];
      if (file) startRef.current(file);
    };
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const drag = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      depth.current++;
      if (phaseRef.current !== 'scanning') setPhase('over');
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
      if (file) start(file);
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
            <b style={{ top: 10, animationDelay: '0.4s' }} />
            <b style={{ top: 62, animationDelay: '0.9s' }} />
            <b style={{ top: 114, animationDelay: '1.35s' }} />
          </div>
          <p className="t-heading-s">Reading your sheet…</p>
          <p className="t-body-s c-tertiary">{found ? `Found ${found} problems so far` : 'Looking for problems'}</p>
        </div>
      ) : (
        <div className="dz-body">
          <span className="dz-disc">
            <Icon name={phase === 'over' ? 'upload' : 'scan'} size={22} />
          </span>
          <p className="t-heading-m">{phase === 'over' ? 'Let go to scan it' : title}</p>
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
            or paste with <Kbd>⌘</Kbd>
            <Kbd>V</Kbd>
            {allowSample && (
              <>
                {' · '}
                <button type="button" className="link" onClick={() => start(null)}>
                  try the sample sheet
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {phase === 'scanning' && <span className="dz-scanline" aria-hidden="true" />}
      <span className={`dz-progress${phase === 'scanning' ? ' is-running' : ''}`} aria-hidden="true">
        <i />
      </span>

      <input ref={fileRef} type="file" accept="application/pdf,image/*" hidden onChange={pick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
    </div>
  );
}
