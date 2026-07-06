export default function TDModal({
  open,
  title = '',
  children,
  onClose,
  footer = null,
  size = 'md'
}) {
  if (!open) return null;

  return (
    <div className="td-modal-overlay" onClick={onClose}>
      <div
        className={`td-modal td-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="td-modal-header">
          <h3>{title}</h3>

          <button
            className="td-modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="td-modal-body">
          {children}
        </div>

        {footer && (
          <div className="td-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
