import type { TabId } from '../lib/tabs';
import { t } from '../strings';

/** The coloured heading at the top of each view, so it is always clear which role you are acting as. */
export function RoleHeader({ role }: { role: TabId }) {
  const text = t.roles[role];
  return (
    <div className={`role-header role-${role}`}>
      <span className="role-pill">{text.label}</span>
      <h2>{text.title}</h2>
      <p>{text.intro}</p>
    </div>
  );
}
