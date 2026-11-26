import type { FriendlyError } from '../lib/errors';
import { t } from '../strings';

/** A readable error, with the program logs folded away for anyone curious. */
export function ErrorNote({ error }: { error: FriendlyError }) {
  return (
    <div className="note note-error" role="alert">
      <strong>{error.title}</strong>
      {error.detail && <p>{error.detail}</p>}
      {error.logs && error.logs.length > 0 && (
        <details>
          <summary>{t.tx.logs}</summary>
          <pre className="logs">{error.logs.join('\n')}</pre>
        </details>
      )}
    </div>
  );
}
