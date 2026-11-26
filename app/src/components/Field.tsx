import type { ReactNode } from 'react';

/**
 * A form field: label, the input itself, help text and an error message.
 * Give the input aria-describedby={`${id}-help ${id}-error`} so screen readers read the help and error.
 */
export function Field(props: { id: string; label: string; help?: ReactNode; error?: string | null; children: ReactNode }) {
  const { id, label, help, error, children } = props;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help && (
        <p className="help" id={`${id}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
