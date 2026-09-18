export default function TDInput({
  label = '',
  value,
  onChange,
  placeholder = '',
  type = 'text',
  name,
  required = false,
  disabled = false,
  className = '',
  helper = '',
  error = '',
  as = 'input',
  rows = 4,
  ...props
}) {
  const inputClassName = [
    'td-input',
    error ? 'td-input-error' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className="td-input-wrap">
      {label && <span className="td-input-label">{label}</span>}

      {as === 'textarea' ? (
        <textarea
          className={inputClassName}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          required={required}
          disabled={disabled}
          rows={rows}
          {...props}
        />
      ) : (
        <input
          className={inputClassName}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          required={required}
          disabled={disabled}
          {...props}
        />
      )}

      {helper && !error && <small className="td-input-helper">{helper}</small>}
      {error && <small className="td-input-error-text">{error}</small>}
    </label>
  );
}
