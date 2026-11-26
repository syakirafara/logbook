import { useWallet } from '@solana/wallet-adapter-react';
import type { PublicKey } from '@solana/web3.js';
import { useState, type FormEvent } from 'react';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { ConnectPrompt } from '../../components/ConnectPrompt';
import { ConnectedAs } from '../../components/ConnectedAs';
import { RoleHeader } from '../../components/RoleHeader';
import { TextField } from '../../components/TextField';
import { TxStatus } from '../../components/TxStatus';
import { useChainClock } from '../../hooks/useChainClock';
import { useParaf } from '../../hooks/useParaf';
import { useTx } from '../../hooks/useTx';
import { byteLength } from '../../lib/bytes';
import { formatSol, parseSol } from '../../lib/format';
import { registerInternshipIx } from '../../lib/instructions';
import { MAX_HOST_ORG_BYTES } from '../../lib/limits';
import { internshipPda } from '../../lib/paraf';
import { t } from '../../strings';
import {
  checkForm,
  DAY_PRESETS,
  EMPTY_FORM,
  REVIEW_PRESETS,
  toLocalInput,
  type DayPreset,
  type FormErrors,
  type RegisterForm,
  type ReviewPreset,
} from './registerForm';
import { RegisterSuccess } from './RegisterSuccess';

const dayOptions = (Object.keys(DAY_PRESETS) as DayPreset[]).map((value) => ({
  value,
  label: t.register.dayPresets[value],
}));
const reviewOptions = (Object.keys(REVIEW_PRESETS) as ReviewPreset[]).map((value) => ({
  value,
  label: t.register.reviewPresets[value],
}));

