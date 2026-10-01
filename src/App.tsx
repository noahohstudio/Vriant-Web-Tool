import type { ComponentType } from 'react';
import { Header, ToastHost } from './components/shell';
import { ArchiveMain, ArchiveRail, ArchiveStatus } from './screens/archive';
import { IntakeMain, IntakeRail, IntakeStatus, ReviewMain, ReviewRail, ReviewStatus } from './screens/intake';
import { HandInMain, HandInStatus, PracticeMain, PracticeRail, PracticeStatus } from './screens/practice';
import { ResultsMain, ResultsRail, ResultsStatus } from './screens/results';
import { TopicsMain, TopicsRail, TopicsStatus } from './screens/topics';
import { useStore, type Route } from './lib/store';

type Screen = { Main: ComponentType; Rail: ComponentType; Status: ComponentType };
const SCREENS: Record<Route, Screen> = {
  intake: { Main: IntakeMain, Rail: IntakeRail, Status: IntakeStatus },
  topics: { Main: TopicsMain, Rail: TopicsRail, Status: TopicsStatus },
  review: { Main: ReviewMain, Rail: ReviewRail, Status: ReviewStatus },
  practice: { Main: PracticeMain, Rail: PracticeRail, Status: PracticeStatus },
  handin: { Main: HandInMain, Rail: PracticeRail, Status: HandInStatus },
  results: { Main: ResultsMain, Rail: ResultsRail, Status: ResultsStatus },
  archive: { Main: ArchiveMain, Rail: ArchiveRail, Status: ArchiveStatus },
};

export default function App() {
  const route = useStore((s) => s.route);
  const { Main, Rail, Status } = SCREENS[route];
  const split = route === 'review' || route === 'results';
  return (
    <div className="app">
      <Header />
      <aside className="rail" aria-label="Context">
        <Rail />
      </aside>
      <main className="main" id="main" data-split={split || undefined}>
        <Main />
      </main>
      <footer className="footer">
        <span>vriant · nothing is kept unless you archive it</span>
        <span>
          <Status />
        </span>
      </footer>
      {/* Nodes mark the joints where the header, rail and footer rules meet. */}
      <span className="joint joint--top" aria-hidden="true" />
      <span className="joint joint--bottom" aria-hidden="true" />
      {split && (
        <>
          <span className="joint joint--top joint--split" aria-hidden="true" />
          <span className="joint joint--bottom joint--split" aria-hidden="true" />
        </>
      )}
      <ToastHost />
    </div>
  );
}
