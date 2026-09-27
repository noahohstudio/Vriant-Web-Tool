# Vriant

Turn this week's homework into next week's practice. Scan a sheet, practise variants of your own problems, hand it back for grading, and file it by class.

This repo holds the **working prototype** (Vite + React + TypeScript). Design intent, tokens and decisions live in [`HANDOFF.md`](./HANDOFF.md). Visuals are in the [Figma file](https://www.figma.com/design/d6rHTEFeSFwl2hGy61SOMY/Vriant-Design-System---Screens).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## What's real, what's simulated

| Real | Simulated (for now) |
|---|---|
| Variant generation from 5 kinematics templates (new values in sensible ranges; easier / same / harder) | Scanning and problem detection. Any upload loads the sample *Kinematics — Worksheet 4* |
| Answers computed from the formula, never generated | Paper hand-in. It grades the answers you typed |
| Grading: tolerance aware of significant figures, partial credit, and common-mistake detection with plain-language feedback | PDF previews |
| Multiple-choice distractors built from those common mistakes | |
| Worked solutions (KaTeX) on the node rail | |
| Signature / Light / Dark themes, saved per device | |
| Archive, classes, move/delete with Undo (`localStorage`); the working session lasts only for the tab (`sessionStorage`) | |
| Keyboard: `Enter` next · `H` hint · `F` flag · `S` skip · `1–4` choose | |

## Smoothness

The prototype is built so it doesn't drop frames:

- **Motion is compositor-only.** Everything that moves animates `transform` or `opacity`: the scan line, progress bars, cards, toasts, menus, the toggle knob, and the nav bar that sits on the header rule.
- **Theme changes use View Transitions.** The browser cross-fades a snapshot of the old theme into the new one, rather than transitioning colours on every element. A theme flip costs about 1–5 ms on the main thread. Browsers without View Transitions switch instantly, and `prefers-reduced-motion` turns all motion off.
- **Screen changes use View Transitions too.** The header and footer hold still, the rail cross-fades, and the screen lifts in.
- **State updates are narrow.** Components subscribe to small slices of state (`useSyncExternalStore`), so typing an answer re-renders the answer field, not the app. The timer re-renders one text node per second.
- **KaTeX loads lazily.** It's about 260 kB, so it's split out and prefetched while you practise, which keeps first load at roughly 90 kB gzipped JS.

## Structure

```
src/
  lib/problems.ts     templates → variants → grading → worked steps
  lib/store.ts        app state, persistence, navigation + theme transitions
  components/         ui primitives, question parts, dropzone, app shell
  screens/            intake + review · practice + hand in · results · archive
  styles/tokens.css   design tokens from Figma (Signature / Light / Dark)
  styles/app.css      components and layout (the line system lives here)
```
