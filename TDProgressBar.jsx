export default function TDProgressBar({
  value = 0,
  max = 100,
  height = 10,
  showLabel = true,
  color = '#D4AF37'
}) {
  const percentage = Math.min(
    100,
    Math.max(0, (value / max) * 100)
  );

  return (
    <div className="td-progress-wrapper">
      <div
        className="td-progress"
        style={{ height }}
      >
        <div
          className="td-progress-fill"
          style={{
            width: `${percentage}%`,
            background: color
          }}
        />
      </div>

      {showLabel && (
        <span className="td-progress-label">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
