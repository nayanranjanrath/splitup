/**
 * Steam-style dual range slider: one line, two draggable ends (min/max).
 */
export default function DualRange({
  min = 0,
  max = 2000,
  step = 10,
  low,
  high,
  onLow,
  onHigh,
  format = (v) => v,
}) {
  const pct = (v) => ((v - min) / (max - min)) * 100;
  return (
    <div className="drange">
      <div className="drange-track" />
      <div
        className="drange-fill"
        style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        aria-label="Minimum"
        onChange={(e) => onLow(Math.min(Number(e.target.value), high - step))}
        className="drange-in drange-low"
        style={{ zIndex: low > min + (max - min) / 2 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        aria-label="Maximum"
        onChange={(e) => onHigh(Math.max(Number(e.target.value), low + step))}
        className="drange-in drange-high"
        style={{ zIndex: 4 }}
      />
      <div className="drange-vals">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>
    </div>
  );
}
