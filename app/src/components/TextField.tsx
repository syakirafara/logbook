import type { ReactNode } from 'react';
import { Field } from './Field';

/**
 * A labelled text input with help and error text. `children` (for example a button)
 * is shown on the same row as the input.
 */
export function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  error?: string | null;
  placeholder?: string;
  /** Monospace font, for addresses. */
  mono?: boolean;
  inputMode?: 'text' | 'numeric' | 'decimal';
  type?: 'text' | 'datetime-local';
  children?: ReactNode;
}) {
  const { id, label, value, onChange, help, error, placeholder, mono, inputMode, type = 'text', children } = props;
  const input = (
    <input
      id={id}
      type={type}
      className={mono ? 'mono' : undefined}
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="off"
      spellCheck={false}
      aria-invalid={Boolean(error)}
      aria-describedby={`${id}-help ${id}-error`}
    />
  );
  return (
    <Field id={id} label={label} help={help} error={error}>
      {children ? (
        <div className="input-row">
          {input}
          {children}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}
