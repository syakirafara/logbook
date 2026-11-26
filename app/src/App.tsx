import { useState } from 'react';
import { ChainClockProvider } from './components/ChainClockProvider';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProgramCheck } from './components/ProgramCheck';
import { RecentTransactions } from './components/RecentTransactions';
import { SetupBanner } from './components/SetupBanner';
import { StampProvider } from './components/StampProvider';
import { TabBar } from './components/TabBar';
import { TxLogProvider } from './components/TxLogProvider';
import { WalletSetup } from './components/WalletSetup';
import { PROGRAM_ID, PROGRAM_ID_PROBLEM } from './config';
import { isTabId, type TabId } from './lib/tabs';
import { getUrlParam, setUrlParam } from './lib/url';
import { t } from './strings';
import { InternView } from './views/intern/InternView';
import { RegisterView } from './views/register/RegisterView';
import { SupervisorView } from './views/supervisor/SupervisorView';
import { VerifyView } from './views/verify/VerifyView';

/** ?tab=… wins; a shared link (?i=…) opens Verify; otherwise start at Register. */
function initialTab(): TabId {
  const fromUrl = getUrlParam('tab');
  if (isTabId(fromUrl)) return fromUrl;
  if (getUrlParam('i')) return 'verify';
  return 'register';
}

export default function App() {
  const [tab, setTab] = useState<TabId>(initialTab);

  const changeTab = (next: TabId) => {
    setTab(next);
    setUrlParam('tab', next); // so a page reload stays on the same tab
  };

  // The hero's buttons: open the tab and scroll down to it.
  const goTo = (next: TabId) => {
    changeTab(next);
    requestAnimationFrame(() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const openVerify = (internship: string) => {
    setUrlParam('i', internship);
    changeTab('verify');
  };

  return (
    <WalletSetup>
      <ChainClockProvider>
        <TxLogProvider>
          <StampProvider>
            <div className="app">
              <Header />
              <main className="main">
                {PROGRAM_ID ? (
                  <>
                    <ProgramCheck />
                    <Hero onGo={goTo} />
                    <div id="roles" className="roles">
                      <div className="section-head">
                        <p className="eyebrow">{t.tabs.eyebrow}</p>
                        <h2>{t.tabs.title}</h2>
                      </div>
                      <TabBar active={tab} onChange={changeTab} />
                      <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className={`panel role-${tab}`}>
                        {tab === 'register' && <RegisterView onOpenVerify={openVerify} />}
                        {tab === 'intern' && <InternView />}
                        {tab === 'supervisor' && <SupervisorView />}
                        {tab === 'verify' && <VerifyView />}
                      </div>
                    </div>
                  </>
                ) : (
                  <SetupBanner problem={PROGRAM_ID_PROBLEM ?? 'missing'} />
                )}
              </main>
              <Footer />
              <RecentTransactions />
            </div>
          </StampProvider>
        </TxLogProvider>
      </ChainClockProvider>
    </WalletSetup>
  );
}
