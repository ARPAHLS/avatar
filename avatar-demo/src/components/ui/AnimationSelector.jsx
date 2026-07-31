import { getSelectableAnimations, listAnimationGroups } from '../../config/animations';

export function AnimationSelector({ value, onChange, disabled = false }) {
  const groups = listAnimationGroups();
  const selectable = getSelectableAnimations();

  return (
    <div className="animation-selector">
      <label className="animation-selector__label" htmlFor="animation-select">
        Animation
      </label>
      <select
        id="animation-select"
        className="animation-selector__select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {selectable
              .filter((entry) => (entry.group ?? 'Other') === group)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
