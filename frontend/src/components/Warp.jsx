import "./Warp.css";

export default function Warp({ active, label = "Please wait..." }) {
  if (!active) return null;

  return (
    <div className="warp-overlay">
      <div className="warp-content">
        <div className="warp-spinner" aria-hidden="true"></div>

        <p className="warp-label">{label}</p>
      </div>
    </div>
  );
}