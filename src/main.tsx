import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';
import { getState, ready } from './lib/store';

document.documentElement.dataset.theme = getState().theme;

// The loading screen (index.html): its wordmark appears once Geist has loaded, so the type never visibly swaps.
const splash = document.getElementById('splash');
const fonts = Promise.race([document.fonts?.load('600 40px "Geist Variable"') ?? Promise.resolve(), new Promise((r) => window.setTimeout(r, 1200))]).catch(() => undefined);
void fonts.then(() => splash?.classList.add('is-ready'));

declare global {
  interface Window {
    /** Set once the app has rendered; index.html's watchdog stands down. */
    vriantStarted?: boolean;
    vriantBoot?: number;
    /** Shows the loading screen's "didn't finish loading" message (index.html). */
    vriantFail?: (why?: string) => void;
  }
}

// Load whatever the saved session needs (its course file), then render underneath the loading screen.
async function start() {
  try {
    await ready();
  } catch {
    // ready() already falls back to Intake; nothing else should keep the app from starting.
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  window.vriantStarted = true;
  window.clearTimeout(window.vriantBoot);
  if (!splash || getComputedStyle(splash).display === 'none') return splash?.remove();
  await fonts;
  try {
    sessionStorage.setItem('vriant:splash', '1');
  } catch {
    /* storage blocked: the screen simply shows again next time */
  }
  // On the first visit it stays about a second, so the mark is seen rather than flashed.
  window.setTimeout(() => {
    splash.classList.add('is-leaving');
    window.setTimeout(() => splash.remove(), 400);
  }, Math.max(0, 1000 - performance.now()));
}

start().catch(() => window.vriantFail?.('Something went wrong starting Vriant. Reload to try again.'));
