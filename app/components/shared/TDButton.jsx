export default function TDButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  className = '',
  onClick,
  style = {}
}) {
  const classes = [
    'td-button',
    variant === 'secondary' ? 'td-button-secondary' : '',
    variant === 'danger' ? 'td-button-danger' : '',
    variant === 'ghost' ? 'td-button-ghost' : '',
    size === 'sm' ? 'td-button-sm' : '',
    size === 'lg' ? 'td-button-lg' : '',
    full ? 'td-button-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}
