import { useState, type ChangeEvent, type FormEvent } from 'react';
import { sameBytes } from '../../lib/bytes';
import { fingerprint, readProofFile } from '../../lib/hash';
import type { Entry } from '../../lib/paraf';
import { t } from '../../strings';

/**
 * Check a page's saved file (random salt + full text) against the fingerprint (detail_hash) stored on-chain.
 * The file is read and hashed in this browser with the same rules the intern's browser used; it is never uploaded.
 */
export function HashCheck({ entry }: { entry: Entry }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<'match' | 'noMatch' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changeText = (value: string) => {
    setText(value);
    setResult(null);
    setError(null);
  };

  // "Saved file": put the .txt file's contents into the box below. The file stays in this browser.
  const openFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      changeText(await file.text());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : String(problem));
    }
  };

  const check = async (event: FormEvent) => {
    event.preventDefault();
    const saved = readProofFile(text);
    if (!saved) {
      setResult(null);
      setError(t.verify.hashNotAFile);
      return;
    }
    try {
      const hash = await fingerprint(saved.salt, saved.text);
      setResult(sameBytes(hash, entry.detailHash) ? 'match' : 'noMatch');
      setError(null);
    } catch (problem) {
      setResult(null);
      setError(problem instanceof Error ? problem.message : String(problem));
    }
  };

  return (
    <form className="hash-check" onSubmit={check}>
      <h4>{t.verify.hashTitle}</h4>
      <p className="help">{t.verify.hashHelp}</p>
      <label htmlFor="hash-file">{t.verify.hashFileLabel}</label>
      <input id="hash-file" type="file" accept=".txt,text/plain" onChange={openFile} />
      <label htmlFor="hash-text">{t.verify.hashLabel}</label>
      <textarea id="hash-text" rows={6} value={text} onChange={(event) => changeText(event.target.value)} />
      <div className="actions">
        <button type="submit" className="btn btn-secondary" disabled={!text.trim()}>
          {t.verify.hashButton}
        </button>
      </div>
      <div aria-live="polite">
        {result === 'match' && <p className="note note-ok">✓ {t.verify.hashMatch}</p>}
        {result === 'noMatch' && <p className="note note-error">✕ {t.verify.hashNoMatch}</p>}
        {error && <p className="note note-error">{error}</p>}
      </div>
    </form>
  );
}
