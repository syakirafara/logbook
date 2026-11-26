import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StampContext, type StampApi, type StampKind } from '../hooks/useStamp';
import { Stamp } from './Stamp';

/** How long the stamp stays on screen, matching the CSS animation in app.css. */
const SHOW_MS = 2_200;

/** Shows the big stamp animation on top of the page whenever a page gets approved. */
export function StampProvider({ children }: { children: ReactNode }) {
  // A new key each time restarts the animation, even for two approvals in a row.
  const [shown, setShown] = useState<{ kind: StampKind; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showStamp = useCallback((kind: StampKind) => {
    clearTimeout(timer.current);
    setShown({ kind, key: Date.now() });
    timer.current = setTimeout(() => setShown(null), SHOW_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const api = useMemo<StampApi>(() => ({ showStamp }), [showStamp]);
  return (
    <StampContext.Provider value={api}>
      {children}
      {shown && (
        <div key={shown.key} className="stamp-overlay" aria-live="polite">
          <div className={`stamp-drop stamp-drop-${shown.kind}`}>
            <Stamp kind={shown.kind} size="big" />
          </div>
        </div>
      )}
    </StampContext.Provider>
  );
}
