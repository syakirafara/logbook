import type { KeyboardEvent } from 'react';
import { TAB_IDS, type TabId } from '../lib/tabs';
import { t } from '../strings';

/** The four role tabs. Each role has its own colour (see --role-* in styles/theme.css). */
export function TabBar({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  // Keyboard support for tabs: the left and right arrow keys move between them.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = TAB_IDS[(TAB_IDS.indexOf(active) + step + TAB_IDS.length) % TAB_IDS.length];
    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label={t.tabs.label} onKeyDown={onKeyDown}>
      {TAB_IDS.map((id) => (
        <button
          key={id}
          id={`tab-${id}`}
          type="button"
          role="tab"
          aria-selected={active === id}
          aria-controls="tab-panel"
          tabIndex={active === id ? 0 : -1}
          className={`tab role-${id}`}
          onClick={() => onChange(id)}
        >
          <span className="tab-name">{t.roles[id].tab}</span>
          <span className="tab-sub">{t.roles[id].sub}</span>
        </button>
      ))}
    </div>
  );
}
