/** A row of radio buttons styled as a segmented control. Works with the keyboard like normal radios. */
export function ChoiceGroup<T extends string>(props: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  help?: string;
}) {
  const { name, legend, options, value, onChange, help } = props;
  return (
    <fieldset className="field choice-group">
      <legend>{legend}</legend>
      <div className="choices">
        {options.map((option) => (
          <label key={option.value} className={option.value === value ? 'choice is-checked' : 'choice'}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {help && <p className="help">{help}</p>}
    </fieldset>
  );
}
