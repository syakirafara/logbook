import type { Internship } from '../lib/paraf';
import { formatDateTime, shortAddress } from '../lib/format';
import { t } from '../strings';

/** A drop-down to choose between internships, shown only when there is more than one. */
export function InternshipPicker(props: {
  internships: Internship[];
  selected: string;
  onSelect: (address: string) => void;
}) {
  const { internships, selected, onSelect } = props;
  if (internships.length < 2) return null;
  return (
    <div className="field picker">
      <label htmlFor="internship-picker">{t.intern.choose}</label>
      <select id="internship-picker" value={selected} onChange={(event) => onSelect(event.target.value)}>
        {internships.map((internship) => (
          <option key={internship.address.toBase58()} value={internship.address.toBase58()}>
            {internship.hostOrg} · {formatDateTime(internship.startTs)} · {shortAddress(internship.address)}
          </option>
        ))}
      </select>
    </div>
  );
}
