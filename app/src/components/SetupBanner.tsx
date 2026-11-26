import type { ProgramIdProblem } from '../config';
import { t } from '../strings';

/** Shown instead of the app when VITE_PROGRAM_ID is missing or wrong, with the steps to fix it. */
export function SetupBanner({ problem }: { problem: ProgramIdProblem }) {
  return (
    <section className="card setup-banner" role="alert" aria-labelledby="setup-title">
      <h2 id="setup-title">{t.setup.title}</h2>
      <p>{t.setup[problem]}</p>
      <ol>
        {t.setup.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
