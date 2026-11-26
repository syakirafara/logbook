import { useState } from 'react';
import { t } from '../strings';

/** Copies text to the clipboard and says "Copied" for a moment. */
export function CopyButton({ text, label = t.common.copy }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the text is still on screen to copy by hand.
    }
  };

  return (
    <button type="button" className="btn btn-small btn-secondary" onClick={copy}>
      {copied ? t.common.copied : label}
    </button>
  );
}
