import { useChainClock } from '../hooks/useChainClock';
import { formatCountdown } from '../lib/format';

/** Time left until `to` (Unix seconds), measured with the chain clock. Updates every second. */
export function Countdown({ to }: { to: number }) {
  const { now } = useChainClock();
  return <span className="countdown">{formatCountdown(to - now)}</span>;
}
