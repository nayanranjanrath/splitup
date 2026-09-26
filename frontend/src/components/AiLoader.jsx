import { useEffect, useRef } from "react";
import { AI_SVG, AI_SCRIPT } from "./ailoader-assets.js";

/**
 * AI-verification loader: robot shuttling the proof image between folders
 * with a progress bar (re-themed gold/violet for SplitUp).
 */
export default function AiLoader({ label = "AI is verifying your proof images…" }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancel = false;
    let rafGuard;
    try {
      // run the extracted animation script once the svg is mounted
      const run = new Function(`${AI_SCRIPT}`);
      run();
    } catch {
      /* animation is decorative; never block the flow */
    }
    return () => {
      cancel = true;
      if (rafGuard) cancelAnimationFrame(rafGuard);
    };
  }, []);

  return (
    <div className="ai-loader" role="status" aria-live="polite">
      <div className="ai-loader-svg" ref={ref} dangerouslySetInnerHTML={{ __html: AI_SVG }} />
      <p className="ai-loader-label">{label}</p>
    </div>
  );
}
