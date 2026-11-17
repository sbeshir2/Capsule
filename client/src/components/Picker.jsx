// Picker.jsx - a dropdown menu built on Radix Select.
// Used for the closet filters and the add/edit form, in place of the
// browser's own <select>, so the open list matches the black-and-white
// look and works with the keyboard (arrow keys, typing a letter, Esc).
//
//   <Picker label="Color" value={color} onChange={setColor}
//           options={[{ value: '', label: 'All colors' }, { value: 'Black', label: 'Black', swatch: '#000' }]} />
//
// `value` is a plain string. An option with value '' means "any / none".
import { useId } from 'react';
import { Select } from 'radix-ui';

// Radix Select doesn't allow '' as an option value, so '' is swapped
// for this stand-in on the way in and back again on the way out.
const EMPTY = '__none__';

const Arrow = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M1 1.5l5 5 5-5" />
  </svg>
);
const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export default function Picker({
  label, value, onChange, options, placeholder,
  className = 'filter', labelClassName = 'filter-label'
}) {
  const labelId = useId();
  const hasEmptyOption = options.some(o => o.value === '');
  // '' with no "any" option shows the placeholder (e.g. "Choose a color")
  const current = value === '' ? (hasEmptyOption ? EMPTY : '') : value;

  return (
    <div className={className}>
      <span className={labelClassName} id={labelId}>{label}</span>
      <Select.Root value={current} onValueChange={v => onChange(v === EMPTY ? '' : v)}>
        <Select.Trigger className="picker-trigger" aria-labelledby={labelId}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="picker-arrow"><Arrow /></Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className="picker-menu" position="popper" sideOffset={6} collisionPadding={12}>
            <Select.Viewport className="picker-list">
              {options.map(o => (
                <Select.Item key={o.value || EMPTY} value={o.value === '' ? EMPTY : o.value} className="picker-item">
                  <Select.ItemText>
                    {o.swatch && <span className="item-dot" style={{ background: o.swatch }} />}
                    {o.label}
                  </Select.ItemText>
                  <Select.ItemIndicator className="picker-tick"><Tick /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
