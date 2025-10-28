
import React, { useState } from 'react';
import TrackerPage from './pages/TrackerPage';
import JournalPage from './pages/JournalPage';
import PrayerListPage from './pages/PrayerListPage';
import JesusSaidPage from './pages/JesusSaidPage';
import SettingsPage from './pages/SettingsPage';
import MorePage from './pages/MorePage';
import BiblePage from './pages/BiblePage';
import MessageNotesPage from './pages/MessageNotesPage';
import SmallGroupSharePage from './pages/SmallGroupSharePage';
import BiblePlansPage from './pages/BiblePlansPage';
import BottomNav from './components/BottomNav';
import Header from './components/Header';

// FIX: Added 'ai', 'iNeedYou', and 'quickRead' to the Page type to resolve type errors in BottomNav.tsx.
export type Page =
  | 'tracker'
  | 'journal'
  | 'prayer'
  | 'jesusSaid'
  | 'settings'
  | 'more'
  | 'bible'
  | 'messageNotes'
  | 'smallGroup'
  | 'biblePlans';

// FIX: Added titles for the new pages to avoid runtime errors.
const pageTitles: Record<Page, string> = {
  tracker: '聖經進度',
  journal: '靈修日記',
  prayer: '禱告清單',
  jesusSaid: '耶穌說',
  settings: '設定',
  more: '更多',
  bible: '聖經',
  messageNotes: '信息筆記',
  smallGroup: '小組分享',
  biblePlans: '讀經計畫',
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('bible');

  const renderPage = () => {
    switch (activePage) {
      case 'tracker':
        return <TrackerPage />;
      case 'journal':
        return <JournalPage />;
      case 'prayer':
        return <PrayerListPage />;
      case 'jesusSaid':
        return <JesusSaidPage />;
      case 'settings':
        return <SettingsPage />;
      case 'more':
        return <MorePage setActivePage={setActivePage} />;
      case 'bible':
        return <BiblePage />;
      case 'messageNotes':
        return <MessageNotesPage />;
      case 'smallGroup':
        return <SmallGroupSharePage />;
      case 'biblePlans':
        return <BiblePlansPage />;
      default:
        return <BiblePage />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-beige-100">
      <Header
        title={pageTitles[activePage]}
      />
      <main className="pb-20 pt-24 px-4">{renderPage()}</main>
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
};

export default App;
