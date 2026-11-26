import type { StampKind } from '../hooks/useStamp';
import { t } from '../strings';

/**
 * A rubber stamp: "PARAF" when the supervisor approved, "SAH" when the page was approved by silence.
 * The same drawing is used big (the animation) and small (next to approved pages).
 */
export function Stamp({ kind, size = 'small' }: { kind: StampKind; size?: 'small' | 'big' }) {
  const word = kind === 'approved' ? t.stamp.approved : t.stamp.autoApproved;
  const sub = kind === 'approved' ? t.stamp.approvedSub : t.stamp.autoApprovedSub;
  return (
    <span className={`stamp stamp-${kind} stamp-${size}`} role="img" aria-label={`${word}: ${sub}`}>
      <span className="stamp-word" aria-hidden="true">
        {word}
      </span>
      <span className="stamp-sub" aria-hidden="true">
        {sub}
      </span>
    </span>
  );
}