/** Coordinator view: create an internship (register_internship). */
export function RegisterView({ onOpenVerify }: { onOpenVerify: (internship: string) => void }) {
  const { publicKey } = useWallet();
  const { program } = useParaf();
  const { now } = useChainClock();
  const tx = useTx();
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [created, setCreated] = useState<{ address: PublicKey; signature: string } | null>(null);

  if (!publicKey) {
    return (
      <>
        <RoleHeader role="register" />
        <ConnectPrompt text={t.wallet.connectCoordinator} />
      </>
    );
  }

  if (created) {
    const startOver = () => {
      setCreated(null);
      setForm(EMPTY_FORM);
      setShowErrors(false);
      tx.reset();
    };
    return (
      <>
        <RoleHeader role="register" />
        <RegisterSuccess
          address={created.address}
          signature={created.signature}
          onOpenVerify={onOpenVerify}
          onAnother={startOver}
        />
      </>
    );
  }

  // The connected wallet is the coordinator: it signs and pays.
  const coordinator = publicKey;
  const update = (patch: Partial<RegisterForm>) => setForm((current) => ({ ...current, ...patch }));
  // The start time is checked against the blockchain clock, the same clock the program uses.
  const { errors, values } = checkForm(form, now);
  // Errors appear after the first try, then update while typing.
  const shown: FormErrors = showErrors ? errors : {};

  // Picking a day length also suggests a matching review window.
  const chooseDayPreset = (dayPreset: DayPreset) => {
    let reviewPreset = form.reviewPreset;
    if (dayPreset === 'demo' && reviewPreset !== 'custom') reviewPreset = 'demo';
    if (dayPreset === 'real' && reviewPreset === 'demo') reviewPreset = 'twoDays';
    update({ dayPreset, reviewPreset });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (!values) return;
    // Any number that is unique for this coordinator works. The time in milliseconds is simple.
    // It is one of the seeds, so it decides the internship's address.
    const internshipId = BigInt(Date.now());
    const address = internshipPda(program.programId, coordinator, internshipId);
    const signature = await tx.run(t.register.txLabel, async () => [
      await registerInternshipIx(program, { coordinator, internshipId, ...values }),
    ]);
    if (signature) setCreated({ address, signature });
  };

  const stipend = parseSol(form.stipendSol);
  const dayCount = Number(form.days);
  const totalLocked =
    stipend !== null && stipend > 0n && Number.isInteger(dayCount) && dayCount > 0 ? stipend * BigInt(dayCount) : null;
  const selfRegistered = form.intern.trim() === coordinator.toBase58();

  return (
    <>
      <RoleHeader role="register" />
      <ConnectedAs />
      <form className="card form" onSubmit={submit} noValidate>
        <TextField
          id="intern"
          label={t.register.internLabel}
          help={t.register.internHelp}
          error={shown.intern}
          value={form.intern}
          onChange={(intern) => update({ intern })}
          mono
        >
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => update({ intern: coordinator.toBase58() })}
          >
            {t.register.useMyWallet}
          </button>
        </TextField>
        {selfRegistered && <p className="note note-warn">{t.register.selfRegistered}</p>}

        <TextField
          id="supervisor"
          label={t.register.supervisorLabel}
          help={t.register.supervisorHelp}
          error={shown.supervisor}
          value={form.supervisor}
          onChange={(supervisor) => update({ supervisor })}
          mono
        />

        <TextField
          id="hostOrg"
          label={t.register.hostOrgLabel}
          help={`${t.register.hostOrgHelp} ${t.intern.bytes(byteLength(form.hostOrg.trim()), MAX_HOST_ORG_BYTES)}`}
          error={shown.hostOrg}
          value={form.hostOrg}
          onChange={(hostOrg) => update({ hostOrg })}
          placeholder={t.register.hostOrgPlaceholder}
        />

        <ChoiceGroup
          name="startMode"
          legend={t.register.startLabel}
          options={[
            { value: 'now', label: t.register.startNow },
            { value: 'later', label: t.register.startLater },
          ]}
          value={form.startMode}
          onChange={(startMode) =>
            update({ startMode, startAt: form.startAt || toLocalInput(new Date(Date.now() + 10 * 60_000)) })
          }
        />
        {form.startMode === 'later' && (
          <TextField
            id="startAt"
            type="datetime-local"
            label={t.register.startAtLabel}
            help={t.register.startAtHelp}
            error={shown.startAt}
            value={form.startAt}
            onChange={(startAt) => update({ startAt })}
          />
        )}

        <ChoiceGroup
          name="dayPreset"
          legend={t.register.dayLengthLabel}
          options={dayOptions}
          value={form.dayPreset}
          onChange={chooseDayPreset}
        />
        {form.dayPreset === 'custom' && (
          <TextField
            id="customDaySecs"
            label={t.register.secondsLabel}
            error={shown.customDaySecs}
            value={form.customDaySecs}
            onChange={(customDaySecs) => update({ customDaySecs })}
            inputMode="numeric"
          />
        )}

        <ChoiceGroup
          name="reviewPreset"
          legend={t.register.reviewLabel}
          help={t.register.reviewHelp}
          options={reviewOptions}
          value={form.reviewPreset}
          onChange={(reviewPreset) => update({ reviewPreset })}
        />
        {form.reviewPreset === 'custom' && (
          <TextField
            id="customReviewSecs"
            label={t.register.secondsLabel}
            error={shown.customReviewSecs}
            value={form.customReviewSecs}
            onChange={(customReviewSecs) => update({ customReviewSecs })}
            inputMode="numeric"
          />
        )}

        <TextField
          id="days"
          label={t.register.daysLabel}
          error={shown.days}
          value={form.days}
          onChange={(days) => update({ days })}
          inputMode="numeric"
        />

        <TextField
          id="stipendSol"
          label={t.register.stipendLabel}
          help={t.register.stipendHelp}
          error={shown.stipendSol}
          value={form.stipendSol}
          onChange={(stipendSol) => update({ stipendSol })}
          placeholder={t.register.stipendPlaceholder}
          inputMode="decimal"
        />
        {totalLocked !== null && <p className="note">{t.register.totalLocked(formatSol(totalLocked))}</p>}

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={tx.busy}>
            {t.register.submit}
          </button>
        </div>
        <TxStatus tx={tx} />
      </form>
    </>
  );
}
