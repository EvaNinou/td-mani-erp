export default function TDCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  onClick,
  style = {}
}) {
  const classes = [
    'td-card',
    variant === 'gold' ? 'td-card-gold' : '',
    variant === 'danger' ? 'td-card-danger' : '',
    hover ? 'td-card-hover' : '',
    onClick ? 'td-card-clickable' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
