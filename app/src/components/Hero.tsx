import type { KeyboardEvent } from 'react';
import { useStamp } from '../hooks/useStamp';
import type { DayState } from '../lib/schedule';
import { STATE_SYMBOL } from '../lib/symbols';
import type { TabId } from '../lib/tabs';
import { t } from '../strings';
import { Icon } from './Icon';
import { Stamp } from './Stamp';

// The little calendar in the illustration: a made-up week.
const SAMPLE_WEEK: DayState[] = ['approved', 'approved', 'autoApproved', 'approved', 'missing', 'today', 'upcoming'];

/** The intro at the top: what Paraf is, two buttons to start, the four rules, and a stamped sample page. */
export function Hero({ onGo }: { onGo: (tab: TabId) => void }) {
  const { showStamp } = useStamp();

  // The sample page works like a button (it holds a list, so it cannot be a real <button>).
  const replay = () => showStamp('approved');
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      replay();
    }
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-main">
        <div className="hero-copy">
          <p className="hero-eyebrow">{t.hero.eyebrow}</p>
          <h2 id="hero-title" className="hero-title">
            {t.hero.titleStart}
            <mark>{t.hero.titleMark}</mark>
            {t.hero.titleEnd}
          </h2>
          <p className="hero-text">{t.hero.text}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onGo('intern')}>
              {t.hero.ctaIntern}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onGo('verify')}>
              {t.hero.ctaVerify}
            </button>
          </div>
        </div>

        {/* A sample logbook page with the stamp on it. Clicking it replays the big stamp. */}
        <div className="hero-art">
          <div
            className="sample-button"
            role="button"
            tabIndex={0}
            aria-label={t.hero.replayStamp}
            onClick={replay}
            onKeyDown={onKeyDown}
          >
            <div className="sample-page" aria-hidden="true">
              <div className="sample-head">
                <strong>{t.common.day(3)}</strong>
                <span>Rabu, 08.00</span>
              </div>
              <p className="sample-line">Membantu input data wajib pajak dan merapikan arsip.</p>
              <p className="sample-line short">Belajar membuat laporan bulanan.</p>
              <ol className="sample-week">
                {SAMPLE_WEEK.map((state, i) => (
                  <li key={i} className={`cell state-${state}`}>
                    <span className="cell-day">{i + 1}</span>
                    <span className="cell-symbol">{STATE_SYMBOL[state]}</span>
                  </li>
                ))}
              </ol>
              <div className="sample-stamp">
                <Stamp kind="approved" />
              </div>
            </div>
          </div>
          <p className="sample-hint" aria-hidden="true">
            {t.hero.replayStamp}
          </p>
        </div>
      </div>

      <div className="section-head">
        <p className="eyebrow">{t.hero.featuresEyebrow}</p>
        <h2>{t.hero.featuresTitle}</h2>
      </div>
      <ol className="hero-features">
        {t.hero.features.map((feature, i) => (
          <li key={feature.title} className="feature">
            <div className="feature-top">
              <span className="feature-icon">
                <Icon name={feature.icon} />
              </span>
              <span className="feature-number" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
