import { createPortal } from "react-dom";
import Hyperspace from "./Hyperspace.jsx";

/**
 * Full-screen "warp" loader shown while the backend is working
 * (login / register / otp verify / google details).
 * Portaled to <body> so no transformed/blurred ancestor can trap it.
 */
export default function Warp({ active, label = "Hold tight…" }) {
  if (!active) return null;

  return createPortal(
    <div className="warp-overlay" role="status" aria-live="polite">
      <Hyperspace
        style={{ position: "absolute", inset: 0 }}
        background="#01020A"
        colors={["#0047FF", "#FFF000", "#FF6800", "#00FFA8", "#C7D2FE"]}
        density={450}
        speed={30}
        tunnel={{ glow: "#7464FFE6", roll: 90, opacity: 100 }}
      />
      <div className="warp-label">{label}</div>
    </div>,
    document.body
  );
}
